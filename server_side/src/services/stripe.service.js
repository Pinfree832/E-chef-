const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentIntent({ amount, currency = 'kes', metadata = {} }) {
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true }
  });
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

async function refund(paymentIntentId, amount) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = pi.latest_charge;
  return stripe.refunds.create({
    charge: chargeId,
    amount: amount ? Math.round(amount * 100) : undefined
  });
}

function constructEvent(payload, sig, secret) {
  return stripe.webhooks.constructEvent(payload, sig, secret);
}

module.exports = { createPaymentIntent, refund, constructEvent };
