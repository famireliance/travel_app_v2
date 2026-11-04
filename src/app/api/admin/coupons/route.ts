import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/adminAuth';
import { getStripeConfig } from '@/lib/stripeConfig';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { stripe } = await getStripeConfig();
    const promotionCodes = await stripe.promotionCodes.list({ limit: 100, active: true });
    return NextResponse.json({ coupons: promotionCodes.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { stripe } = await getStripeConfig();
    const { code, percent_off, amount_off } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'クーポンコードを入力してください' }, { status: 400 });
    }

    // 1. まず Coupon オブジェクトを作成
    let couponParams: Stripe.CouponCreateParams = { name: code };
    if (percent_off) {
      couponParams.percent_off = parseFloat(percent_off);
    } else if (amount_off) {
      couponParams.amount_off = parseInt(amount_off, 10);
      couponParams.currency = 'jpy';
    } else {
      return NextResponse.json({ error: '割引額または割引率を設定してください' }, { status: 400 });
    }

    const coupon = await stripe.coupons.create(couponParams);

    // 2. Promotion Code を作成して紐付け
    const promotionCode = await stripe.promotionCodes.create({
      // @ts-ignore
      coupon: coupon.id,
      code: code,
    });

    return NextResponse.json({ success: true, promotionCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
