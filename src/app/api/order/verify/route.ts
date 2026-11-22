import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'session_idが必要です' }, { status: 400 });
  }

  try {
    const { stripe } = await getStripeConfig();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: '支払いが完了していません' }, { status: 402 });
    }

    const meta = session.metadata || {};
    const deterministicSuffix = sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase() || 'VERIFIED';

    // シリアルナンバー・注文番号の確定（リロードしても同一の番号を再利用）
    const islandKey = (meta.island_id || meta.island_name || 'ISL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ISL';
    const sessionYear = session.created ? new Date(session.created * 1000).getFullYear() : new Date().getFullYear();
    let finalSerial = meta.pending_serial || `KT-${sessionYear}-${islandKey}-${deterministicSuffix.slice(-4)}`;
    let finalOrderNumber = meta.order_number || `ORD-${deterministicSuffix}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // DBの既存注文番号を再利用しつつステータスを ordered に更新
    if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith('REPLACE')) {
      try {
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : '';
        const trackedKeys: string[] = [sessionId];

        // 1. physical_orders の確認と更新
        let hasPhysicalRow = false;
        const { data: existingPhys, error: physSelectErr } = await adminClient
          .from('physical_orders')
          .select('id, status')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (!physSelectErr && existingPhys) {
          hasPhysicalRow = true;
          if (existingPhys.id) trackedKeys.push(String(existingPhys.id));
          if (existingPhys.status === 'pending_payment') {
            await adminClient
              .from('physical_orders')
              .update({
                status: 'ordered',
                stripe_payment_intent: paymentIntentId,
              })
              .eq('id', existingPhys.id);
          }
        }

        // 2. orders テーブルの確認・order_number 再利用・フォールバック作成
        const { data: existingLegacy, error: legSelectErr } = await adminClient
          .from('orders')
          .select('id, order_number, serial_number, status')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (!legSelectErr && existingLegacy) {
          if (existingLegacy.id) trackedKeys.push(String(existingLegacy.id));
          if (existingLegacy.order_number) {
            finalOrderNumber = existingLegacy.order_number;
          }
          if (existingLegacy.serial_number) {
            finalSerial = existingLegacy.serial_number;
          }
          if (existingLegacy.status === 'pending_payment') {
            await adminClient
              .from('orders')
              .update({
                status: 'ordered',
                serial_number: finalSerial,
                stripe_payment_intent: paymentIntentId,
                paid_at: new Date().toISOString(),
              })
              .eq('id', existingLegacy.id);
          }
        } else if (!hasPhysicalRow) {
          // physical_orders が存在せず orders にも未登録だった場合は確定レコードを作成
          const formattedAddress = `${meta.country && meta.country !== 'Japan' ? `[${meta.country}] ` : ''}〒${meta.postal_code || ''} ${meta.address || ''}${meta.phone ? ` (TEL: ${meta.phone})` : ''}`.trim();
          const { data: createdOrd } = await adminClient
            .from('orders')
            .insert([{
              order_number: finalOrderNumber,
              serial_number: finalSerial,
              stripe_session_id: sessionId,
              ...(meta.user_id && meta.user_id !== 'anonymous' ? { user_id: meta.user_id } : {}),
              island_id: meta.island_id || 'unknown',
              island_name: ALL_ISLANDS_MASTER_DICTIONARY[meta.island_id || '']?.name || meta.island_name || meta.island_id || 'unknown',
              plan: meta.plan || 'standard',
              traveler_name: meta.traveler_name || '',
              recipient_name: meta.recipient_name || '',
              address: formattedAddress,
              visit_date: meta.visit_date || new Date().toISOString().slice(0, 10),
              status: 'ordered',
              created_at: new Date().toISOString(),
            }])
            .select('id')
            .maybeSingle();
          if (createdOrd?.id) trackedKeys.push(String(createdOrd.id));
        }

        const shippingOv = await getFallbackJson<Record<string, any>>('fallback_order_shipping', {});
        const verifiedMeta = {
          laminated: meta.laminated === 'true',
          design: meta.design || 'horizontal',
          amount: session.amount_total ?? undefined,
          shipping_phone: meta.phone || '',
          country: meta.country || 'Japan',
          traveler_name: meta.traveler_name || '',
          visit_date: meta.visit_date || '',
          order_number: finalOrderNumber,
          serial_number: finalSerial,
        };
        for (const key of trackedKeys) {
          if (!key) continue;
          shippingOv[key] = {
            ...(shippingOv[key] || {}),
            ...verifiedMeta,
            shipping_phone: shippingOv[key]?.shipping_phone || verifiedMeta.shipping_phone,
          };
        }
        await setFallbackJson('fallback_order_shipping', shippingOv);
      } catch (dbErr) {
        console.warn('Order verify DB sync warning:', dbErr);
      }
    }

    const resolvedIslandName =
      (meta.island_id && ALL_ISLANDS_MASTER_DICTIONARY[meta.island_id]?.name) ||
      meta.island_name ||
      meta.island_id ||
      '';

    return NextResponse.json({
      success: true,
      orderNumber: finalOrderNumber,
      serialNumber: finalSerial,
      islandId: meta.island_id || '',
      islandName: resolvedIslandName,
      travelerName: meta.traveler_name,
      plan: meta.plan || 'standard',
      design: meta.design || 'horizontal',
      laminated: meta.laminated === 'true',
      country: meta.country || 'Japan',
      amount: session.amount_total,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '決済確認に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
