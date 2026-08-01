import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  
  // 現在のパスワードを確認
  const { data: config } = await adminClient
    .from('admin_config')
    .select('value')
    .eq('key', 'admin_password')
    .single();
  
  const storedPassword = config?.value || process.env.ADMIN_PASSWORD;
  
  if (currentPassword !== storedPassword) {
    return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 401 });
  }
  
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上で設定してください' }, { status: 400 });
  }
  
  // 新しいパスワードをDBに保存
  const { error } = await adminClient
    .from('admin_config')
    .upsert({ key: 'admin_password', value: newPassword, updated_at: new Date().toISOString() });
  
  if (error) {
    return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, message: 'パスワードを変更しました。次回ログインから新しいパスワードをご使用ください。' });
}
