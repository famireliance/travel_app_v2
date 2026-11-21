import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, getAdminPassword } from '@/lib/adminAuth';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';
import bcrypt from 'bcryptjs';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const staffUserId = user.userId || (user.id && user.id !== 'master-admin-id' ? user.id : undefined);
  const isStaffAccount = Boolean(staffUserId);

  if (!isStaffAccount && user.role !== 'super_admin') {
    return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || typeof currentPassword !== 'string') {
    return NextResponse.json({ error: '現在のパスワードを入力してください' }, { status: 400 });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: '新しいパスワードは8文字以上で設定してください' }, { status: 400 });
  }

  // 個別スタッフアカウントの場合は自身のパスワードのみ変更可能
  if (isStaffAccount && staffUserId) {
    const { data: dbUser } = await adminClient
      .from('admin_users')
      .select('id, email, password_hash')
      .eq('id', staffUserId)
      .maybeSingle();

    if (!dbUser?.password_hash) {
      return NextResponse.json({ error: 'スタッフアカウントが見つかりません' }, { status: 404 });
    }

    let isStaffPwValid = bcrypt.compareSync(currentPassword, dbUser.password_hash);
    if (!isStaffPwValid) {
      try {
        const { data: rpcUser } = await adminClient.rpc('verify_admin_password', {
          p_email: dbUser.email,
          p_password: currentPassword,
        });
        if (rpcUser) isStaffPwValid = true;
      } catch {
        // ignore RPC fallback failure
      }
    }

    if (!isStaffPwValid) {
      return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 401 });
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    const { error } = await adminClient
      .from('admin_users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', staffUserId);

    if (error) {
      return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
    }

    // 旧セッションをすべて削除し、新セッションを発行
    await adminClient.from('admin_sessions').delete().eq('user_id', staffUserId);
    const { data: newSession } = await adminClient
      .from('admin_sessions')
      .insert([{ user_id: staffUserId }])
      .select('id')
      .maybeSingle();

    await logAuditEvent({
      actor: { user_id: staffUserId, email: user.email, role: user.role, name: user.name, org: user.org_name || 'System', org_id: user.org_id },
      client: extractClientInfo(req),
      action: 'ADMIN_PASSWORD_CHANGE',
      target: { resource_type: 'admin_user', resource_id: staffUserId, details: `管理者アカウント (${user.email}) のパスワード変更` },
    });

    return NextResponse.json({
      success: true,
      token: newSession?.id,
      message: 'スタッフパスワードを変更しました。次回ログインから新しいパスワードをご使用ください。',
    });
  }

  // マスター管理者の場合: セッションUUIDではなく実マスターパスワードの一致を厳格に要求
  const masterPw = await getAdminPassword();
  if (!masterPw || (UUID_REGEX.test(currentPassword) && currentPassword !== masterPw) || currentPassword !== masterPw) {
    return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 401 });
  }

  const { error } = await adminClient
    .from('admin_config')
    .upsert(
      { key: 'admin_password', value: newPassword, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: 'パスワードの更新に失敗しました: ' + error.message }, { status: 500 });
  }

  // 旧マスターセッションをすべて失効させ、新セッションを発行
  await adminClient.from('admin_sessions').delete().is('user_id', null);
  const { data: newMasterSession } = await adminClient
    .from('admin_sessions')
    .insert([{ user_id: null }])
    .select('id')
    .maybeSingle();

  await logAuditEvent({
    actor: { user_id: user.id, email: user.email, role: user.role, name: user.name, org: user.org_name || 'System' },
    client: extractClientInfo(req),
    action: 'MASTER_PASSWORD_CHANGE',
    target: { resource_type: 'admin_config', resource_id: 'admin_password', details: 'マスター管理者パスワードを更新' },
  });

  return NextResponse.json({
    success: true,
    token: newMasterSession?.id,
    message: 'マスターパスワードを変更しました。次回ログインから新しいパスワードをご使用ください。',
  });
}
