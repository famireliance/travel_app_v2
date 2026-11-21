import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserAuth } from '@/lib/userAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('REPLACE')
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readAdminConfigJson<T>(
  client: ReturnType<typeof getAdminClient>,
  key: string,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await client
      .from('admin_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error || data?.value == null) return fallback;
    if (typeof data.value === 'string') {
      return JSON.parse(data.value) as T;
    }
    return data.value as T;
  } catch {
    return fallback;
  }
}

function resolveIslandName(islandId: unknown): string {
  if (!islandId) return '';
  const key = String(islandId).trim();
  return ALL_ISLANDS_MASTER_DICTIONARY[key]?.name || '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isPublic = searchParams.get('public') === '1';
  const requestedId = (searchParams.get('id') || '').trim();
  const adminClient = getAdminClient();

  if (isPublic) {
    const cleanId = requestedId.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanId) {
      return NextResponse.json({ error: 'id が必要です', accommodation: null }, { status: 400 });
    }

    let acc: any = null;
    if (UUID_REGEX.test(cleanId)) {
      const { data } = await adminClient
        .from('accommodations')
        .select('*')
        .or(`id.eq.${cleanId},owner_id.eq.${cleanId}`)
        .limit(1)
        .maybeSingle();
      acc = data;
    } else {
      const { data } = await adminClient
        .from('accommodations')
        .select('*')
        .eq('id', cleanId)
        .limit(1)
        .maybeSingle();
      acc = data;
    }

    if (!acc) {
      return NextResponse.json({ accommodation: null }, { status: 404 });
    }

    const [ext, allReviews] = await Promise.all([
      readAdminConfigJson<Record<string, any>>(adminClient, `b2b_facility_ext_${acc.id}`, {}),
      readAdminConfigJson<any[]>(adminClient, 'fallback_agent_reviews', []),
    ]);

    const reviewsList = Array.isArray(allReviews) ? allReviews : [];
    const matchedReview = reviewsList.find(
      (r) =>
        r &&
        (r.accommodation_id === acc.id ||
          (r.accommodation_id && acc.name && r.accommodation_id === acc.name))
    );

    const mappedAgentReview =
      matchedReview && (matchedReview.public_review?.title || matchedReview.public_review?.body)
        ? {
            agentType: matchedReview.public_review.agentType === 'user' ? 'user' : 'official',
            rating: Number(matchedReview.overall_score || 4.8),
            agentName: matchedReview.public_review.agentName || 'KIRATABI 公式調査員',
            agentTitle:
              matchedReview.public_review.agentType === 'user'
                ? '公認アンバサダー'
                : 'KIRATABI 公式エージェント',
            agentCriteria: '離島滞在調査・現地ヒアリング実施済',
            agentAvatar: '',
            title: matchedReview.public_review.title || `${acc.name} 滞在レポート`,
            body: matchedReview.public_review.body || '',
            stayDate: matchedReview.updated_at
              ? `${new Date(matchedReview.updated_at).getFullYear()}年 調査済`
              : undefined,
          }
        : ext.agent_review || null;

    // Return strictly non-sensitive public fields (no wifi_password, wifi_ssid, owner_id, or private email)
    const publicAccommodation = {
      id: acc.id,
      island_id: acc.island_id,
      island_name: resolveIslandName(acc.island_id),
      name: acc.name || '',
      phone_number: acc.phone_number || '',
      plan_tier: acc.plan_tier || 'free',
      is_verified: Boolean(acc.is_verified),
      address: acc.address || '',
      website_url: acc.website_url || '',
      description: acc.description || '',
      price_range: acc.price_range || '',
      has_pickup: Boolean(acc.has_pickup),
      photo_urls: Array.isArray(acc.photo_urls) ? acc.photo_urls : [],
      booking_mode: acc.booking_mode || 'request_based',
      photo_exterior: Array.isArray(acc.photo_exterior) ? acc.photo_exterior : [],
      photo_room: Array.isArray(acc.photo_room) ? acc.photo_room : [],
      photo_food: Array.isArray(acc.photo_food) ? acc.photo_food : [],
      photo_facility: Array.isArray(acc.photo_facility) ? acc.photo_facility : [],
      deposit_policy: acc.deposit_policy || '',
      catchphrase: typeof ext.catchphrase === 'string' ? ext.catchphrase : '',
      plans: Array.isArray(ext.plans) ? ext.plans : [],
      features: Array.isArray(ext.features) ? ext.features : [],
      check_in_time: typeof ext.check_in_time === 'string' ? ext.check_in_time : '',
      check_out_time: typeof ext.check_out_time === 'string' ? ext.check_out_time : '',
      same_day_cutoff: typeof ext.same_day_cutoff === 'string' ? ext.same_day_cutoff : '',
      enable_certificate:
        typeof ext.enable_certificate === 'boolean' ? ext.enable_certificate : false,
      certificate_message:
        typeof ext.certificate_message === 'string' ? ext.certificate_message : '',
      line_url: typeof ext.line_url === 'string' ? ext.line_url : '',
      instagram_url: typeof ext.instagram_url === 'string' ? ext.instagram_url : '',
      instagram_account:
        typeof ext.instagram_account === 'string' ? ext.instagram_account : '',
      twitter_url: typeof ext.twitter_url === 'string' ? ext.twitter_url : '',
      agent_review: mappedAgentReview,
    };

    return NextResponse.json({ accommodation: publicAccommodation });
  }

  // Authenticated B2B Owner / Super Admin mode
  const { user, error: authError } = await verifyUserAuth(req);
  if (!user) {
    return NextResponse.json({ error: authError || '認証が必要です' }, { status: 401 });
  }

  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || 'user';
  if (role !== 'owner' && role !== 'super_admin') {
    return NextResponse.json({ error: 'オーナー権限が必要です' }, { status: 403 });
  }

  let acc: any = null;
  if (requestedId && role === 'super_admin') {
    const { data } = await adminClient
      .from('accommodations')
      .select('*')
      .eq('id', requestedId)
      .limit(1)
      .maybeSingle();
    acc = data;
  }

  if (!acc) {
    const { data } = await adminClient
      .from('accommodations')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle();
    acc = data;
  }

  if (!acc && role === 'super_admin') {
    const { data } = await adminClient
      .from('accommodations')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    acc = data;
  }

  if (!acc) {
    return NextResponse.json({ accommodation: null });
  }

  const ext = await readAdminConfigJson<Record<string, any>>(
    adminClient,
    `b2b_facility_ext_${acc.id}`,
    {}
  );

  return NextResponse.json({
    accommodation: {
      ...acc,
      island_name: resolveIslandName(acc.island_id),
      ...ext,
    },
  });
}

export async function PUT(req: NextRequest) {
  const { user, error: authError } = await verifyUserAuth(req);
  if (!user) {
    return NextResponse.json({ error: authError || '認証が必要です' }, { status: 401 });
  }

  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || 'user';
  if (role !== 'owner' && role !== 'super_admin') {
    return NextResponse.json({ error: 'オーナー権限が必要です' }, { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
  }

  let acc: any = null;
  if (body.id) {
    const { data } = await adminClient
      .from('accommodations')
      .select('*')
      .eq('id', String(body.id))
      .limit(1)
      .maybeSingle();
    acc = data;
  } else {
    const { data } = await adminClient
      .from('accommodations')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle();
    acc = data;

    if (!acc && role === 'super_admin') {
      const { data: firstAcc } = await adminClient
        .from('accommodations')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      acc = firstAcc;
    }
  }

  if (!acc) {
    return NextResponse.json({ error: '対象の宿泊施設が見つかりません' }, { status: 404 });
  }

  if (acc.owner_id !== user.id && role !== 'super_admin') {
    return NextResponse.json({ error: 'この宿泊施設を編集する権限がありません' }, { status: 403 });
  }

  // Strictly update ONLY real columns that exist on public.accommodations
  const realUpdateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === 'string' && body.name.trim()) {
    realUpdateData.name = body.name.trim();
  }
  if (body.phone_number !== undefined) {
    realUpdateData.phone_number = String(body.phone_number || '').trim();
  }
  if (body.address !== undefined) {
    realUpdateData.address = String(body.address || '').trim();
  }
  if (body.website_url !== undefined) {
    realUpdateData.website_url = String(body.website_url || '').trim();
  }
  if (body.description !== undefined) {
    realUpdateData.description = String(body.description || '');
  }
  if (body.price_range !== undefined) {
    realUpdateData.price_range = String(body.price_range || '').trim();
  }
  if (typeof body.has_pickup === 'boolean') {
    realUpdateData.has_pickup = body.has_pickup;
  }
  if (Array.isArray(body.photo_urls)) {
    realUpdateData.photo_urls = body.photo_urls.filter((u: any) => typeof u === 'string' && u.trim());
  }
  if (typeof body.booking_mode === 'string' && body.booking_mode.trim()) {
    realUpdateData.booking_mode = body.booking_mode.trim();
  }
  if (Array.isArray(body.photo_exterior)) {
    realUpdateData.photo_exterior = body.photo_exterior.filter(Boolean);
  }
  if (Array.isArray(body.photo_room)) {
    realUpdateData.photo_room = body.photo_room.filter(Boolean);
  }
  if (Array.isArray(body.photo_food)) {
    realUpdateData.photo_food = body.photo_food.filter(Boolean);
  }
  if (Array.isArray(body.photo_facility)) {
    realUpdateData.photo_facility = body.photo_facility.filter(Boolean);
  }
  if (body.deposit_policy !== undefined) {
    realUpdateData.deposit_policy = String(body.deposit_policy || '');
  }

  const { data: updatedAcc, error: updateError } = await adminClient
    .from('accommodations')
    .update(realUpdateData)
    .eq('id', acc.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Upsert extended fields into admin_config (b2b_facility_ext_${acc.id})
  const extKey = `b2b_facility_ext_${acc.id}`;
  const existingExt = await readAdminConfigJson<Record<string, any>>(adminClient, extKey, {});

  const extFields = [
    'email',
    'line_url',
    'instagram_url',
    'instagram_account',
    'twitter_url',
    'check_in_time',
    'check_out_time',
    'same_day_cutoff',
    'enable_certificate',
    'certificate_message',
    'enable_pre_checkin',
    'catchphrase',
    'plans',
    'features',
    'wifi_ssid',
    'wifi_password',
  ] as const;

  const nextExt: Record<string, any> = { ...existingExt };
  for (const field of extFields) {
    if (body[field] !== undefined) {
      nextExt[field] = body[field];
    }
  }

  const { error: extError } = await adminClient.from('admin_config').upsert(
    {
      key: extKey,
      value: JSON.stringify(nextExt),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    accommodation: {
      ...updatedAcc,
      island_name: resolveIslandName(updatedAcc.island_id),
      ...nextExt,
    },
  });
}
