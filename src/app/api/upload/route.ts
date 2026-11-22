import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_IMAGE_HEADER = /^data:image\/(jpeg|jpg|png|webp);base64,/;
const MAX_BASE64_LENGTH = Math.floor(4.4 * 1024 * 1024); // ~4.4MB base64 payload limit
const MAX_BINARY_BYTES = Math.floor(3.5 * 1024 * 1024); // 3.5MB binary limit

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証ヘッダーがありません' }, { status: 401 });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || supabaseServiceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }
    const { imageBase64 } = body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string' || !VALID_IMAGE_HEADER.test(imageBase64)) {
      return NextResponse.json({ error: '無効な画像データです（JPEG/PNG/WebPのみ対応）' }, { status: 400 });
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: '画像サイズが大きすぎます（上限3.5MB）' }, { status: 400 });
    }

    const match = imageBase64.match(VALID_IMAGE_HEADER);
    const rawExt = match ? match[1] : 'jpeg';
    const ext = rawExt === 'jpg' ? 'jpeg' : rawExt;

    const base64Data = imageBase64.replace(VALID_IMAGE_HEADER, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    if (buffer.length > MAX_BINARY_BYTES) {
      return NextResponse.json({ error: '画像サイズが大きすぎます（上限3.5MB）' }, { status: 400 });
    }

    const fileName = `${user.id}/${uuidv4()}.${ext}`;

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let { error: uploadError } = await adminClient
      .storage
      .from('diaries')
      .upload(fileName, buffer, {
        contentType: `image/${ext}`,
        upsert: false
      });

    if (uploadError) {
      await adminClient.storage.createBucket('diaries', { public: true }).catch(() => {});
      const retry = await adminClient
        .storage
        .from('diaries')
        .upload(fileName, buffer, {
          contentType: `image/${ext}`,
          upsert: false
        });
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: '画像のアップロードに失敗しました' }, { status: 500 });
    }

    const { data: { publicUrl } } = adminClient.storage.from('diaries').getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}
