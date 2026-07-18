import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, travelerName, recipientName, address, islandId, islandName, visitDate, userId } = body;

    if (
      typeof recipientName !== 'string' || !recipientName.trim() ||
      typeof address !== 'string' || !address.trim() ||
      typeof travelerName !== 'string' || !travelerName.trim() ||
      ((typeof islandId !== 'string' || !islandId.trim()) && (typeof islandName !== 'string' || !islandName.trim()))
    ) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // 1. 一連番号シリアルナンバーの生成 (DBに注文記録があればその連番、なければハッシュベースの連番No.xxxx)
    let visitNum = Math.floor(1001 + Math.random() * 8999);
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        visitNum = count + 1;
      }
    } catch (e) {
      console.warn('Orders count check fallback:', e);
    }

    const islandKey = (islandId || islandName || 'ISL').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ISL';
    const timestampSuffix = Date.now().toString(36).toUpperCase().slice(-4);
    const serialNumber = `KT-${new Date().getFullYear()}-${islandKey}-No.${String(visitNum).padStart(4, '0')}-${timestampSuffix}`;
    const orderNumber = `ORD-2026-${String(visitNum).padStart(4, '0')}`;

    const orderRecord = {
      order_number: orderNumber,
      serial_number: serialNumber,
      user_id: userId || 'anonymous',
      island_id: islandId || 'unknown',
      island_name: islandName || 'unknown',
      plan: plan || 'standard',
      traveler_name: travelerName,
      recipient_name: recipientName,
      address: address,
      visit_date: visitDate || new Date().toISOString().slice(0, 10),
      status: 'received',
      created_at: new Date().toISOString()
    };

    // 2. Supabaseへの注文データ保存
    const { error: dbError } = await supabase.from('orders').insert([orderRecord]);
    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json({ error: 'ご注文の保存に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
    }

    // 3. 運営およびユーザーへの通知ペイロード生成
    const notificationPayload = {
      success: true,
      orderNumber,
      serialNumber,
      message: `公式到達証明書（${plan === 'premium' ? 'プレミアム額装版' : 'スタンダード版'}）のオーダーを受付いたしました。`,
      details: {
        islandName,
        travelerName,
        recipientName,
        address,
        estimatedDelivery: '約3〜5営業日'
      }
    };

    return NextResponse.json(notificationPayload, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '注文処理中に予期せぬエラーが発生しました';
    console.error('Order API error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
