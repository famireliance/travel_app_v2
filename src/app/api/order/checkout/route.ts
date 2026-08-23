import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-07-29.dahlia',
});

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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
    const body = await req.json();
    const { plan, travelerName, recipientName, postalCode, address, phone, islandId, islandName, visitDate, userId } = body;

    // バリデーション
    if (!recipientName?.trim() || !address?.trim() || !travelerName?.trim() || !postalCode?.trim()) {
      return NextResponse.json({ error: '必須項目（旅人ネーム・お届け先名・郵便番号・住所）が不足しています' }, { status: 400 });
    }
    if (!islandId && !islandName) {
      return NextResponse.json({ error: '島の情報が不足しています' }, { status: 400 });
    }

    const planInfo = PLANS[plan] || PLANS.standard;
    const origin = req.headers.get('origin') || 'https://island.kira-tabi.com';

    // シリアルナンバー生成
    const islandKey = (islandId || islandName || 'ISL').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ISL';
    const timestampSuffix = Date.now().toString(36).toUpperCase().slice(-4);
    const pendingSerial = `KT-${new Date().getFullYear()}-${islandKey}-${timestampSuffix}`;

    // Stripe Checkout Session 作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: planInfo.name,
              description: `${islandName || islandId} の到達証明書 / 旅人ネーム: ${travelerName}`,
              images: [],
            },
            unit_amount: planInfo.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/cancel`,
      metadata: {
        plan: plan || 'standard',
        traveler_name: travelerName,
        recipient_name: recipientName,
        postal_code: postalCode,
        address: address.slice(0, 500),
        phone: phone || '',
        island_id: islandId || '',
        island_name: islandName || '',
        visit_date: visitDate || new Date().toISOString().slice(0, 10),
        user_id: userId || 'anonymous',
        pending_serial: pendingSerial,
      },
      allow_promotion_codes: true,
      locale: 'ja',
    });

    // 注文レコードを pending 状態で保存
    if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
      try {
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        await adminClient.from('physical_orders').insert([{
          user_id: userId || 'anonymous',
          island_id: islandId || 'unknown',
          type: plan || 'standard',
          shipping_name: recipientName,
          shipping_postal_code: postalCode,
          shipping_address: address,
          shipping_phone: phone || null,
          status: 'pending_payment',
          stripe_session_id: session.id,
          ordered_at: new Date().toISOString(),
        }]);
      } catch {
        // テーブルが存在しない場合は無視
      }
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '決済セッションの作成に失敗しました';
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
