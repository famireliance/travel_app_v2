import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || !['super_admin', 'org_admin'].includes(user.role)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const client = getAdminClient();
  const searchParams = req.nextUrl.searchParams;

  // 組織一覧のリクエスト
  if (searchParams.get('type') === 'organizations') {
    let orgQuery = client.from('admin_organizations').select('*');
    if (user.role === 'org_admin' && user.org_id) {
      orgQuery = orgQuery.eq('id', user.org_id);
    }
    const { data: orgs, error: orgError } = await orgQuery;
    if (orgError) {
      console.error('admin_organizations fetch error:', orgError);
      return NextResponse.json({ error: orgError.message || '組織情報の取得に失敗しました' }, { status: 500 });
    }
    return NextResponse.json(orgs || []);
  }

  // ユーザー一覧のリクエスト
  let query = client
    .from('admin_users')
    .select(`
      id, email, name, role, org_id, last_login_at, created_at,
      admin_organizations ( name )
    `)
    .order('created_at', { ascending: false });
  
  if (user.role === 'org_admin') {
    query = query.eq('org_id', user.org_id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'ユーザー取得失敗' }, { status: 500 });
  }

  const formatted = (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    org_id: u.org_id,
    org_name: u.admin_organizations?.name || (u.org_id ? '自治体組織' : 'システム管理'),
    last_login_at: u.last_login_at,
    created_at: u.created_at,
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || !['super_admin', 'org_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'スタッフ追加の権限がありません' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, org_id } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: '氏名は必須です' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上で入力してください' }, { status: 400 });
    }

    const validRoles = ['super_admin', 'org_admin', 'editor', 'viewer'];
    const targetRole = role && validRoles.includes(role) ? role : 'editor';

    // org_admin の制限: super_admin は作成不可、自分の組織のみ
    let targetOrgId = org_id || null;
    if (user.role === 'org_admin') {
      if (targetRole === 'super_admin') {
        return NextResponse.json({ error: '組織管理者がシステム管理者権限を付与することはできません' }, { status: 403 });
      }
      targetOrgId = user.org_id; // 強制的に自分の組織に所属させる
    }

    const client = getAdminClient();

    // 既存メール重複チェック
    const { data: existing } = await client
      .from('admin_users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 400 });
    }

    // パスワードのハッシュ化 (bcrypt blowfish)
    const password_hash = bcrypt.hashSync(password, 10);

    const { data: createdUser, error: insertError } = await client
      .from('admin_users')
      .insert([{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        role: targetRole,
        org_id: targetOrgId,
      }])
      .select('id, email, name, role, org_id, created_at')
      .single();

    if (insertError) {
      console.error('Create admin user error:', insertError);
      return NextResponse.json({ error: 'スタッフの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: createdUser }, { status: 201 });
  } catch (err: any) {
    console.error('POST admin user exception:', err);
    return NextResponse.json({ error: err.message || '予期せぬエラーが発生しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || !['super_admin', 'org_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'スタッフ更新の権限がありません' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, password, name, role } = body;

    if (!id) {
      return NextResponse.json({ error: '対象IDが指定されていません' }, { status: 400 });
    }

    const client = getAdminClient();
    const { data: targetUser, error: fetchError } = await client
      .from('admin_users')
      .select('id, role, org_id')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
    }

    if (user.role === 'org_admin') {
      if (targetUser.org_id !== user.org_id) {
        return NextResponse.json({ error: '他組織のスタッフを変更することはできません' }, { status: 403 });
      }
      if (targetUser.role === 'super_admin' || role === 'super_admin') {
        return NextResponse.json({ error: 'システム管理者を変更することはできません' }, { status: 403 });
      }
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'パスワードは6文字以上で入力してください' }, { status: 400 });
      }
      updates.password_hash = bcrypt.hashSync(password, 10);
    }
    if (name !== undefined && typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }
    if (role !== undefined && ['super_admin', 'org_admin', 'editor', 'viewer'].includes(role)) {
      updates.role = role;
    }

    const { error: updateError } = await client
      .from('admin_users')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'スタッフ情報の更新に失敗しました' }, { status: 500 });
    }

    if (password !== undefined) {
      await client.from('admin_sessions').delete().eq('user_id', id);
    }

    return NextResponse.json({ success: true, message: 'スタッフ情報を更新しました' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '予期せぬエラーが発生しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || !['super_admin', 'org_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'スタッフ削除の権限がありません' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('id');
  if (!targetId) {
    return NextResponse.json({ error: '対象IDが指定されていません' }, { status: 400 });
  }

  if (targetId === user.id) {
    return NextResponse.json({ error: '自身のアカウントを削除することはできません' }, { status: 400 });
  }

  const client = getAdminClient();

  // 削除対象のユーザーを取得して権限チェック
  const { data: targetUser, error: fetchError } = await client
    .from('admin_users')
    .select('id, role, org_id')
    .eq('id', targetId)
    .single();

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: '対象スタッフが見つかりません' }, { status: 404 });
  }

  if (user.role === 'org_admin') {
    if (targetUser.org_id !== user.org_id) {
      return NextResponse.json({ error: '他組織のスタッフを削除することはできません' }, { status: 403 });
    }
    if (targetUser.role === 'super_admin') {
      return NextResponse.json({ error: 'システム管理者を削除することはできません' }, { status: 403 });
    }
  }

  // 関連セッションもクリーンアップ
  await client.from('admin_sessions').delete().eq('user_id', targetId);

  const { error: deleteError } = await client
    .from('admin_users')
    .delete()
    .eq('id', targetId);

  if (deleteError) {
    return NextResponse.json({ error: 'スタッフの削除に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
