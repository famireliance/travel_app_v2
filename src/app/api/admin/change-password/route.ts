import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTokenString } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }
  
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  const { currentPassword, newPassword } = await req.json();
  const token = req.headers.get('x-admin-password') || currentPassword || '';

  const user = await validateTokenString(token);
  if (!user) {
    return NextResponse.json({ error: '現在のパスワードまたはセッションが正しくありません' }, { status: 401 });
  }
  
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上で設定してください' }, { status: 400 });
  }
  
  // 個別スタッフアカウントの場合は admin_users のハッシュを更新
  if (user.id && user.id !== 'master-admin-id') {
    const password_hash = bcrypt.hashSync(newPassword, 10);
    const { error } = await adminClient
      .from('admin_users')
      .update({ password_hash })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'スタッフパスワードを変更しました。次回ログインから新しいパスワードをご使用ください。' });
  }

  // マスター管理者の場合は admin_config に保存
  const { error } = await adminClient
    .from('admin_config')
    .upsert({ key: 'admin_password', value: newPassword, updated_at: new Date().toISOString() });
  
  if (error) {
    return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, message: 'マスターパスワードを変更しました。次回ログインから新しいパスワードをご使用ください。' });
}
