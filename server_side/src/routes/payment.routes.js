const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const express = require('express');

// Stripe webhook needs raw body
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
// M-Pesa callback (no auth, called by Safaricom)
router.post('/mpesa/callback', paymentController.mpesaCallback);
// PayPal IPN (no auth)
router.post('/paypal/capture', paymentController.capturePaypalOrder);

router.use(authenticate);

router.post('/mpesa',       authorize('customer'), paymentController.initiateMpesaPayment);
router.post('/stripe',      authorize('customer'), paymentController.createStripeIntent);
router.post('/paypal',      authorize('customer'), paymentController.createPaypalOrder);
router.get('/history',      paymentController.getPaymentHistory);
router.post('/refund',      authorize('customer'), paymentController.requestRefund);

module.exports = router;
