import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, isSuperAdmin } from '@/lib/adminAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const ALLOWED_ROLES = new Set(['super_admin', 'org_admin', 'editor']);
const VALID_PLAN_TIERS = new Set(['free', 'paid_standard', 'paid_premium']);
const VALID_BOOKING_MODES = new Set(['request_based', 'instant_booking']);

function getServiceClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey || serviceKey.startsWith('REPLACE')) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isTestAccommodationName(name: unknown): boolean {
  const str = String(name || '');
  return str.includes('架空') || str.includes('テスト用');
}

function getIslandInfo(islandId: unknown): { name: string; prefecture: string } {
  if (!islandId) return { name: '', prefecture: '' };
  const key = String(islandId).trim();
  const entry =
    ALL_ISLANDS_MASTER_DICTIONARY[key] ||
    Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (i: any) => String(i.id) === key || i.slug === key || i.name === key
    );
  return {
    name: entry?.name || '',
    prefecture: entry?.prefecture || '',
  };
}

async function resolveOrCreateOwner(
  adminClient: NonNullable<ReturnType<typeof getServiceClient>>,
  rawEmail: string,
  rawPassword?: string
): Promise<{
  userId?: string;
  email?: string;
  createdNewUser?: boolean;
  error?: string;
  status?: number;
}> {
  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { error: '有効なオーナー用メールアドレスを入力してください', status: 400 };
  }

  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    return { error: `ユーザー検索に失敗しました: ${listError.message}`, status: 500 };
  }

  let ownerUser = (listData?.users || []).find(
    (u) => (u.email || '').toLowerCase() === normalizedEmail
  );
  let createdNewUser = false;

  if (!ownerUser) {
    const trimmedPassword = typeof rawPassword === 'string' ? rawPassword.trim() : '';
    if (!trimmedPassword) {
      return {
        error:
          '未登録のメールアドレスです。新規B2Bオーナーアカウントを作成するため、初期パスワード（6文字以上）を入力してください。',
        status: 400,
      };
    }
    if (trimmedPassword.length < 6) {
      return { error: '初期パスワードは6文字以上で指定してください', status: 400 };
    }

    const { data: createdData, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: trimmedPassword,
      email_confirm: true,
    });
    if (createError || !createdData?.user) {
      return {
        error: `オーナーアカウントの作成に失敗しました: ${createError?.message || '不明なエラー'}`,
        status: 500,
      };
    }
    ownerUser = createdData.user;
    createdNewUser = true;
  }

  // Upsert public.user_profiles with role: 'owner' (preserve super_admin if already super_admin)
  const { data: existingProfile } = await adminClient
    .from('user_profiles')
    .select('id, role')
    .eq('id', ownerUser.id)
    .maybeSingle();

  const targetRole = existingProfile?.role === 'super_admin' ? 'super_admin' : 'owner';
  const { error: profileError } = await adminClient
    .from('user_profiles')
    .upsert({ id: ownerUser.id, role: targetRole }, { onConflict: 'id' });

  if (profileError) {
    return {
      error: `オーナー権限の付与に失敗しました: ${profileError.message}`,
      status: 500,
    };
  }

  return {
    userId: ownerUser.id,
    email: ownerUser.email || normalizedEmail,
    createdNewUser,
  };
}

