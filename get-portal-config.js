require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });

async function check() {
  const config = await stripe.billingPortal.configurations.retrieve('bpc_1U6ERZCiKlAgM2zmPsbN7CCh');
  console.log(JSON.stringify(config.features.subscription_update.products, null, 2));
}
check();
