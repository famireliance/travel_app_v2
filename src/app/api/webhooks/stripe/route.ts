import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripeConfig } from '@/lib/stripeConfig';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

interface UltimateMeta {
  ultimate_started_at?: string | null;
  anniversary_cert_used?: boolean;
}

async function syncUltimateMeta(userId: string, tier: string) {
  if (!userId) return;
  const key = `ultimate_meta_${userId}`;
  const meta = await getFallbackJson<UltimateMeta>(key, {});
  if (tier === 'ultimate') {
    if (!meta.ultimate_started_at) {
      await setFallbackJson<UltimateMeta>(key, {
        ...meta,
        ultimate_started_at: new Date().toISOString(),
      });
    }
  } else if (meta.ultimate_started_at) {
    await setFallbackJson<UltimateMeta>(key, {
      ...meta,
      ultimate_started_at: null,
    });
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let stripe: Stripe;
  let webhookSecret: string;
  let priceIdUltimate: string;

  try {
    const cfg = await getStripeConfig();
    stripe = cfg.stripe;
    webhookSecret = cfg.webhookSecret;
    priceIdUltimate = cfg.priceIdUltimate;
  } catch (err: any) {
    console.error('Stripe config load failed in webhook:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Stripe configuration error' }, { status: 500 });
  }

  if (!webhookSecret || !supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
    console.error('Webhook secret or Supabase Service Key is not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const userId = session.client_reference_id || session.metadata?.user_id || '';
          const rawCustomer = session.customer;
          const customerId = typeof rawCustomer === 'string' ? rawCustomer : rawCustomer?.id || null;
          const rawSub = session.subscription;
          const subscriptionId = typeof rawSub === 'string' ? rawSub : rawSub?.id || null;

          if (userId && subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const tier =
              (priceId && priceIdUltimate && priceId === priceIdUltimate) ||
              subscription.metadata?.tier === 'ultimate' ||
              session.metadata?.tier === 'ultimate'
                ? 'ultimate'
                : 'premium';

            const periodEndUnix = (subscription as any).current_period_end || (subscription as any).trial_end || (subscription.items?.data?.[0] as any)?.current_period_end || (Date.now()/1000 + 30*24*60*60);
            const periodEnd = new Date(periodEndUnix * 1000);

            const upsertPayload = {
              id: userId,
              subscription_tier: tier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              premium_until: periodEnd.toISOString(),
              is_premium: true,
            };

            const { error: upsertErr } = await adminClient
              .from('user_profiles')
              .upsert(upsertPayload, { onConflict: 'id' });
            if (upsertErr) throw upsertErr;

            await syncUltimateMeta(userId, tier);
            console.log(`Updated user ${userId} to ${tier}`);
          }
        } else if (session.mode === 'payment') {
          // Physical order payment completed
          const sessionId = session.id;
          
          try {
            await adminClient
              .from('physical_orders')
              .update({ status: 'ordered' })
              .eq('stripe_session_id', sessionId);
          } catch {}

          try {
            await adminClient
              .from('orders')
              .update({ status: 'ordered' })
              .eq('stripe_session_id', sessionId);
          } catch {}
            
          console.log(`Updated order for session ${sessionId} to ordered`);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded': {
        const dataObj = event.data.object as any;
        const rawSub =
          event.type === 'invoice.payment_succeeded'
            ? dataObj.subscription ||
              dataObj.parent?.subscription_details?.subscription ||
              dataObj.lines?.data?.[0]?.parent?.subscription_item_details?.subscription
            : dataObj.id;
        const subscriptionId = typeof rawSub === 'string' ? rawSub : rawSub?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier =
            (priceId && priceIdUltimate && priceId === priceIdUltimate) ||
            subscription.metadata?.tier === 'ultimate'
              ? 'ultimate'
              : 'premium';
          const periodEndUnix = (subscription as any).current_period_end || (subscription as any).trial_end || (subscription.items?.data?.[0] as any)?.current_period_end || (Date.now()/1000 + 30*24*60*60);
          const periodEnd = new Date(periodEndUnix * 1000);

          const { data: matchedProfiles } = await adminClient
            .from('user_profiles')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId);

          const targetUserIds = Array.from(
            new Set([
              ...(matchedProfiles || []).map((p: any) => String(p.id)),
              ...(subscription.metadata?.user_id ? [String(subscription.metadata.user_id)] : []),
            ])
          ).filter(Boolean);

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await adminClient
              .from('user_profiles')
              .update({
                subscription_tier: tier,
                premium_until: periodEnd.toISOString(),
                is_premium: true,
              })
              .eq('stripe_subscription_id', subscriptionId);

            for (const uid of targetUserIds) {
              await syncUltimateMeta(uid, tier);
            }
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await adminClient
              .from('user_profiles')
              .update({
                subscription_tier: 'free',
                is_premium: false,
              })
              .eq('stripe_subscription_id', subscriptionId);

            for (const uid of targetUserIds) {
              await syncUltimateMeta(uid, 'free');
            }
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: matchedProfiles } = await adminClient
          .from('user_profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id);

        const targetUserIds = Array.from(
          new Set([
            ...(matchedProfiles || []).map((p: any) => String(p.id)),
            ...(subscription.metadata?.user_id ? [String(subscription.metadata.user_id)] : []),
          ])
        ).filter(Boolean);

        await adminClient
          .from('user_profiles')
          .update({
            subscription_tier: 'free',
            is_premium: false,
          })
          .eq('stripe_subscription_id', subscription.id);

        for (const uid of targetUserIds) {
          await syncUltimateMeta(uid, 'free');
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
