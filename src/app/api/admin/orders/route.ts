import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function normalizeOrder(o: any, shippingOv: Record<string, any> = {}) {
  const sessionOv = o.stripe_session_id ? (shippingOv[o.stripe_session_id] || {}) : {};
  const idOv = o.id ? (shippingOv[o.id] || {}) : {};
  const ov = { ...sessionOv, ...idOv };
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
    laminated: Boolean(ov.laminated ?? o.laminated ?? false),
    design: ov.design ?? o.design ?? 'horizontal',
    amount: ov.amount ?? o.amount ?? undefined,
    country: ov.country ?? o.country ?? 'Japan',
    traveler_name: ov.traveler_name ?? o.traveler_name ?? '',
    visit_date: ov.visit_date ?? o.visit_date ?? '',
    order_number: ov.order_number ?? o.order_number ?? '',
    serial_number: ov.serial_number ?? o.serial_number ?? '',
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
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});

    // First try physical_orders (ignoring missing table error), then merge/fallback with orders
    let physOrders: any[] = [];
    try {
      const physRes = await adminClient
        .from('physical_orders')
        .select('*')
        .order('ordered_at', { ascending: false });
      if (!physRes.error && Array.isArray(physRes.data)) {
        physOrders = physRes.data;
      }
    } catch {
      // physical_orders does not exist in live Supabase
    }

    const { data: legacyOrders, error } = await adminClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && physOrders.length === 0) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const combined = [...physOrders, ...(legacyOrders || [])];
    const seen = new Set<string>();
    const seenSessions = new Set<string>();
    const uniqueOrders = combined.filter(o => {
      if (o.id && seen.has(o.id)) return false;
      if (o.stripe_session_id && seenSessions.has(o.stripe_session_id)) return false;
      if (o.id) seen.add(o.id);
      if (o.stripe_session_id) seenSessions.add(o.stripe_session_id);
      return true;
    }).map(o => normalizeOrder(o, shippingOv));

    return NextResponse.json({ orders: uniqueOrders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '注文一覧の取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});

    // 一括更新の場合
    if (Array.isArray(body?.ids) && body?.status) {
      const { ids, status, carrier } = body;
      const nowIso = new Date().toISOString();
      const updateData: any = { status };
      if (status === 'shipped') updateData.shipped_at = nowIso;
      if (status === 'delivered') updateData.delivered_at = nowIso;
      if (carrier) updateData.carrier = carrier;

      let physErr: any = null;
      try {
        const physRes = await adminClient.from('physical_orders').update(updateData).in('id', ids);
        physErr = physRes.error;
      } catch (e) {
        physErr = e;
      }

      const { error } = await adminClient.from('orders').update(updateData).in('id', ids);

      if (error) {
        try {
          await adminClient.from('orders').update({ status }).in('id', ids);
        } catch {}
      }

      if (error || physErr || status === 'cancelled') {
        for (const id of ids) {
          shippingOv[id] = { ...(shippingOv[id] || {}), ...updateData };
        }
        await setFallbackJson('fallback_order_shipping', shippingOv);
      }
      return NextResponse.json({ success: true, message: `${ids.length}件の注文ステータスを更新しました` });
    }

    // 単一更新の場合
    const { id, status, tracking_number, carrier, notes } = body || {};
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

    let physErr: any = null;
    try {
      const physRes = await adminClient.from('physical_orders').update(updateData).eq('id', id);
      physErr = physRes.error;
    } catch (e) {
      physErr = e;
    }

    const { error } = await adminClient.from('orders').update(updateData).eq('id', id);

    if (error) {
      try {
        await adminClient.from('orders').update({ status }).eq('id', id);
      } catch {}
    }

    if (error || physErr || status === 'cancelled') {
      shippingOv[id] = { ...(shippingOv[id] || {}), ...updateData };
      await setFallbackJson('fallback_order_shipping', shippingOv);
    }

    return NextResponse.json({ success: true, message: '注文ステータス・発送情報を更新しました' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '注文更新中にエラーが発生しました' }, { status: 500 });
  }
}