export async function GET(req: NextRequest) {
  const adminUser = await getAuthUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!ALLOWED_ROLES.has(adminUser.role)) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const [accRes, profilesRes, authUsersRes] = await Promise.all([
    adminClient.from('accommodations').select('*').order('created_at', { ascending: false }),
    adminClient.from('user_profiles').select('id, nickname, role'),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (accRes.error) {
    return NextResponse.json({ error: accRes.error.message }, { status: 500 });
  }

  const profileMap = new Map<string, any>(
    (profilesRes.data || []).map((p: any) => [String(p.id), p])
  );
  const authUserMap = new Map<string, any>(
    (authUsersRes.data?.users || []).map((u: any) => [String(u.id), u])
  );

  const enriched = (accRes.data || []).map((acc: any) => {
    const islandInfo = getIslandInfo(acc.island_id);
    const ownerAuth = acc.owner_id ? authUserMap.get(String(acc.owner_id)) : null;
    const ownerProfile = acc.owner_id ? profileMap.get(String(acc.owner_id)) : null;

    return {
      ...acc,
      island_name: islandInfo.name,
      island_prefecture: islandInfo.prefecture,
      owner_email: ownerAuth?.email || null,
      owner_nickname: ownerProfile?.nickname || null,
      owner_role: ownerProfile?.role || null,
      is_test_inn: isTestAccommodationName(acc.name),
    };
  });

  return NextResponse.json({ accommodations: enriched });
}

export async function POST(req: NextRequest) {
  const adminUser = await getAuthUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!ALLOWED_ROLES.has(adminUser.role)) {
    return NextResponse.json({ error: '変更権限がありません' }, { status: 403 });
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const islandId = typeof body.island_id === 'string' ? body.island_id.trim() : String(body.island_id || '').trim();

  if (!name) {
    return NextResponse.json({ error: '宿泊施設名は必須です' }, { status: 400 });
  }
  if (!islandId) {
    return NextResponse.json({ error: '対象島（island_id）の選択は必須です' }, { status: 400 });
  }

  let resolvedOwnerId: string | null = null;
  let ownerNote = '';
  const ownerEmail = typeof body.owner_email === 'string' ? body.owner_email.trim() : '';
  const ownerPassword = typeof body.owner_password === 'string' ? body.owner_password : '';

  if (ownerEmail) {
    const ownerRes = await resolveOrCreateOwner(adminClient, ownerEmail, ownerPassword);
    if (ownerRes.error) {
      return NextResponse.json({ error: ownerRes.error }, { status: ownerRes.status || 400 });
    }
    resolvedOwnerId = ownerRes.userId || null;
    ownerNote = ownerRes.createdNewUser
      ? `（新規B2Bオーナー ${ownerRes.email} を作成・紐付けました）`
      : `（既存アカウント ${ownerRes.email} にB2Bオーナー権限を付与・紐付けました）`;
  }

  const planTier = VALID_PLAN_TIERS.has(body.plan_tier) ? body.plan_tier : 'paid_standard';
  const bookingMode = VALID_BOOKING_MODES.has(body.booking_mode)
    ? body.booking_mode
    : 'request_based';

  const insertPayload: Record<string, any> = {
    island_id: islandId,
    owner_id: resolvedOwnerId,
    name,
    phone_number: typeof body.phone_number === 'string' ? body.phone_number.trim() : '',
    plan_tier: planTier,
    is_verified: typeof body.is_verified === 'boolean' ? body.is_verified : true,
    address: typeof body.address === 'string' ? body.address.trim() : '',
    website_url: typeof body.website_url === 'string' ? body.website_url.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    price_range: typeof body.price_range === 'string' ? body.price_range.trim() : '',
    has_pickup: Boolean(body.has_pickup),
    booking_mode: bookingMode,
    deposit_policy: typeof body.deposit_policy === 'string' ? body.deposit_policy.trim() : '',
  };

  const { data: created, error: insertError } = await adminClient
    .from('accommodations')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const islandInfo = getIslandInfo(created.island_id);
  return NextResponse.json({
    success: true,
    message: `「${created.name}」を登録しました${ownerNote}`,
    accommodation: {
      ...created,
      island_name: islandInfo.name,
      island_prefecture: islandInfo.prefecture,
      owner_email: ownerEmail ? ownerEmail.toLowerCase() : null,
      is_test_inn: isTestAccommodationName(created.name),
    },
  });
}

export async function PUT(req: NextRequest) {
  const adminUser = await getAuthUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!ALLOWED_ROLES.has(adminUser.role)) {
    return NextResponse.json({ error: '変更権限がありません' }, { status: 403 });
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
  }

  // 1. 一括操作: テスト・架空宿の非公開化 / 削除
  if (body.action === 'hide_test_inns' || body.action === 'delete_test_inns') {
    if (body.action === 'delete_test_inns' && !isSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: '一括削除は最高管理者（super_admin）のみ実行可能です' },
        { status: 403 }
      );
    }

    const { data: allRows, error: fetchError } = await adminClient
      .from('accommodations')
      .select('id, name, is_verified');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const testRows = (allRows || []).filter((r: any) => isTestAccommodationName(r.name));
    const targetIds = testRows.map((r: any) => r.id);

    if (targetIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: '対象のテスト・架空宿は見つかりませんでした',
      });
    }

    if (body.action === 'hide_test_inns') {
      const { error: hideError } = await adminClient
        .from('accommodations')
        .update({ is_verified: false, updated_at: new Date().toISOString() })
        .in('id', targetIds);

      if (hideError) {
        return NextResponse.json({ error: hideError.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        count: targetIds.length,
        message: `テスト・架空宿 ${targetIds.length}件 を一括非公開（is_verified = false）に設定しました`,
      });
    }

    const { error: delError } = await adminClient
      .from('accommodations')
      .delete()
      .in('id', targetIds);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      count: targetIds.length,
      message: `テスト・架空宿 ${targetIds.length}件 を完全に削除しました`,
    });
  }

  // 2. 個別施設の更新
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) {
    return NextResponse.json({ error: '更新対象の施設IDが必要です' }, { status: 400 });
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === 'string' && body.name.trim()) {
    updatePayload.name = body.name.trim();
  }
  if (body.island_id !== undefined && String(body.island_id).trim()) {
    updatePayload.island_id = String(body.island_id).trim();
  }
  if (body.phone_number !== undefined) {
    updatePayload.phone_number = String(body.phone_number || '').trim();
  }
  if (body.address !== undefined) {
    updatePayload.address = String(body.address || '').trim();
  }
  if (body.website_url !== undefined) {
    updatePayload.website_url = String(body.website_url || '').trim();
  }
  if (body.description !== undefined) {
    updatePayload.description = String(body.description || '').trim();
  }
  if (body.price_range !== undefined) {
    updatePayload.price_range = String(body.price_range || '').trim();
  }
  if (body.plan_tier !== undefined && VALID_PLAN_TIERS.has(body.plan_tier)) {
    updatePayload.plan_tier = body.plan_tier;
  }
  if (body.booking_mode !== undefined && VALID_BOOKING_MODES.has(body.booking_mode)) {
    updatePayload.booking_mode = body.booking_mode;
  }
  if (typeof body.is_verified === 'boolean') {
    updatePayload.is_verified = body.is_verified;
  }
  if (typeof body.has_pickup === 'boolean') {
    updatePayload.has_pickup = body.has_pickup;
  }
  if (body.deposit_policy !== undefined) {
    updatePayload.deposit_policy = String(body.deposit_policy || '').trim();
  }

  let ownerNote = '';
  if (body.owner_email !== undefined) {
    const rawEmail = String(body.owner_email || '').trim();
    if (!rawEmail) {
      updatePayload.owner_id = null;
      ownerNote = '（オーナー紐付けを解除しました）';
    } else {
      const ownerRes = await resolveOrCreateOwner(
        adminClient,
        rawEmail,
        typeof body.owner_password === 'string' ? body.owner_password : undefined
      );
      if (ownerRes.error) {
        return NextResponse.json({ error: ownerRes.error }, { status: ownerRes.status || 400 });
      }
      updatePayload.owner_id = ownerRes.userId || null;
      ownerNote = ownerRes.createdNewUser
        ? `（新規オーナー ${ownerRes.email} を作成・割当しました）`
        : `（オーナー ${ownerRes.email} を割当しました）`;
    }
  }

  const { data: updated, error: updateError } = await adminClient
    .from('accommodations')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const islandInfo = getIslandInfo(updated.island_id);
  return NextResponse.json({
    success: true,
    message: `「${updated.name}」を更新しました${ownerNote}`,
    accommodation: {
      ...updated,
      island_name: islandInfo.name,
      island_prefecture: islandInfo.prefecture,
      is_test_inn: isTestAccommodationName(updated.name),
    },
  });
}

export async function DELETE(req: NextRequest) {
  const adminUser = await getAuthUser(req);
  if (!adminUser) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!isSuperAdmin(adminUser)) {
    return NextResponse.json(
      { error: '削除は最高管理者（super_admin）のみ実行可能です' },
      { status: 403 }
    );
  }

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const id = (req.nextUrl.searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ error: '削除対象の id が必要です' }, { status: 400 });
  }

  const { error: deleteError } = await adminClient.from('accommodations').delete().eq('id', id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Best-effort cleanup of extended B2B config if present
  await adminClient
    .from('admin_config')
    .delete()
    .eq('key', `b2b_facility_ext_${id}`);

  return NextResponse.json({
    success: true,
    message: '宿泊施設データを削除しました',
  });
}
