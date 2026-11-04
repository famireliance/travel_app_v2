import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function normalizeUserOrder(o: any, shippingOv: Record<string, any> = {}) {
  const ov = shippingOv[o.id] || {};
  const rawAddr = ov.shipping_address ?? o.shipping_address ?? o.address ?? '';
  let postal = ov.shipping_postal_code ?? o.shipping_postal_code ?? '';
  let addr = rawAddr;
  const postalMatch = !postal && typeof rawAddr === 'string' ? rawAddr.match(/^〒([0-9\-]+)\s+(.*)$/) : null;
  if (postalMatch) {
    postal = postalMatch[1];
    addr = postalMatch[2];
  }
  const rawStatus = ov.status ?? o.status ?? 'ordered';
  const normalizedStatus = (rawStatus === 'paid' || rawStatus === 'received') ? 'ordered' : rawStatus;

  return {
    ...o,
    id: o.id,
    user_id: o.user_id,
    island_id: o.island_id,
    type: o.type || o.plan || 'standard',
    shipping_name: ov.shipping_name ?? o.shipping_name ?? o.recipient_name ?? o.traveler_name ?? '',
    shipping_postal_code: postal,
    shipping_address: addr,
    shipping_phone: ov.shipping_phone ?? o.shipping_phone ?? '',
    status: normalizedStatus,
    ordered_at: o.ordered_at || o.created_at || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});

    const { data: orders, error } = await adminClient
      .from('physical_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('ordered_at', { ascending: false });

    if (error) {
      const { data: fallbackOrders, error: fbError } = await adminClient
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (fbError) {
        return NextResponse.json({ orders: [] });
      }
      return NextResponse.json({
        orders: (fallbackOrders || []).map(o => normalizeUserOrder(o, shippingOv))
      });
    }

    return NextResponse.json({
      orders: (orders || []).map(o => normalizeUserOrder(o, shippingOv))
    });
  } catch (err) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { id, shipping_name, shipping_postal_code, shipping_address, shipping_phone } = body;

    if (!id || !shipping_name || !shipping_postal_code || !shipping_address) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 自分の注文で、かつ発送前か確認 (physical_orders -> orders フォールバック)
    let existingOrder: any = null;
    let isLegacyTable = false;

    const { data: physOrder } = await adminClient
      .from('physical_orders')
      .select('status, user_id')
      .eq('id', id)
      .maybeSingle();

    if (physOrder) {
      existingOrder = physOrder;
    } else {
      const { data: legOrder } = await adminClient
        .from('orders')
        .select('status, user_id')
        .eq('id', id)
        .maybeSingle();
      if (legOrder) {
        existingOrder = legOrder;
        isLegacyTable = true;
      }
    }

    if (!existingOrder || existingOrder.user_id !== user.id) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});
    const currentStatus = shippingOv[id]?.status || existingOrder.status;

    if (currentStatus === 'shipped' || currentStatus === 'delivered') {
      return NextResponse.json({ error: 'すでに発送済みのため変更できません' }, { status: 400 });
    }

    if (!isLegacyTable) {
      const { error: updateError } = await adminClient
        .from('physical_orders')
        .update({
          shipping_name,
          shipping_postal_code,
          shipping_address,
          shipping_phone
        })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
      }
    } else {
      await adminClient
        .from('orders')
        .update({
          recipient_name: shipping_name,
          address: `〒${shipping_postal_code} ${shipping_address}`
        })
        .eq('id', id);

      shippingOv[id] = {
        ...(shippingOv[id] || {}),
        shipping_name,
        shipping_postal_code,
        shipping_address,
        shipping_phone
      };
      await setFallbackJson('fallback_order_shipping', shippingOv);
    }

    return NextResponse.json({ success: true, message: '配送先情報を更新しました' });
  } catch (err) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
