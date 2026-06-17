const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendEmail({ to, subject, html, text }) {
  await transporter.sendMail({
    from: `"Mobility Chef" <${process.env.EMAIL_FROM || 'noreply@mobilitychef.com'}>`,
    to, subject, html, text
  });
}

async function sendWelcomeEmail(email, firstName) {
  await sendEmail({
    to: email,
    subject: 'Welcome to Mobility Chef!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#e67e22">Welcome, ${firstName}!</h1>
        <p>Thank you for joining <strong>Mobility Chef</strong> – your personal chef, delivered to you.</p>
        <p>Start exploring our professional chefs and book your first meal today!</p>
        <a href="${process.env.CLIENT_URL}" style="background:#e67e22;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0">Browse Chefs</a>
        <p style="color:#999;font-size:12px">© 2024 Mobility Chef. All rights reserved.</p>
      </div>`
  });
}

async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset Your Password – Mobility Chef',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName}, we received a request to reset your password.</p>
        <a href="${resetUrl}" style="background:#e67e22;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0">Reset Password</a>
        <p>This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
      </div>`
  });
}

async function sendBookingConfirmationEmail(email, firstName, booking) {
  await sendEmail({
    to: email,
    subject: `Booking Confirmed – #${booking.id}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#27ae60">Booking Confirmed!</h2>
        <p>Hi ${firstName}, your booking has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td><strong>Booking ID:</strong></td><td>#${booking.id}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${booking.booking_date}</td></tr>
          <tr><td><strong>Time:</strong></td><td>${booking.start_time}</td></tr>
          <tr><td><strong>Total:</strong></td><td>KES ${booking.total_amount}</td></tr>
        </table>
        <p>Your chef will be in touch. Track your booking in the app.</p>
      </div>`
  });
}

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendBookingConfirmationEmail };
