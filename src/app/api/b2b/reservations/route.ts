import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserAuth } from '@/lib/userAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'rejected']);

function getAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('REPLACE')
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readAdminConfigJson<T>(
  client: NonNullable<ReturnType<typeof getAdminClient>>,
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

function getStartOfTodayJstIso(): string {
  const now = new Date();
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffsetMs);
  const yyyy = jstDate.getUTCFullYear();
  const mm = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jstDate.getUTCDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`).toISOString();
}

async function resolveOwnerAccommodation(req: NextRequest) {
  const { user, error: authError } = await verifyUserAuth(req);
  if (!user) {
    return { errorResponse: NextResponse.json({ error: authError || '認証が必要です' }, { status: 401 }) };
  }

  const adminClient = getAdminClient();
  if (!adminClient) {
    return { errorResponse: NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 }) };
  }

  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || 'user';
  if (role !== 'owner' && role !== 'super_admin') {
    return { errorResponse: NextResponse.json({ error: 'オーナー権限が必要です' }, { status: 403 }) };
  }

  const { data: ownedRows } = await adminClient
    .from('accommodations')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  const ownedList = Array.isArray(ownedRows) ? ownedRows : [];
  const ownedIds = new Set<string>(ownedList.map((a: any) => String(a.id)));

  let acc: any = ownedList[0] || null;
  if (!acc && role === 'super_admin') {
    const { data: fallbackAcc } = await adminClient
      .from('accommodations')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    acc = fallbackAcc;
  }

  return { user, role, acc, ownedList, ownedIds, adminClient };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveOwnerAccommodation(req);
    if ('errorResponse' in resolved && resolved.errorResponse) {
      return resolved.errorResponse;
    }

    const { role, acc: defaultAcc, ownedList, ownedIds, adminClient } = resolved;
    const { searchParams } = new URL(req.url);
    const requestedAccId = (searchParams.get('accommodation_id') || searchParams.get('id') || '').trim();

    let acc = defaultAcc;
    let targetAccIds: string[] = [];

    if (requestedAccId) {
      if (ownedIds.has(requestedAccId)) {
        acc = ownedList.find((a: any) => String(a.id) === requestedAccId) || defaultAcc;
        targetAccIds = [requestedAccId];
      } else if (role === 'super_admin') {
        const { data: requestedAcc } = await adminClient
          .from('accommodations')
          .select('*')
          .eq('id', requestedAccId)
          .limit(1)
          .maybeSingle();
        if (!requestedAcc) {
          return NextResponse.json({ error: '宿泊施設が見つかりません' }, { status: 404 });
        }
        acc = requestedAcc;
        targetAccIds = [String(requestedAcc.id)];
      } else {
        return NextResponse.json({ error: 'この宿泊施設を参照する権限がありません' }, { status: 403 });
      }
    } else if (ownedList.length > 0) {
      targetAccIds = ownedList.map((a: any) => String(a.id));
    } else if (acc) {
      targetAccIds = [String(acc.id)];
    }

    if (!acc || targetAccIds.length === 0) {
      return NextResponse.json({
        accommodation: null,
        accommodations: [],
        reservations: [],
        ledgers: [],
        todayPv: 0,
      });
    }

    const islandName =
      ALL_ISLANDS_MASTER_DICTIONARY[String(acc.island_id || '').trim()]?.name || '';

    // 1. Fetch reservations across all target owned accommodations
    const { data: rawReservations, error: resError } = await adminClient
      .from('reservations')
      .select('*')
      .in('accommodation_id', targetAccIds)
      .order('created_at', { ascending: false });

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    const reservationsList = rawReservations || [];

  // 2. Safely enrich guest nickname & email on the server (avoiding client FK/RLS issues)
  const guestIds = Array.from(
    new Set(
      reservationsList
        .map((r: any) => r.guest_id)
        .filter((id: any): id is string => typeof id === 'string' && id.trim().length > 0)
    )
  );

  const guestInfoMap = new Map<string, { nickname: string; email: string }>();

  if (guestIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('*')
      .in('id', guestIds);

    for (const p of profiles || []) {
      guestInfoMap.set(String(p.id), {
        nickname: p.nickname || '',
        email: typeof p.email === 'string' ? p.email : '',
      });
    }

    // Resolve emails from Supabase Auth admin API when not stored on user_profiles
    await Promise.all(
      guestIds.map(async (gid) => {
        const existing = guestInfoMap.get(gid) || { nickname: '', email: '' };
        if (existing.email) return;
        try {
          const { data: authUserRes } = await adminClient.auth.admin.getUserById(gid);
          if (authUserRes?.user?.email) {
            guestInfoMap.set(gid, {
              ...existing,
              email: authUserRes.user.email,
            });
          }
        } catch {
          // Ignore if service role key is unavailable
        }
      })
    );
  }

  const reservationById = new Map<string, any>();
  const enrichedReservations = reservationsList.map((r: any) => {
    reservationById.set(String(r.id), r);
    const guestInfo = r.guest_id ? guestInfoMap.get(String(r.guest_id)) : undefined;
    return {
      ...r,
      user_profiles: guestInfo
        ? {
            nickname: guestInfo.nickname || undefined,
            email: guestInfo.email || undefined,
          }
        : null,
    };
  });

  // 3. Read guest ledgers from BOTH guest_ledgers table AND admin_config fallback across all target accommodations
    let dbLedgers: any[] = [];
    try {
      const { data: lRows, error: lErr } = await adminClient
        .from('guest_ledgers')
        .select('*')
        .in('accommodation_id', targetAccIds)
        .order('created_at', { ascending: false });
      if (!lErr && Array.isArray(lRows)) {
        dbLedgers = lRows;
      }
    } catch {
      dbLedgers = [];
    }

    const fallbackLedgerArrays = await Promise.all(
      targetAccIds.map((aid) => readAdminConfigJson<any[]>(adminClient, `b2b_ledgers_${aid}`, []))
    );
    const fallbackLedgers = fallbackLedgerArrays.flatMap((arr) => (Array.isArray(arr) ? arr : []));
    const fallbackByResId = new Map<string, any>();
    for (const fl of fallbackLedgers) {
      if (fl?.reservation_id) {
        fallbackByResId.set(String(fl.reservation_id), fl);
      }
    }

    const seenReservationIds = new Set<string>();
    const seenLedgerIds = new Set<string>();
    const mergedLedgers: any[] = [];

    for (const row of [...dbLedgers, ...fallbackLedgers]) {
      if (!row) continue;
      const lid = row.id ? String(row.id) : '';
      const rid = row.reservation_id ? String(row.reservation_id) : '';
      if (lid && seenLedgerIds.has(lid)) continue;
      if (rid && seenReservationIds.has(rid)) continue;
      if (lid) seenLedgerIds.add(lid);
      if (rid) seenReservationIds.add(rid);

      const fbMatch = rid ? fallbackByResId.get(rid) : null;
      const linkedRes = rid ? reservationById.get(rid) : null;
      mergedLedgers.push({
        ...(fbMatch || {}),
        ...row,
        reservations:
          row.reservations ||
          (linkedRes
            ? {
                check_in_date: linkedRes.check_in_date,
                check_out_date: linkedRes.check_out_date,
                guest_count: linkedRes.guest_count,
              }
            : null),
      });
    }

    mergedLedgers.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    // 4. Query real today PV from tracking_events (with fallback_tracking_events fallback)
    let todayPv = 0;
    const startOfDayIso = getStartOfTodayJstIso();
    const startOfDayMs = new Date(startOfDayIso).getTime();
    const targetAccIdSet = new Set(targetAccIds.map(String));
    let trackingTableOk = false;

    try {
      const { count, error: pvErr } = await adminClient
        .from('tracking_events')
        .select('id', { count: 'exact', head: true })
        .in('facility_id', targetAccIds)
        .gte('created_at', startOfDayIso);
      if (!pvErr && typeof count === 'number') {
        todayPv = count;
        trackingTableOk = true;
      }
    } catch {
      trackingTableOk = false;
    }

    if (!trackingTableOk) {
      const fbEvents = await readAdminConfigJson<any[]>(
        adminClient,
        'fallback_tracking_events',
        []
      );
      if (Array.isArray(fbEvents)) {
        todayPv = fbEvents.filter((ev) => {
          if (!ev || !targetAccIdSet.has(String(ev.facility_id || ''))) return false;
          const ts = ev.created_at ? new Date(ev.created_at).getTime() : 0;
          return ts >= startOfDayMs;
        }).length;
      }
    }

    return NextResponse.json({
      accommodation: {
        ...acc,
        island_name: islandName,
      },
      accommodations: ownedList.map((a: any) => ({
        id: a.id,
        name: a.name,
        island_id: a.island_id,
        island_name: ALL_ISLANDS_MASTER_DICTIONARY[String(a.island_id || '').trim()]?.name || '',
      })),
      reservations: enrichedReservations,
      ledgers: mergedLedgers,
      todayPv,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '予約一覧の取得に失敗しました' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveOwnerAccommodation(req);
    if ('errorResponse' in resolved && resolved.errorResponse) {
      return resolved.errorResponse;
    }

    const { role, ownedIds, adminClient } = resolved;
    if (ownedIds.size === 0 && role !== 'super_admin') {
      return NextResponse.json({ error: '宿泊施設が見つかりません' }, { status: 404 });
    }

    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const resId = typeof body?.id === 'string' ? body.id.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim() : '';

    if (!resId || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: '有効な予約IDおよびステータスが必要です' },
        { status: 400 }
      );
    }

    const { data: existingRes, error: fetchErr } = await adminClient
      .from('reservations')
      .select('id, accommodation_id')
      .eq('id', resId)
      .maybeSingle();

    if (fetchErr || !existingRes) {
      return NextResponse.json({ error: '該当の予約が見つかりません' }, { status: 404 });
    }

    if (role !== 'super_admin' && !ownedIds.has(String(existingRes.accommodation_id))) {
      return NextResponse.json({ error: 'この予約を更新する権限がありません' }, { status: 403 });
    }

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (body.cancellation_reason !== undefined) {
      updateData.cancellation_reason = body.cancellation_reason
        ? String(body.cancellation_reason)
        : null;
    }
    if (body.internal_notes !== undefined) {
      updateData.internal_notes = String(body.internal_notes || '');
    }

    const { data: updated, error: updateErr } = await adminClient
      .from('reservations')
      .update(updateData)
      .eq('id', resId)
      .select('*')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reservation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '予約の更新に失敗しました' }, { status: 500 });
  }
}
