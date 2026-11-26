import { NextRequest, NextResponse } from 'next/server';
import { getStripeConfig } from '@/lib/stripeConfig';
import { verifyUserAuth } from '@/lib/userAuth';

const TICKET_PACKS: Record<
  'pack_3' | 'pack_10',
  { tickets: number; amount: number; name: string }
> = {
  pack_3: {
    tickets: 3,
    amount: 450,
    name: 'KIRATABI 公式高画質証明書チケット（3枚パック・有効期限なし）',
  },
  pack_10: {
    tickets: 10,
    amount: 1200,
    name: 'KIRATABI 公式高画質証明書チケット（10枚周遊お得パック・有効期限なし）',
  },
};

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyUserAuth(req);
    if (!auth.user) {
      return NextResponse.json({ error: auth.error || '認証が必要です' }, { status: 401 });
    }

    const userId = auth.user.id;

    let body: { pack?: string; cancelPath?: string } = {};
    try {
      body = (await req.json()) || {};
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const rawPack = body.pack;
    if (rawPack !== 'pack_3' && rawPack !== 'pack_10') {
      return NextResponse.json(
        { error: '有効なチケットパック（pack_3 または pack_10）を指定してください' },
        { status: 400 }
      );
    }

    const packKey: 'pack_3' | 'pack_10' = rawPack;
    const packInfo = TICKET_PACKS[packKey];

    const safeCancelPath =
      typeof body.cancelPath === 'string' &&
      body.cancelPath.startsWith('/') &&
      !body.cancelPath.startsWith('//')
        ? body.cancelPath
        : '/mypage';

    const ALLOWED_ORIGINS = [
      'https://island.kira-tabi.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    const rawOrigin = req.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://island.kira-tabi.com';

    const { stripe } = await getStripeConfig();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: userId,
      ...(auth.user.email ? { customer_email: auth.user.email } : {}),
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: packInfo.name,
              description: `公式高画質デジタル到達証明書の発行枠を${packInfo.tickets}枚追加（有効期限なし・全国離島共通）`,
            },
            unit_amount: packInfo.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        purchase_type: 'hq_ticket_pack',
        user_id: userId,
        pack_key: packKey,
        ticket_count: String(packInfo.tickets),
      },
      success_url: `${origin}/mypage?ticket_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${safeCancelPath || '/mypage'}`,
      allow_promotion_codes: true,
      locale: 'ja',
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'チケット決済セッションの作成に失敗しました';
    console.error('Ticket checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
