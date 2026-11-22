import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserAuth } from '@/lib/userAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const ALLOWED_CERTIFICATE_TYPES = ['card', 'standard', 'high_quality'] as const;

function getJstStartOfMonthIso(): string {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = jstNow.getUTCFullYear();
  const mm = String(jstNow.getUTCMonth() + 1).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-01T00:00:00+09:00`).toISOString();
}

function validateSupabaseImageUrl(rawUrl: unknown, supabaseUrl: string): { valid: boolean; url: string | null } {
  if (rawUrl === undefined || rawUrl === null || rawUrl === '') {
    return { valid: true, url: null };
  }
  if (typeof rawUrl !== 'string') {
    return { valid: false, url: null };
  }
  try {
    const parsed = new URL(rawUrl.trim());
    const expectedHost = new URL(supabaseUrl).hostname;
    if (parsed.protocol !== 'https:' || parsed.hostname !== expectedHost) {
      return { valid: false, url: null };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, url: null };
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey || supabaseKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const auth = await verifyUserAuth(request);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || '認証が必要です' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const { islandId: rawIslandId, type = 'high_quality', imageUrl } = body || {};
    const rawStr = rawIslandId !== undefined && rawIslandId !== null ? String(rawIslandId).trim() : '';
    const userId = auth.user.id;

    if (body?.userId && body.userId !== userId) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 403 });
    }

    if (!rawStr) {
      return NextResponse.json({ error: 'Missing islandId' }, { status: 400 });
    }

    const imgCheck = validateSupabaseImageUrl(imageUrl, supabaseUrl);
    if (!imgCheck.valid) {
      return NextResponse.json({ error: '無効な画像URLです（公式ストレージのみ許可されています）' }, { status: 400 });
    }
    const safeImageUrl = imgCheck.url;

    // Normalize islandId via ALL_ISLANDS_MASTER_DICTIONARY so slug vs numeric ID never splits serial numbers
    const lowerRaw = rawStr.toLowerCase();
    const masterEntry =
      ALL_ISLANDS_MASTER_DICTIONARY[rawStr] ||
      Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
        (isl) => isl.slug === lowerRaw || isl.name === rawStr
      );
    const islandId = String(masterEntry?.id || rawStr);

    if (!ALLOWED_CERTIFICATE_TYPES.includes(type)) {
      return NextResponse.json({ error: '無効な証明書タイプです' }, { status: 400 });
    }

    // Verify user actually visited this island in island_visits
    const candidateIslandIds = Array.from(
      new Set(
        [rawStr, islandId, masterEntry?.slug, masterEntry?.name]
          .filter((v): v is string => Boolean(v && String(v).trim()))
          .map((v) => String(v).trim())
      )
    );

    const { data: visitRows, error: visitErr } = await supabase
      .from('island_visits')
      .select('island_id, status')
      .eq('user_id', userId)
      .in('island_id', candidateIslandIds);

    if (visitErr) {
      console.error('Error checking island_visits:', visitErr);
      return NextResponse.json({ error: '訪問履歴の確認に失敗しました' }, { status: 500 });
    }

    const hasVisited = (visitRows || []).some(
      (r: any) => !r.status || r.status === 'visited' || r.status === 'verified_visited'
    );
    if (!hasVisited) {
      return NextResponse.json({ error: '未訪問の島の公式証明書は発行できません' }, { status: 403 });
    }

    // Check if certificate already exists for this user and island (same type) BEFORE checking monthly quota
    const { data: existingCert, error: existingError } = await supabase
      .from('certificates')
      .select('*')
      .eq('island_id', islandId)
      .eq('user_id', userId)
      .eq('type', type)
      .single();

    if (existingCert) {
      // If a newer imageUrl was uploaded, update it
      if (safeImageUrl && safeImageUrl !== existingCert.image_url) {
        const { data: updatedCert } = await supabase
          .from('certificates')
          .update({ image_url: safeImageUrl })
          .eq('id', existingCert.id)
          .select()
          .single();
        return NextResponse.json({ certificate: updatedCert || existingCert, message: 'Already issued (updated image)' });
      }
      return NextResponse.json({ certificate: existingCert, message: 'Already issued' });
    }

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing certificate:', existingError);
      return NextResponse.json({ error: 'Database error checking certificate' }, { status: 500 });
    }

    // Check user tier (respecting premium_until expiration) and tickets
    const profileRes = await supabase
      .from('user_profiles')
      .select('subscription_tier, premium_until, high_quality_tickets')
      .eq('id', userId)
      .maybeSingle();

    const rawTier = profileRes.data?.subscription_tier || 'free';
    const premiumUntil = profileRes.data?.premium_until;
    const isExpired =
      rawTier !== 'free' &&
      Boolean(premiumUntil) &&
      new Date(premiumUntil as string).getTime() < Date.now();
    const tier = isExpired ? 'free' : rawTier;
    const tickets = profileRes.data?.high_quality_tickets || 0;

    let useTicket = false;

    // Apply limits for high_quality (startOfMonth in JST UTC+9)
    if (type === 'high_quality') {
      const startOfMonthIso = getJstStartOfMonthIso();

      const { count } = await supabase.from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'high_quality')
        .gte('created_at', startOfMonthIso);
      
      const monthlyCount = count || 0;

      if (tier === 'free' && monthlyCount >= 1) {
        if (tickets > 0) {
          useTicket = true;
        } else {
          return NextResponse.json({ error: 'FREE_LIMIT_REACHED', message: '無料プランの今月の高画質クラウド保存枠（1枚）を使い切りました（画像DLは引き続き無料でご利用いただけます）。' }, { status: 403 });
        }
      } else if (tier === 'premium' && monthlyCount >= 5) {
        if (tickets > 0) {
          useTicket = true;
        } else {
          return NextResponse.json({ error: 'PREMIUM_LIMIT_REACHED', message: '今月のPremium高画質クラウド保存枠（5枚）を使い切りました。チケットを利用するか、Ultimateプランへの変更をご検討ください。' }, { status: 403 });
        }
      }
      // Ultimate is unlimited
    }

    // Get the max serial number for this island (regardless of type to keep serials unique per island)
    const { data: maxSerialData, error: maxSerialError } = await supabase
      .from('certificates')
      .select('serial_number')
      .eq('island_id', islandId)
      .order('serial_number', { ascending: false })
      .limit(1);

    if (maxSerialError) {
      console.error('Error getting max serial:', maxSerialError);
      return NextResponse.json({ error: 'Failed to get serial number' }, { status: 500 });
    }

    let nextSerial = 1;
    if (maxSerialData && maxSerialData.length > 0) {
      nextSerial = maxSerialData[0].serial_number + 1;
    }

    // Use transaction-like approach: decrement ticket then insert
    if (useTicket) {
      const { error: ticketError } = await supabase.rpc('decrement_ticket', { user_id_param: userId });
      // If RPC is not available, do standard update (may have race conditions but acceptable for MVP)
      if (ticketError) {
        await supabase.from('user_profiles').update({ high_quality_tickets: tickets - 1 }).eq('id', userId);
      }
    }

    // Insert new certificate
    const { data: newCert, error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        island_id: islandId,
        serial_number: nextSerial,
        payment_status: 'pending',
        type: type,
        image_url: safeImageUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting certificate:', insertError);
      // rollback ticket if failed (best effort)
      if (useTicket) {
        await supabase.from('user_profiles').update({ high_quality_tickets: tickets }).eq('id', userId);
      }
      return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
    }

    return NextResponse.json({ certificate: newCert, usedTicket: useTicket });

  } catch (error) {
    console.error('Certificate issue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
