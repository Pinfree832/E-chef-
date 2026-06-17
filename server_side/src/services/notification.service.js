const { query } = require('../config/database');
const logger = require('../utils/logger');

async function createNotification({ user_id, type, title, body, data = null, channel = 'in_app' }) {
  await query(
    'INSERT INTO notifications (user_id, type, title, body, data, channel) VALUES (?,?,?,?,?,?)',
    [user_id, type, title, body, data ? JSON.stringify(data) : null, channel]
  );
}

async function sendBookingNotification(userId, event, booking) {
  const templates = {
    new_booking: { title: 'New Booking Request', body: `You have a new booking for ${booking.booking_date}` },
    booking_confirmed: { title: 'Booking Confirmed!', body: `Your booking #${booking.id} has been confirmed` },
    chef_en_route: { title: 'Chef En Route', body: 'Your chef is on the way to your location' },
    booking_completed: { title: 'Service Completed', body: 'Please rate your experience with the chef' },
    payment_received: { title: 'Payment Received', body: `Payment of KES ${booking.total_amount} received` }
  };

  const tmpl = templates[event];
  if (tmpl) {
    await createNotification({ user_id: userId, type: event, title: tmpl.title, body: tmpl.body, data: { booking_id: booking.id }, channel: 'in_app,push' });
  }
}

module.exports = { createNotification, sendBookingNotification };
