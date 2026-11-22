import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_BUCKETS = ['islands', 'fairies', 'avatars', 'diary-photos', 'public-assets', 'accommodations'];

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'islands';
    const islandId = ((formData.get('islandId') as string) || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const photoType = ((formData.get('photoType') as string) || 'main').replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: '無効な保存先バケットです' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '対応していないファイル形式です（JPEG, PNG, WebP, GIFのみ対応）' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズは4MB以下にしてください' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const mimeExtMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const fileExt = mimeExtMap[file.type] || 'webp';
    const subFolder = islandId ? `cms-uploads/${islandId}` : 'cms-uploads';
    const fileName = `${Date.now()}-${photoType}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${subFolder}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    let { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    // バケットが未作成の場合は自動作成してリトライ
    if (uploadError) {
      await adminClient.storage.createBucket(bucket, { public: true }).catch(() => {});
      const retry = await adminClient.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        });
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error('[admin/upload] Storage upload failed:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'ストレージへの画像保存に失敗しました' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filePath
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'アップロード処理エラー' }, { status: 500 });
  }
}
