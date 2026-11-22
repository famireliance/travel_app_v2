import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const FALLBACK_PROMO_KEY = 'fallback_promo_codes';
const FALLBACK_REDEMPTIONS_KEY = 'fallback_promo_redemptions';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!code) {
      return NextResponse.json({ error: 'クーポンコードを入力してください' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || supabaseServiceKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Look up the code in app_promo_codes (or fallback_promo_codes in admin_config)
    let promoCode: any = null;
    let isFallbackPromo = false;

    const { data: dbPromoCode, error: promoError } = await adminClient
      .from('app_promo_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (!promoError && dbPromoCode) {
      promoCode = dbPromoCode;
    } else {
      const fbCodes = await getFallbackJson<any[]>(FALLBACK_PROMO_KEY, []);
      const list = Array.isArray(fbCodes) ? fbCodes : [];
      const found = list.find(
        (c: any) => String(c?.code || '').trim().toUpperCase() === code.toUpperCase()
      );
      if (found) {
        promoCode = found;
        isFallbackPromo = true;
      }
    }

    if (!promoCode) {
      return NextResponse.json({ error: '無効なコードです。' }, { status: 404 });
    }

    // 3. Check if expired (valid_until || expires_at) or max_uses reached
    const expiryDate = promoCode.valid_until || promoCode.expires_at;
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return NextResponse.json({ error: 'このコードは有効期限切れです。' }, { status: 400 });
    }
    if (
      promoCode.max_uses !== null &&
      promoCode.max_uses !== undefined &&
      Number(promoCode.current_uses || 0) >= Number(promoCode.max_uses)
    ) {
      return NextResponse.json({ error: 'このコードは利用上限に達しています。' }, { status: 400 });
    }

    // 4 & 5. Check & record redemption (DB table with fallback_promo_redemptions support)
    const fbRedemptionsRaw = await getFallbackJson<any[]>(FALLBACK_REDEMPTIONS_KEY, []);
    const fbRedemptions = Array.isArray(fbRedemptionsRaw) ? fbRedemptionsRaw : [];
    const alreadyInFallback = fbRedemptions.some(
      (r: any) =>
        r &&
        r.user_id === user.id &&
        (r.promo_code_id === promoCode.id ||
          String(r.code || '').toUpperCase() === String(promoCode.code || '').toUpperCase())
    );
    if (alreadyInFallback) {
      return NextResponse.json({ error: 'このコードはすでに利用済みです。' }, { status: 400 });
    }

    if (!isFallbackPromo) {
      const { data: existingRedemption, error: checkRedeemErr } = await adminClient
        .from('promo_code_redemptions')
        .select('id')
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRedemption) {
        return NextResponse.json({ error: 'このコードはすでに利用済みです。' }, { status: 400 });
      }

      if (!checkRedeemErr) {
        const { error: redemptionError } = await adminClient
          .from('promo_code_redemptions')
          .insert({
            promo_code_id: promoCode.id,
            user_id: user.id,
          });

        if (redemptionError) {
          if (redemptionError.code === '23505') {
            return NextResponse.json({ error: 'このコードはすでに利用済みです。' }, { status: 400 });
          }
          // Table missing or FK issue -> persist in fallback_promo_redemptions
          fbRedemptions.unshift({
            id: crypto.randomUUID(),
            promo_code_id: promoCode.id,
            code: promoCode.code,
            user_id: user.id,
            redeemed_at: new Date().toISOString(),
          });
          await setFallbackJson(FALLBACK_REDEMPTIONS_KEY, fbRedemptions);
        }
      } else {
        fbRedemptions.unshift({
          id: crypto.randomUUID(),
          promo_code_id: promoCode.id,
          code: promoCode.code,
          user_id: user.id,
          redeemed_at: new Date().toISOString(),
        });
        await setFallbackJson(FALLBACK_REDEMPTIONS_KEY, fbRedemptions);
      }

      await adminClient
        .from('app_promo_codes')
        .update({ current_uses: Number(promoCode.current_uses || 0) + 1 })
        .eq('id', promoCode.id);
    } else {
      fbRedemptions.unshift({
        id: crypto.randomUUID(),
        promo_code_id: promoCode.id,
        code: promoCode.code,
        user_id: user.id,
        redeemed_at: new Date().toISOString(),
      });
      await setFallbackJson(FALLBACK_REDEMPTIONS_KEY, fbRedemptions);

      const fbCodes = await getFallbackJson<any[]>(FALLBACK_PROMO_KEY, []);
      const list = Array.isArray(fbCodes) ? fbCodes : [];
      const updatedCodes = list.map((c: any) =>
        c.id === promoCode.id || String(c?.code || '').toUpperCase() === code.toUpperCase()
          ? { ...c, current_uses: Number(c.current_uses || 0) + 1 }
          : c
      );
      await setFallbackJson(FALLBACK_PROMO_KEY, updatedCodes);
    }

    const rewardAmount = Math.max(1, Math.floor(Number(promoCode.reward_amount) || 1));

    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('high_quality_tickets')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileError && userProfile) {
      await adminClient
        .from('user_profiles')
        .update({
          high_quality_tickets: Number(userProfile.high_quality_tickets || 0) + rewardAmount
        })
        .eq('id', user.id);
    } else {
      await adminClient
        .from('user_profiles')
        .upsert({
          id: user.id,
          high_quality_tickets: rewardAmount
        }, { onConflict: 'id' });
    }

    // 6. Return success message
    return NextResponse.json({ success: true, message: `クーポン適用完了！ ${rewardAmount}枚のチケットを獲得しました。` });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
