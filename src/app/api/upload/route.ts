import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_IMAGE_HEADER = /^data:image\/(jpeg|jpg|png|webp);base64,/;
const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // ~7MB base64 payload limit

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証ヘッダーがありません' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== 'string' || !VALID_IMAGE_HEADER.test(imageBase64)) {
      return NextResponse.json({ error: '無効な画像データです（JPEG/PNG/WebPのみ対応）' }, { status: 400 });
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: '画像サイズが大きすぎます（上限7MB）' }, { status: 400 });
    }

    const match = imageBase64.match(VALID_IMAGE_HEADER);
    const rawExt = match ? match[1] : 'jpeg';
    const ext = rawExt === 'jpg' ? 'jpeg' : rawExt;

    const base64Data = imageBase64.replace(VALID_IMAGE_HEADER, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '画像サイズが大きすぎます' }, { status: 400 });
    }

    const fileName = `${user.id}/${uuidv4()}.${ext}`;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: uploadError } = await adminClient
      .storage
      .from('diaries')
      .upload(fileName, buffer, {
        contentType: `image/${ext}`,
        upsert: false
      });

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
