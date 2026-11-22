import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserAuth } from '@/lib/userAuth';

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

async function readFallbackLedgers(
  client: NonNullable<ReturnType<typeof getAdminClient>>,
  accId: string
): Promise<any[]> {
  try {
    const { data, error } = await client
      .from('admin_config')
      .select('value')
      .eq('key', `b2b_ledgers_${accId}`)
      .maybeSingle();
    if (error || data?.value == null) return [];
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const resId = (id || '').trim();
    if (!resId) {
      return NextResponse.json({ error: '予約IDが必要です' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    // Select ONLY non-sensitive summary fields (NEVER expose raw guest_notes or internal_notes!)
    const { data: res, error: resError } = await adminClient
      .from('reservations')
      .select('id, accommodation_id, check_in_date, check_out_date, guest_count, status')
      .eq('id', resId)
      .maybeSingle();

    if (resError || !res) {
      return NextResponse.json({ error: '該当の予約が見つかりません' }, { status: 404 });
    }

    let accSummary = { name: '宿泊施設', address: '' };
    if (res.accommodation_id) {
      const { data: acc } = await adminClient
        .from('accommodations')
        .select('name, address')
        .eq('id', res.accommodation_id)
        .maybeSingle();
      if (acc) {
        accSummary = {
          name: acc.name || '宿泊施設',
          address: acc.address || '',
        };
      }
    }

    let alreadySubmitted = false;
    try {
      const { data: existingLedger } = await adminClient
        .from('guest_ledgers')
        .select('id')
        .eq('reservation_id', resId)
        .limit(1)
        .maybeSingle();
      if (existingLedger) {
        alreadySubmitted = true;
      }
    } catch {
      // Fallback check below
    }

    if (!alreadySubmitted && res.accommodation_id) {
      const fallbackLedgers = await readFallbackLedgers(adminClient, String(res.accommodation_id));
      if (fallbackLedgers.some((l) => l && String(l.reservation_id) === resId)) {
        alreadySubmitted = true;
      }
    }

    return NextResponse.json({
      reservation: {
        id: res.id,
        accommodation_id: res.accommodation_id,
        check_in_date: res.check_in_date,
        check_out_date: res.check_out_date,
        guest_count: res.guest_count,
        status: res.status,
        accommodations: accSummary,
      },
      alreadySubmitted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'チェックイン情報の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const resId = (id || '').trim();
    if (!resId) {
      return NextResponse.json({ error: '予約IDが必要です' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const address = typeof body?.address === 'string' ? body.address.trim() : '';
    const occupation = typeof body?.occupation === 'string' ? body.occupation.trim() : '';
    const previousLocation =
      typeof body?.previous_location === 'string' ? body.previous_location.trim() : '';
    const nextLocation =
      typeof body?.next_location === 'string' ? body.next_location.trim() : '';
    const nationality =
      typeof body?.nationality === 'string' ? body.nationality.trim().slice(0, 100) : '';
    const passportNumber =
      typeof body?.passport_number === 'string' ? body.passport_number.trim().slice(0, 100) : '';
    const ageNum = Number(body?.age);

    if (
      !name ||
      name.length > 100 ||
      !address ||
      address.length > 300 ||
      !occupation ||
      occupation.length > 100 ||
      !previousLocation ||
      previousLocation.length > 200 ||
      !nextLocation ||
      nextLocation.length > 200 ||
      !Number.isFinite(ageNum) ||
      ageNum < 0 ||
      ageNum > 130
    ) {
      return NextResponse.json(
        { error: '宿泊台帳の必須項目を正しく入力してください' },
        { status: 400 }
      );
    }

    const { data: res, error: resError } = await adminClient
      .from('reservations')
      .select('id, accommodation_id, status')
      .eq('id', resId)
      .maybeSingle();

    if (resError || !res || !res.accommodation_id) {
      return NextResponse.json({ error: '該当の予約が見つかりません' }, { status: 404 });
    }

    if (res.status === 'cancelled' || res.status === 'rejected') {
      return NextResponse.json(
        { error: 'キャンセルまたはお断り済みの予約には宿泊台帳を登録できません' },
        { status: 400 }
      );
    }

    // Optional authentication (pre-checkin links sent via email/LINE work without login too)
    let guestId: string | null = null;
    if (req.headers.get('authorization') || req.headers.get('Authorization')) {
      const authRes = await verifyUserAuth(req);
      if (authRes.user) {
        guestId = authRes.user.id;
      }
    }

    const accId = String(res.accommodation_id);

    // Check if already submitted
    try {
      const { data: existingLedger } = await adminClient
        .from('guest_ledgers')
        .select('id')
        .eq('reservation_id', resId)
        .limit(1)
        .maybeSingle();
      if (existingLedger) {
        return NextResponse.json({ success: true, alreadySubmitted: true });
      }
    } catch {
      // Continue to fallback check
    }

    const existingFallback = await readFallbackLedgers(adminClient, accId);
    if (existingFallback.some((l) => l && String(l.reservation_id) === resId)) {
      return NextResponse.json({ success: true, alreadySubmitted: true });
    }

    const basePayload = {
      reservation_id: res.id,
      accommodation_id: res.accommodation_id,
      guest_id: guestId,
      name,
      address,
      occupation,
      age: Math.round(ageNum),
      previous_location: previousLocation,
      next_location: nextLocation,
    };

    const fullPayload = {
      ...basePayload,
      ...(nationality ? { nationality } : {}),
      ...(passportNumber ? { passport_number: passportNumber } : {}),
    };

    let savedToGuestLedgers = false;
    let savedWithOptionalFields = !nationality && !passportNumber;
    try {
      const { error: insertErr } = await adminClient
        .from('guest_ledgers')
        .insert(fullPayload);
      if (!insertErr) {
        savedToGuestLedgers = true;
        savedWithOptionalFields = true;
      } else if (nationality || passportNumber) {
        const retry = await adminClient.from('guest_ledgers').insert(basePayload);
        if (!retry.error) {
          savedToGuestLedgers = true;
        }
      }
    } catch {
      savedToGuestLedgers = false;
    }

    // Ensure fallback persistence in admin_config when guest_ledgers rejects or lacks optional columns
    if (!savedToGuestLedgers || !savedWithOptionalFields) {
      const fallbackEntry = {
        id: `ldg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...fullPayload,
        created_at: new Date().toISOString(),
      };
      const updatedList = [fallbackEntry, ...existingFallback];
      const { error: cfgErr } = await adminClient.from('admin_config').upsert(
        {
          key: `b2b_ledgers_${accId}`,
          value: JSON.stringify(updatedList),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (cfgErr && !savedToGuestLedgers) {
        return NextResponse.json(
          { error: '宿泊台帳の保存に失敗しました: ' + cfgErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '宿泊台帳の登録に失敗しました' }, { status: 500 });
  }
}
