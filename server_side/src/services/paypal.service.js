const axios = require('axios');

const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const MODE          = process.env.PAYPAL_MODE || 'sandbox';
const BASE_URL      = MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(`${BASE_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data.access_token;
}

async function createOrder({ amount, currency = 'USD', bookingId }) {
  const token = await getAccessToken();
  const res = await axios.post(
    `${BASE_URL}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `booking-${bookingId}`,
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description: `Mobility Chef Booking #${bookingId}`
      }],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
      }
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  const approveUrl = res.data.links.find(l => l.rel === 'approve')?.href;
  return { orderId: res.data.id, approveUrl };
}

async function captureOrder(orderId) {
  const token = await getAccessToken();
  const res = await axios.post(
    `${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {},
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

module.exports = { createOrder, captureOrder };
