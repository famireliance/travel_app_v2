import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function normalizeOrder(o: any, shippingOv: Record<string, any> = {}) {
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
    tracking_number: ov.tracking_number ?? o.tracking_number ?? '',
    carrier: ov.carrier ?? o.carrier ?? '',
    notes: ov.notes ?? o.notes ?? '',
    ordered_at: o.ordered_at || o.created_at || new Date().toISOString(),
    shipped_at: ov.shipped_at ?? o.shipped_at ?? undefined,
    delivered_at: ov.delivered_at ?? o.delivered_at ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});

  // First try physical_orders, then merge/fallback with orders
  const [{ data: physOrders }, { data: legacyOrders, error }] = await Promise.all([
    adminClient.from('physical_orders').select('*').order('ordered_at', { ascending: false }),
    adminClient.from('orders').select('*').order('created_at', { ascending: false }),
  ]);

  if (error && !physOrders) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const combined = [...(physOrders || []), ...(legacyOrders || [])];
  const seen = new Set<string>();
  const uniqueOrders = combined.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  }).map(o => normalizeOrder(o, shippingOv));

  return NextResponse.json({ orders: uniqueOrders });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json();

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});

  // 一括更新の場合
  if (Array.isArray(body.ids) && body.status) {
    const { ids, status, carrier } = body;
    const nowIso = new Date().toISOString();
    const updateData: any = { status };
    if (status === 'shipped') updateData.shipped_at = nowIso;
    if (status === 'delivered') updateData.delivered_at = nowIso;
    if (carrier) updateData.carrier = carrier;

    await adminClient.from('physical_orders').update(updateData).in('id', ids);
    const { error } = await adminClient.from('orders').update(updateData).in('id', ids);

    if (error) {
      // Fallback: update only status column on orders and persist shipping fields in admin_config
      await adminClient.from('orders').update({ status }).in('id', ids);
      for (const id of ids) {
        shippingOv[id] = { ...(shippingOv[id] || {}), ...updateData };
      }
      await setFallbackJson('fallback_order_shipping', shippingOv);
    }
    return NextResponse.json({ success: true, message: `${ids.length}件の注文ステータスを更新しました` });
  }

  // 単一更新の場合
  const { id, status, tracking_number, carrier, notes } = body;
  if (!id || !status) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const updateData: any = { status };
  if (status === 'shipped') updateData.shipped_at = nowIso;
  if (status === 'delivered') updateData.delivered_at = nowIso;
  if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
  if (carrier !== undefined) updateData.carrier = carrier;
  if (notes !== undefined) updateData.notes = notes;

  await adminClient.from('physical_orders').update(updateData).eq('id', id);
  const { error } = await adminClient.from('orders').update(updateData).eq('id', id);

  if (error) {
    // Fallback: update only status column on orders and persist shipping fields in admin_config
    await adminClient.from('orders').update({ status }).eq('id', id);
    shippingOv[id] = { ...(shippingOv[id] || {}), ...updateData };
    await setFallbackJson('fallback_order_shipping', shippingOv);
  }

  return NextResponse.json({ success: true, message: '注文ステータス・発送情報を更新しました' });
}
