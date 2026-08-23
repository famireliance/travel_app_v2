import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-07-29.dahlia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  if (!webhookSecret || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
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

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const userId = session.client_reference_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          
          if (userId) {
            // Check subscription to get the tier from metadata
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
            const priceId = subscription.items?.data?.[0]?.price?.id;
            let tier = 'premium';
            if (priceId === process.env.STRIPE_PRICE_ID_ULTIMATE) {
              tier = 'ultimate';
            }

            const periodEndUnix = (subscription as any).current_period_end || (subscription as any).trial_end || (subscription.items?.data?.[0] as any)?.current_period_end || (Date.now()/1000 + 30*24*60*60);
            const periodEnd = new Date(periodEndUnix * 1000);
            
            // Build update payload
            const updatePayload: Record<string, unknown> = {
              subscription_tier: tier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              premium_until: periodEnd.toISOString()
            };

            await adminClient
              .from('user_profiles')
              .update(updatePayload)
              .eq('id', userId);
            console.log(`Updated user ${userId} to ${tier}`);
          }
        } else if (session.mode === 'payment') {
          // Physical order payment completed
          const sessionId = session.id;
          
          await adminClient
            .from('physical_orders')
            .update({ status: 'ordered' })
            .eq('stripe_session_id', sessionId);
            
          console.log(`Updated physical order for session ${sessionId} to ordered`);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded': {
        const dataObj = event.data.object as any;
        const subscriptionId = event.type === 'invoice.payment_succeeded' ? dataObj.subscription : dataObj.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
          const priceId = subscription.items?.data?.[0]?.price?.id;
          let tier = 'premium';
          if (priceId === process.env.STRIPE_PRICE_ID_ULTIMATE) {
            tier = 'ultimate';
          }
          const periodEndUnix = (subscription as any).current_period_end || (subscription as any).trial_end || (subscription.items?.data?.[0] as any)?.current_period_end || (Date.now()/1000 + 30*24*60*60);
          const periodEnd = new Date(periodEndUnix * 1000);

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await adminClient
              .from('user_profiles')
              .update({
                subscription_tier: tier,
                premium_until: periodEnd.toISOString()
              })
              .eq('stripe_subscription_id', subscriptionId);
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
             await adminClient
              .from('user_profiles')
              .update({
                subscription_tier: 'free',
                // Keep premium_until as is, or set to now
              })
              .eq('stripe_subscription_id', subscriptionId);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await adminClient
          .from('user_profiles')
          .update({
            subscription_tier: 'free'
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
