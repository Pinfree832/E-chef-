const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, queryOne, transaction } = require('../config/database');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
const logger = require('../utils/logger');

exports.register = async (req, res) => {
  const { first_name, last_name, email, phone, password, role = 'customer', referral_code } = req.body;

  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  await transaction(async (conn) => {
    const [userResult] = await conn.execute(
      `INSERT INTO users (role, first_name, last_name, email, phone, password_hash) VALUES (?,?,?,?,?,?)`,
      [role, first_name, last_name, email, phone || null, password_hash]
    );
    const userId = userResult.insertId;

    if (role === 'customer') {
      let referrerId = null;
      if (referral_code) {
        const referrer = await queryOne('SELECT user_id FROM customer_profiles WHERE referral_code = ?', [referral_code]);
        if (referrer) referrerId = referrer.user_id;
      }
      const newReferralCode = `${first_name.toUpperCase().slice(0,5)}${userId}`;
      await conn.execute(
        'INSERT INTO customer_profiles (user_id, referral_code, referred_by_id) VALUES (?,?,?)',
        [userId, newReferralCode, referrerId]
      );
      if (referrerId) {
        await conn.execute(
          'INSERT INTO referrals (referrer_id, referred_id) VALUES (?,?)',
          [referrerId, userId]
        );
      }
    } else if (role === 'chef') {
      await conn.execute('INSERT INTO chef_profiles (user_id) VALUES (?)', [userId]);
    }

    try { await sendWelcomeEmail(email, first_name); } catch {}
    return userId;
  });

  res.status(201).json({ success: true, message: 'Registration successful. Please verify your email.' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await queryOne(
    'SELECT id, role, first_name, last_name, email, password_hash, is_active, is_verified FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
  }

  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, ip_address, expires_at) VALUES (?,?,?,?)',
    [user.id, refreshToken, req.ip, expiresAt]
  );

  await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, role: user.role, first_name: user.first_name, last_name: user.last_name, email: user.email, is_verified: user.is_verified }
    }
  });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); }
  catch { return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' }); }

  const stored = await queryOne(
    'SELECT id, user_id FROM refresh_tokens WHERE token = ? AND revoked_at IS NULL AND expires_at > NOW()',
    [refreshToken]
  );
  if (!stored) return res.status(401).json({ success: false, message: 'Refresh token revoked or expired' });

  const user = await queryOne('SELECT id, role, email FROM users WHERE id = ?', [decoded.id]);
  const accessToken = signToken({ id: user.id, role: user.role, email: user.email });

  res.json({ success: true, data: { accessToken } });
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = ?', [refreshToken]);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await queryOne('SELECT id, first_name, email FROM users WHERE email = ? AND is_active = 1', [email]);

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await query('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)', [user.id, token, expiresAt]);
    try { await sendPasswordResetEmail(user.email, user.first_name, token); } catch {}
  }

  res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const reset = await queryOne(
    'SELECT id, user_id FROM password_resets WHERE token = ? AND expires_at > NOW() AND used_at IS NULL',
    [token]
  );
  if (!reset) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, reset.user_id]);
  await query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?', [reset.user_id]);

  res.json({ success: true, message: 'Password reset successfully' });
};

exports.getMe = async (req, res) => {
  const user = await queryOne(
    `SELECT u.id, u.uuid, u.role, u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
            u.is_verified, u.preferred_language, u.created_at
     FROM users u WHERE u.id = ?`,
    [req.user.id]
  );
  res.json({ success: true, data: user });
};
