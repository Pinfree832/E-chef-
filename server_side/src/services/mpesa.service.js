const axios = require('axios');
const logger = require('../utils/logger');

const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE       = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY         = process.env.MPESA_PASSKEY;
const ENV             = process.env.MPESA_ENVIRONMENT || 'sandbox';
const BASE_URL        = ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL;

async function getAccessToken() {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  return res.data.access_token;
}

function getTimestamp() {
  return new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
}

async function initiateSTKPush({ phone, amount, bookingId }) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

  const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '254');

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: cleanPhone,
      PartyB: SHORTCODE,
      PhoneNumber: cleanPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: `BOOKING-${bookingId}`,
      TransactionDesc: `Mobility Chef Booking #${bookingId}`
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

async function querySTKStatus(checkoutRequestId) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    { BusinessShortCode: SHORTCODE, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

module.exports = { initiateSTKPush, querySTKStatus };
