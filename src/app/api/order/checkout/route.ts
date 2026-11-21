import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { verifyUserAuth } from '@/lib/userAuth';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

// プラン別の価格・名称定義
const PLANS: Record<string, { name: string; amount: number; description: string }> = {
  standard: {
    name: 'KIRATABI公式到達証明書（台紙付き）',
    amount: 1500,
    description: 'A4サイズ・高品質印刷・シリアルナンバー入り',
  },
  frame_simple: {
    name: 'KIRATABI公式到達証明書（簡易フレーム装飾）',
    amount: 3000,
    description: 'A4サイズ・簡易フレーム付き',
  },
  frame_wood: {
    name: 'KIRATABI公式到達証明書（高級木製フレーム）',
    amount: 6000,
    description: 'A4サイズ・高級木製フレーム',
  },
  frame_acrylic: {
    name: 'KIRATABI公式到達証明書（アクリル額装プレミアム）',
    amount: 10000,
    description: 'A4サイズ・最高級アクリル額装',
  },
};

export async function POST(req: NextRequest) {
  try {
    // 認証ヘッダーがある場合はJWT検証し、未検証の body.userId は一切信用しない
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let verifiedUserId = 'anonymous';
    if (authHeader) {
      const auth = await verifyUserAuth(req);
      if (!auth.user) {
        return NextResponse.json({ error: auth.error || '認証トークンが無効です' }, { status: 401 });
      }
      verifiedUserId = auth.user.id;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const {
      plan,
      design = 'horizontal',
      laminated = false,
      country = 'Japan',
      travelerName,
      recipientName,
      postalCode,
      address,
      phone,
      islandId,
      islandName,
      visitDate,
    } = body || {};

    if (authHeader && body?.userId && body.userId !== verifiedUserId) {
      return NextResponse.json({ error: '不正なユーザーIDです' }, { status: 403 });
    }

    // バリデーション
    if (!recipientName?.trim() || !address?.trim() || !travelerName?.trim() || !postalCode?.trim()) {
      return NextResponse.json({ error: '必須項目（旅人ネーム・お届け先名・郵便番号・住所）が不足しています' }, { status: 400 });
    }
    if (!islandId && !islandName) {
      return NextResponse.json({ error: '島の情報が不足しています' }, { status: 400 });
    }

    const rawIdStr = String(islandId || '').trim();
    const masterEntry =
      ALL_ISLANDS_MASTER_DICTIONARY[rawIdStr] ||
      Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
        (isl) => isl.slug === rawIdStr.toLowerCase() || isl.name === islandName
      );
    const canonicalIslandId = String(masterEntry?.id || rawIdStr || 'unknown');
    const resolvedIslandName = String(masterEntry?.name || islandName || canonicalIslandId);

    const { stripe } = await getStripeConfig();
    const planKey = plan && PLANS[plan] ? plan : 'standard';
    const planInfo = PLANS[planKey];
    const isLaminated = laminated === true;
    const unitAmount = planInfo.amount + (isLaminated ? 300 : 0);

    const ALLOWED_ORIGINS = ['https://island.kira-tabi.com', 'http://localhost:3000', 'http://localhost:3001'];
    const rawOrigin = req.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://island.kira-tabi.com';

    // 注文番号・シリアルナンバー生成
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const islandKey = (canonicalIslandId || resolvedIslandName || 'ISL').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ISL';
    const timestampSuffix = Date.now().toString(36).toUpperCase().slice(-4);
    const pendingSerial = `KT-${new Date().getFullYear()}-${islandKey}-${timestampSuffix}`;

    const cancelParams = canonicalIslandId && canonicalIslandId !== 'unknown'
      ? `?island_id=${encodeURIComponent(masterEntry?.slug || canonicalIslandId)}`
      : '';

    // Stripe Checkout Session 作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${planInfo.name}${isLaminated ? '（ラミネート加工付き）' : ''}`,
              description: `${resolvedIslandName} の到達証明書 / 旅人ネーム: ${travelerName}`,
              images: [],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/cancel${cancelParams}`,
      metadata: {
        order_number: orderNumber,
        plan: planKey,
        design: String(design || 'horizontal'),
        laminated: String(isLaminated),
        country: String(country || 'Japan'),
        traveler_name: String(travelerName).slice(0, 200),
        recipient_name: String(recipientName).slice(0, 200),
        postal_code: String(postalCode).slice(0, 40),
        address: String(address).slice(0, 500),
        phone: String(phone || '').slice(0, 40),
        island_id: canonicalIslandId,
        island_name: resolvedIslandName,
        visit_date: String(visitDate || new Date().toISOString().slice(0, 10)),
        user_id: verifiedUserId,
        pending_serial: pendingSerial,
      },
      allow_promotion_codes: true,
      locale: 'ja',
    });

    // 注文レコードを pending_payment 状態で保存（physical_orders 未作成時は orders へフォールバック）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith('REPLACE')) {
      try {
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        let savedInPhysical = false;
        if (verifiedUserId !== 'anonymous') {
          const orderRecord = {
            user_id: verifiedUserId,
            island_id: canonicalIslandId,
            type: planKey,
            shipping_name: recipientName,
            shipping_postal_code: postalCode,
            shipping_address: country && country !== 'Japan' ? `[${country}] ${address}` : address,
            shipping_phone: phone || null,
            status: 'pending_payment',
            stripe_session_id: session.id,
            ordered_at: new Date().toISOString(),
          };
          const { error: physErr } = await adminClient.from('physical_orders').insert([orderRecord]);
          if (!physErr) {
            savedInPhysical = true;
          }
        }

        if (!savedInPhysical) {
          const formattedAddress = `${country && country !== 'Japan' ? `[${country}] ` : ''}〒${postalCode} ${address}${phone ? ` (TEL: ${phone})` : ''}`;
          const { error: ordErr } = await adminClient.from('orders').insert([{
            order_number: orderNumber,
            serial_number: pendingSerial,
            stripe_session_id: session.id,
            ...(verifiedUserId !== 'anonymous' ? { user_id: verifiedUserId } : {}),
            island_id: canonicalIslandId,
            island_name: resolvedIslandName,
            plan: planKey,
            traveler_name: travelerName,
            recipient_name: recipientName,
            address: formattedAddress,
            visit_date: visitDate || new Date().toISOString().slice(0, 10),
            status: 'pending_payment',
            created_at: new Date().toISOString(),
          }]);
          if (ordErr) {
            // スキーマ差分がある場合でも確実に orders に記録を残す最小構成フォールバック
            await adminClient.from('orders').insert([{
              order_number: orderNumber,
              serial_number: pendingSerial,
              island_id: canonicalIslandId,
              island_name: resolvedIslandName,
              plan: planKey,
              traveler_name: travelerName,
              recipient_name: recipientName,
              address: formattedAddress,
              visit_date: visitDate || new Date().toISOString().slice(0, 10),
              status: 'pending_payment',
            }]);
          }
        }
      } catch (dbErr) {
        console.warn('Order pre-save warning:', dbErr);
      }
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, orderNumber });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '決済セッションの作成に失敗しました';
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
