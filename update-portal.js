require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-07-29.dahlia' });

async function update() {
  try {
    const p1 = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_PREMIUM);
    const p2 = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_ULTIMATE);

    const config = await stripe.billingPortal.configurations.update('bpc_1U6ERZCiKlAgM2zmPsbN7CCh', {
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          products: [
            {
              product: p1.product,
              prices: [p1.id, p2.id] // Wait! If a user is on p1 product, they need to see p2 price! But p2 price belongs to p2 product!
            },
            {
              product: p2.product,
              prices: [p1.id, p2.id] // Wait! Stripe allows you to switch to different products?
            }
          ]
        }
      }
    });
    console.log("Success");
  } catch(e) {
    console.log("ERROR", e.message);
  }
}
update();
