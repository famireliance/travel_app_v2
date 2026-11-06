import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, getAdminPassword, validateTokenString } from '@/lib/adminAuth';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';
import bcrypt from 'bcryptjs';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const user = await getAuthUser(req);
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: '新しいパスワードは8文字以上で設定してください' }, { status: 400 });
  }

  const masterPw = await getAdminPassword();
  let isCurrentValid = false;

  if (currentPassword && masterPw && currentPassword === masterPw) {
    isCurrentValid = true;
  } else if (user.id && user.id !== 'master-admin-id' && currentPassword) {
    const { data: dbUser } = await adminClient
      .from('admin_users')
      .select('password_hash')
      .eq('id', user.id)
      .maybeSingle();
    if (dbUser?.password_hash && bcrypt.compareSync(currentPassword, dbUser.password_hash)) {
      isCurrentValid = true;
    }
  } else if (currentPassword) {
    // セッショントークンが渡された場合のフォールバック確認
    const sessionUser = await validateTokenString(currentPassword);
    if (sessionUser && sessionUser.role === 'super_admin') {
      isCurrentValid = true;
    }
  }

  if (!isCurrentValid) {
    return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 401 });
  }

  // 個別スタッフアカウントの場合は admin_users のハッシュを更新
  if (user.id && user.id !== 'master-admin-id') {
    const password_hash = bcrypt.hashSync(newPassword, 10);
    const { error } = await adminClient
      .from('admin_users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
    }

    await logAuditEvent({
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System' },
      client: extractClientInfo(req),
      action: 'ADMIN_PASSWORD_CHANGE',
      target: { resource_type: 'admin_user', resource_id: user.id, details: `管理者アカウント (${user.email}) のパスワード変更` },
    });

    return NextResponse.json({
      success: true,
      message: 'スタッフパスワードを変更しました。次回ログインから新しいパスワードをご使用ください。',
    });
  }

  // マスター管理者の場合は admin_config に保存
  const { error } = await adminClient
    .from('admin_config')
    .upsert({ key: 'admin_password', value: newPassword, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
  }

  await logAuditEvent({
    actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System' },
    client: extractClientInfo(req),
    action: 'MASTER_PASSWORD_CHANGE',
    target: { resource_type: 'admin_config', resource_id: 'admin_password', details: 'マスター管理者パスワードを更新' },
  });

  return NextResponse.json({
    success: true,
    message: 'マスターパスワードを変更しました。次回ログインから新しいパスワードをご使用ください。',
  });
}
