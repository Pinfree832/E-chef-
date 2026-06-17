const { query, queryOne, transaction } = require('../config/database');
const mpesaService = require('../services/mpesa.service');
const stripeService = require('../services/stripe.service');
const paypalService = require('../services/paypal.service');
const { emitToUser } = require('../websocket/socket.handler');
const logger = require('../utils/logger');

exports.initiateMpesaPayment = async (req, res) => {
  const { booking_id, phone_number } = req.body;
  const booking = await queryOne('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [booking_id, req.user.id]);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const response = await mpesaService.initiateSTKPush({ phone: phone_number, amount: Math.ceil(booking.total_amount), bookingId: booking_id });

  await query(
    'INSERT INTO payments (booking_id, user_id, amount, currency, payment_method, gateway_reference) VALUES (?,?,?,?,?,?)',
    [booking_id, req.user.id, booking.total_amount, 'KES', 'mpesa', response.CheckoutRequestID]
  );

  res.json({ success: true, message: 'STK Push sent to your phone', data: { checkout_request_id: response.CheckoutRequestID } });
};

exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const callbackData = Body.stkCallback;
    const checkoutRequestId = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;

    const payment = await queryOne('SELECT * FROM payments WHERE gateway_reference = ?', [checkoutRequestId]);
    if (!payment) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    if (resultCode === 0) {
      const meta = callbackData.CallbackMetadata.Item;
      const receipt = meta.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      await query(
        'UPDATE payments SET payment_status = "completed", mpesa_receipt = ?, gateway_response = ?, paid_at = NOW() WHERE id = ?',
        [receipt, JSON.stringify(callbackData), payment.id]
      );
      await query('UPDATE bookings SET status = "confirmed" WHERE id = ? AND status = "pending"', [payment.booking_id]);

      const booking = await queryOne('SELECT customer_id FROM bookings WHERE id = ?', [payment.booking_id]);
      emitToUser(booking.customer_id, 'payment_confirmed', { booking_id: payment.booking_id, receipt });
    } else {
      await query('UPDATE payments SET payment_status = "failed", gateway_response = ? WHERE id = ?', [JSON.stringify(callbackData), payment.id]);
    }
  } catch (err) {
    logger.error('M-Pesa callback error:', err);
  }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

exports.createStripeIntent = async (req, res) => {
  const { booking_id } = req.body;
  const booking = await queryOne('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [booking_id, req.user.id]);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
    amount: Math.ceil(booking.total_amount),
    currency: booking.currency.toLowerCase(),
    metadata: { booking_id: booking_id.toString(), customer_id: req.user.id.toString() }
  });

  await query(
    'INSERT INTO payments (booking_id, user_id, amount, currency, payment_method, stripe_payment_id) VALUES (?,?,?,?,?,?)',
    [booking_id, req.user.id, booking.total_amount, booking.currency, 'stripe', paymentIntentId]
  );

  res.json({ success: true, data: { client_secret: clientSecret } });
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeService.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await query('UPDATE payments SET payment_status = "completed", paid_at = NOW() WHERE stripe_payment_id = ?', [pi.id]);
    await query(
      'UPDATE bookings SET status = "confirmed" WHERE id = (SELECT booking_id FROM payments WHERE stripe_payment_id = ?) AND status = "pending"',
      [pi.id]
    );
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await query('UPDATE payments SET payment_status = "failed" WHERE stripe_payment_id = ?', [pi.id]);
  }

  res.json({ received: true });
};

exports.createPaypalOrder = async (req, res) => {
  const { booking_id } = req.body;
  const booking = await queryOne('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [booking_id, req.user.id]);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const { orderId, approveUrl } = await paypalService.createOrder({ amount: booking.total_amount, currency: 'USD', bookingId: booking_id });

  await query(
    'INSERT INTO payments (booking_id, user_id, amount, currency, payment_method, paypal_order_id) VALUES (?,?,?,?,?,?)',
    [booking_id, req.user.id, booking.total_amount, 'USD', 'paypal', orderId]
  );

  res.json({ success: true, data: { order_id: orderId, approve_url: approveUrl } });
};

exports.capturePaypalOrder = async (req, res) => {
  const { order_id } = req.body;
  const captureData = await paypalService.captureOrder(order_id);

  if (captureData.status === 'COMPLETED') {
    await query('UPDATE payments SET payment_status = "completed", paid_at = NOW(), gateway_response = ? WHERE paypal_order_id = ?',
      [JSON.stringify(captureData), order_id]);
    await query(
      'UPDATE bookings SET status = "confirmed" WHERE id = (SELECT booking_id FROM payments WHERE paypal_order_id = ?) AND status = "pending"',
      [order_id]
    );
  }

  res.json({ success: true, data: { status: captureData.status } });
};

exports.getPaymentHistory = async (req, res) => {
  const payments = await query(
    `SELECT p.*, b.booking_date, b.total_amount AS booking_total
     FROM payments p JOIN bookings b ON b.id = p.booking_id
     WHERE p.user_id = ? ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: payments });
};

exports.requestRefund = async (req, res) => {
  const { payment_id, reason } = req.body;
  const payment = await queryOne('SELECT * FROM payments WHERE id = ? AND user_id = ? AND payment_status = "completed"', [payment_id, req.user.id]);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found or not eligible for refund' });

  if (payment.payment_method === 'stripe' && payment.stripe_payment_id) {
    await stripeService.refund(payment.stripe_payment_id, payment.amount);
  }

  await query('UPDATE payments SET payment_status = "refunded", refund_amount = ?, refunded_at = NOW(), refund_reason = ? WHERE id = ?',
    [payment.amount, reason, payment.id]);

  res.json({ success: true, message: 'Refund initiated successfully' });
};
