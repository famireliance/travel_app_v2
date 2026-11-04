import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'このエンドポイントは廃止されました。Stripe決済（/api/order/checkout）をご利用ください。' },
    { status: 410 }
  );
}
