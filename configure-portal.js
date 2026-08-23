require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });

async function configurePortal() {
  try {
    const p1 = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_PREMIUM);
    const p2 = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_ULTIMATE);

    const configuration = await stripe.billingPortal.configurations.create({
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          products: [
            {
              product: p1.product,
              prices: [p1.id]
            },
            {
              product: p2.product,
              prices: [p2.id]
            }
          ]
        },
        subscription_cancel: { enabled: true },
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true }
      },
      business_profile: {
        headline: 'KIRATABI プラン管理',
      },
    });
    console.log("Configuration ID:", configuration.id);
  } catch(e) {
    console.error("Error creating portal config:", e.message);
  }
}
configurePortal();
