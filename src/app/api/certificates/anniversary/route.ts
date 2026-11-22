import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    // 認証チェック
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // プロフィール & admin_config ("ultimate_meta_" + userId) 取得
    const [{ data: profile, error: profileError }, ultimateMeta] = await Promise.all([
      adminClient.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      getFallbackJson<{ ultimate_started_at?: string | null; anniversary_cert_used?: boolean }>(
        `ultimate_meta_${user.id}`,
        {}
      ),
    ]);

    if (profileError || !profile) {
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
    }

    // 有効期限チェック付きで Ultimate プランか確認
    const rawTier = profile.subscription_tier || 'free';
    const isExpired =
      rawTier !== 'free' &&
      Boolean(profile.premium_until) &&
      new Date(profile.premium_until).getTime() < Date.now();
    const effectiveTier = isExpired ? 'free' : rawTier;

    if (effectiveTier !== 'ultimate') {
      return NextResponse.json({ error: 'この特典はUltimateプラン限定です' }, { status: 403 });
    }

    // 1周年特典を既に使用済みか確認
    const anniversaryCertUsed = Boolean(
      ultimateMeta.anniversary_cert_used ?? profile.anniversary_cert_used ?? false
    );
    if (anniversaryCertUsed) {
      return NextResponse.json({ error: '1周年記念特典は既に使用済みです' }, { status: 409 });
    }

    // 申請期間チェック（1年以上 かつ 18ヶ月以内）
    const ultimateStartedAt = ultimateMeta.ultimate_started_at ?? profile.ultimate_started_at ?? null;
    if (!ultimateStartedAt) {
      return NextResponse.json({ error: 'Ultimate開始日が記録されていません。しばらくお待ちください。' }, { status: 400 });
    }

    const startedAt = new Date(ultimateStartedAt);
    const now = new Date();
    const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceStart < 365) {
      return NextResponse.json({ error: 'Ultimate加入から1年が経過していません' }, { status: 403 });
    }
    if (daysSinceStart > 365 + 180) {
      return NextResponse.json({ error: '申請期限（1周年から6ヶ月以内）が過ぎています' }, { status: 403 });
    }

    // リクエストボディを取得
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const { island_id, island_name, recipient_name, postal_code, address, phone, imageUrl, image_url } = body || {};

    if (!island_id || !island_name || !recipient_name || !postal_code || !address || !phone) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }

    // imageUrl が指定されている場合は https:// かつ Supabase ホストであることを検証
    const rawImg = imageUrl ?? image_url;
    if (rawImg !== undefined && rawImg !== null && rawImg !== '') {
      if (typeof rawImg !== 'string') {
        return NextResponse.json({ error: '無効な画像URLです' }, { status: 400 });
      }
      try {
        const parsed = new URL(rawImg.trim());
        const expectedHost = new URL(supabaseUrl).hostname;
        if (parsed.protocol !== 'https:' || parsed.hostname !== expectedHost) {
          return NextResponse.json({ error: '許可されていない画像URLドメインです' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: '無効な画像URLです' }, { status: 400 });
      }
    }

    // 訪問実績の検証
    const rawIslandStr = String(island_id).trim();
    const lowerRaw = rawIslandStr.toLowerCase();
    const masterEntry =
      ALL_ISLANDS_MASTER_DICTIONARY[rawIslandStr] ||
      Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
        (isl) => isl.slug === lowerRaw || isl.name === rawIslandStr || isl.name === island_name
      );
    const canonicalIslandId = String(masterEntry?.id || rawIslandStr);
    const candidateIslandIds = Array.from(
      new Set(
        [rawIslandStr, canonicalIslandId, masterEntry?.slug, masterEntry?.name]
          .filter((v): v is string => Boolean(v && String(v).trim()))
          .map((v) => String(v).trim())
      )
    );

    const { data: visitRows, error: visitErr } = await adminClient
      .from('island_visits')
      .select('island_id, status')
      .eq('user_id', user.id)
      .in('island_id', candidateIslandIds);

    if (visitErr) {
      return NextResponse.json({ error: '訪問履歴の確認に失敗しました' }, { status: 500 });
    }

    const hasVisited = (visitRows || []).some(
      (r: any) => !r.status || r.status === 'visited' || r.status === 'verified_visited'
    );
    if (!hasVisited) {
      return NextResponse.json({ error: '未訪問の島の公式証明書は発行できません' }, { status: 403 });
    }

    // physical_orders に INSERT (未作成時は orders にフォールバック)
    const { error: insertError } = await adminClient
      .from('physical_orders')
      .insert({
        user_id: user.id,
        island_id: canonicalIslandId,
        type: 'anniversary',
        shipping_name: recipient_name,
        shipping_postal_code: postal_code,
        shipping_address: address,
        shipping_phone: phone,
        status: 'ordered',
      });

    if (insertError) {
      const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const visitDateJst = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(jstNow.getUTCDate()).padStart(2, '0')}`;
      const { error: fbInsertError } = await adminClient
        .from('orders')
        .insert({
          order_number: `ORD-ANNIV-${Date.now().toString(36).toUpperCase()}`,
          serial_number: `KT-ANNIV-${jstNow.getUTCFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
          user_id: user.id,
          island_id: canonicalIslandId,
          island_name: masterEntry?.name || island_name,
          plan: 'anniversary',
          traveler_name: profile.nickname || recipient_name,
          recipient_name,
          address: `〒${postal_code} ${address} (TEL: ${phone})`,
          visit_date: visitDateJst,
          status: 'ordered',
          created_at: new Date().toISOString(),
        });
      if (fbInsertError) {
        console.error('Insert error:', fbInsertError);
        return NextResponse.json({ error: '申請の保存に失敗しました' }, { status: 500 });
      }
    }

    // anniversary_cert_used を admin_config ("ultimate_meta_" + userId) に保存
    await setFallbackJson(`ultimate_meta_${user.id}`, {
      ...ultimateMeta,
      ultimate_started_at: ultimateStartedAt,
      anniversary_cert_used: true,
    });

    return NextResponse.json({ success: true, message: '申請を受け付けました' });
  } catch (err) {
    console.error('Anniversary certificate error:', err);
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
