import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verifyUserAuth } from '@/lib/userAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const ALLOWED_CERTIFICATE_TYPES = ['card', 'standard', 'high_quality'] as const;
const FREE_HIGH_QUALITY_MONTHLY_LIMIT = 1;
const PREMIUM_HIGH_QUALITY_MONTHLY_LIMIT = 5;
const FREE_CARD_DAILY_LIMIT = 3;

function getJstStartOfMonthIso(): string {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = jstNow.getUTCFullYear();
  const mm = String(jstNow.getUTCMonth() + 1).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-01T00:00:00+09:00`).toISOString();
}

function getJstStartOfDayIso(): string {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = jstNow.getUTCFullYear();
  const mm = String(jstNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jstNow.getUTCDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`).toISOString();
}

function resolveCanonicalIsland(rawStr: string): { islandId: string; candidateIslandIds: string[] } {
  const trimmed = rawStr.trim();
  const lowerRaw = trimmed.toLowerCase();
  const masterEntry =
    ALL_ISLANDS_MASTER_DICTIONARY[trimmed] ||
    Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (isl) => isl.slug === lowerRaw || isl.name === trimmed
    );
  const islandId = String(masterEntry?.id || trimmed);
  const candidateIslandIds = Array.from(
    new Set(
      [trimmed, islandId, masterEntry?.slug, masterEntry?.name]
        .filter((v): v is string => Boolean(v && String(v).trim()))
        .map((v) => String(v).trim())
    )
  );
  return { islandId, candidateIslandIds };
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

async function uploadCertificateDataUrl(
  supabase: SupabaseClient,
  userId: string,
  islandId: string,
  type: string,
  imageDataUrl: string
): Promise<string | null> {
  if (imageDataUrl.length > 5_200_000) {
    throw new Error('証明書画像サイズが大きすぎます');
  }
  const match = imageDataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new Error('無効な画像データ形式です');
  }
  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (buffer.byteLength === 0 || buffer.byteLength > 4_000_000) {
    throw new Error('無効な画像ファイルサイズです');
  }

  const safeIsland = islandId.replace(/[^A-Za-z0-9_-]/g, '_');
  const storagePath = `${userId}/${safeIsland}_${type}_${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('certificates')
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadErr) {
    console.error('Server storage upload error:', uploadErr);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('certificates').getPublicUrl(storagePath);
  return publicUrl || null;
}

async function computeUserQuotaAndTier(supabase: SupabaseClient, userId: string) {
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
  const tier: 'free' | 'premium' | 'ultimate' = isExpired
    ? 'free'
    : rawTier === 'ultimate'
    ? 'ultimate'
    : rawTier === 'premium'
    ? 'premium'
    : 'free';
  const tickets = Number(profileRes.data?.high_quality_tickets || 0);

  const startOfMonthIso = getJstStartOfMonthIso();
  const startOfDayIso = getJstStartOfDayIso();

  const [{ count: hqCount }, { count: cardCount }] = await Promise.all([
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'high_quality')
      .gte('created_at', startOfMonthIso),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('type', ['card', 'standard'])
      .gte('created_at', startOfDayIso),
  ]);

  const highQualityMonthlyUsed = hqCount || 0;
  const highQualityMonthlyLimit =
    tier === 'ultimate'
      ? null
      : tier === 'premium'
      ? PREMIUM_HIGH_QUALITY_MONTHLY_LIMIT
      : FREE_HIGH_QUALITY_MONTHLY_LIMIT;
  const highQualityRemaining =
    highQualityMonthlyLimit === null
      ? null
      : Math.max(0, highQualityMonthlyLimit - highQualityMonthlyUsed);

  const cardDailyUsed = cardCount || 0;
  const cardDailyLimit = tier === 'free' ? FREE_CARD_DAILY_LIMIT : null;
  const cardDailyRemaining =
    cardDailyLimit === null ? null : Math.max(0, cardDailyLimit - cardDailyUsed);

  return {
    tier,
    tickets,
    quota: {
      highQualityMonthlyLimit,
      highQualityMonthlyUsed,
      highQualityRemaining,
      cardDailyLimit,
      cardDailyUsed,
      cardDailyRemaining,
    },
  };
}

export async function GET(request: Request) {
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

    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const rawIslandId = searchParams.get('islandId');

    const { tier, tickets, quota } = await computeUserQuotaAndTier(supabase, userId);

    if (rawIslandId && rawIslandId.trim()) {
      const { islandId, candidateIslandIds } = resolveCanonicalIsland(rawIslandId);

      const [{ data: visitRows }, { data: certRows }] = await Promise.all([
        supabase
          .from('island_visits')
          .select('island_id, status')
          .eq('user_id', userId)
          .in('island_id', candidateIslandIds),
        supabase
          .from('certificates')
          .select('*')
          .eq('user_id', userId)
          .in('island_id', candidateIslandIds)
          .order('created_at', { ascending: false }),
      ]);

      const hasVisited =
        (visitRows || []).some(
          (r: { status?: string | null }) =>
            !r.status || r.status === 'visited' || r.status === 'verified_visited'
        ) || (certRows || []).length > 0;

      return NextResponse.json({
        islandId,
        tier,
        tickets,
        quota,
        hasVisited,
        existingCertificates: certRows || [],
      });
    }

    const { data: allCerts } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      tier,
      tickets,
      quota,
      certificates: allCerts || [],
    });
  } catch (error) {
    console.error('Certificate status GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const { islandId: rawIslandId, type = 'high_quality', imageUrl, imageDataUrl } = body || {};
    const rawStr = rawIslandId !== undefined && rawIslandId !== null ? String(rawIslandId).trim() : '';
    const userId = auth.user.id;

    if (body?.userId && body.userId !== userId) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 403 });
    }

    if (!rawStr) {
      return NextResponse.json({ error: 'Missing islandId' }, { status: 400 });
    }

    if (!ALLOWED_CERTIFICATE_TYPES.includes(type)) {
      return NextResponse.json({ error: '無効な証明書タイプです' }, { status: 400 });
    }

    const { islandId, candidateIslandIds } = resolveCanonicalIsland(rawStr);

    const imgCheck = validateSupabaseImageUrl(imageUrl, supabaseUrl);
    if (!imgCheck.valid) {
      return NextResponse.json(
        { error: '無効な画像URLです（公式ストレージのみ許可されています）' },
        { status: 400 }
      );
    }
    let safeImageUrl = imgCheck.url;

    // Verify user actually visited this island (or already holds an issued certificate for it)
    const [{ data: visitRows, error: visitErr }, { data: existingRows, error: existingError }] =
      await Promise.all([
        supabase
          .from('island_visits')
          .select('island_id, status')
          .eq('user_id', userId)
          .in('island_id', candidateIslandIds),
        supabase
          .from('certificates')
          .select('*')
          .eq('user_id', userId)
          .in('island_id', candidateIslandIds)
          .eq('type', type)
          .order('created_at', { ascending: true })
          .limit(1),
      ]);

    if (visitErr) {
      console.error('Error checking island_visits:', visitErr);
      return NextResponse.json({ error: '訪問履歴の確認に失敗しました' }, { status: 500 });
    }

    if (existingError) {
      console.error('Error checking existing certificate:', existingError);
      return NextResponse.json({ error: 'Database error checking certificate' }, { status: 500 });
    }

    const existingCert = existingRows && existingRows.length > 0 ? existingRows[0] : null;
    const hasVisited =
      Boolean(existingCert) ||
      (visitRows || []).some(
        (r: { status?: string | null }) =>
          !r.status || r.status === 'visited' || r.status === 'verified_visited'
      );

    if (!hasVisited) {
      return NextResponse.json(
        { error: 'UNVISITED_ISLAND', message: '未訪問の島の公式証明書は発行できません。先に現地チェックインまたは到達記録を行ってください。' },
        { status: 403 }
      );
    }

    // Re-issuance / Re-save of an ALREADY issued (user, island, type) certificate:
    // Consumes ZERO monthly/daily quota and preserves permanent serial_number!
    if (existingCert) {
      if (!safeImageUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
        try {
          safeImageUrl = await uploadCertificateDataUrl(supabase, userId, islandId, type, imageDataUrl);
        } catch (upErr: unknown) {
          return NextResponse.json(
            { error: upErr instanceof Error ? upErr.message : '画像の保存に失敗しました' },
            { status: 400 }
          );
        }
      }

      let finalCert = existingCert;
      if (safeImageUrl && safeImageUrl !== existingCert.image_url) {
        const { data: updatedCert } = await supabase
          .from('certificates')
          .update({ image_url: safeImageUrl })
          .eq('id', existingCert.id)
          .select()
          .single();
        if (updatedCert) finalCert = updatedCert;
      }

      const statusAfter = await computeUserQuotaAndTier(supabase, userId);
      return NextResponse.json({
        certificate: finalCert,
        isReissue: true,
        tier: statusAfter.tier,
        tickets: statusAfter.tickets,
        quota: statusAfter.quota,
        message: 'Already issued',
      });
    }

    // New issuance: enforce strict monthly / daily quota BEFORE uploading or inserting
    const { tier, tickets, quota } = await computeUserQuotaAndTier(supabase, userId);
    let useTicket = false;

    if (type === 'high_quality') {
      if (tier === 'free' && quota.highQualityMonthlyUsed >= FREE_HIGH_QUALITY_MONTHLY_LIMIT) {
        if (tickets > 0) {
          useTicket = true;
        } else {
          return NextResponse.json(
            {
              error: 'FREE_LIMIT_REACHED',
              message: `無料プランの今月の公式高画質版発行枠（月${FREE_HIGH_QUALITY_MONTHLY_LIMIT}枚）を使い切りました。無料の「カード版」をご利用いただくか、Premium（月5枚）/ Ultimate（無制限）へのアップグレードをご検討ください。`,
              tier,
              tickets,
              quota,
            },
            { status: 403 }
          );
        }
      } else if (tier === 'premium' && quota.highQualityMonthlyUsed >= PREMIUM_HIGH_QUALITY_MONTHLY_LIMIT) {
        if (tickets > 0) {
          useTicket = true;
        } else {
          return NextResponse.json(
            {
              error: 'PREMIUM_LIMIT_REACHED',
              message: `今月のPremium公式高画質版発行枠（月${PREMIUM_HIGH_QUALITY_MONTHLY_LIMIT}枚）を使い切りました。無料の「カード版」またはチケットをご利用いただくか、Ultimateプラン（無制限）への変更をご検討ください。`,
              tier,
              tickets,
              quota,
            },
            { status: 403 }
          );
        }
      }
    } else {
      // 'card' or 'standard' new-island anti-abuse daily limit for Free tier
      if (tier === 'free' && quota.cardDailyUsed >= FREE_CARD_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: 'DAILY_CARD_LIMIT_REACHED',
            message: `無料プランでの新規「カード版」発行上限（1日${FREE_CARD_DAILY_LIMIT}島まで）に達しました。発行済みの島はいつでも無制限で再ダウンロード可能です。制限なしで即時発行するにはPremium / Ultimateプランをご検討ください。`,
            tier,
            tickets,
            quota,
          },
          { status: 403 }
        );
      }
    }

    // Upload imageDataUrl via service_role if provided
    if (!safeImageUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
      try {
        safeImageUrl = await uploadCertificateDataUrl(supabase, userId, islandId, type, imageDataUrl);
      } catch (upErr: unknown) {
        return NextResponse.json(
          { error: upErr instanceof Error ? upErr.message : '画像の保存に失敗しました' },
          { status: 400 }
        );
      }
    }

    // Get max serial number for this island (across canonical + slug candidates)
    const { data: maxSerialData, error: maxSerialError } = await supabase
      .from('certificates')
      .select('serial_number')
      .in('island_id', candidateIslandIds)
      .order('serial_number', { ascending: false })
      .limit(1);

    if (maxSerialError) {
      console.error('Error getting max serial:', maxSerialError);
      return NextResponse.json({ error: 'Failed to get serial number' }, { status: 500 });
    }

    let nextSerial = 1;
    if (maxSerialData && maxSerialData.length > 0 && typeof maxSerialData[0].serial_number === 'number') {
      nextSerial = maxSerialData[0].serial_number + 1;
    }

    if (useTicket) {
      const { error: ticketError } = await supabase.rpc('decrement_ticket', { user_id_param: userId });
      if (ticketError) {
        await supabase
          .from('user_profiles')
          .update({ high_quality_tickets: Math.max(0, tickets - 1) })
          .eq('id', userId);
      }
    }

    const { data: newCert, error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        island_id: islandId,
        serial_number: nextSerial,
        payment_status: 'pending',
        type,
        image_url: safeImageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting certificate:', insertError);
      if (useTicket) {
        await supabase.from('user_profiles').update({ high_quality_tickets: tickets }).eq('id', userId);
      }
      return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
    }

    const updatedStatus = await computeUserQuotaAndTier(supabase, userId);

    return NextResponse.json({
      certificate: newCert,
      isReissue: false,
      usedTicket: useTicket,
      tier: updatedStatus.tier,
      tickets: updatedStatus.tickets,
      quota: updatedStatus.quota,
    });
  } catch (error) {
    console.error('Certificate issue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
