const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  const user = await queryOne(
    `SELECT u.id, u.uuid, u.role, u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
            u.is_verified, u.preferred_language, u.created_at
     FROM users u WHERE u.id = ?`,
    [req.user.id]
  );

  let extra = {};
  if (user.role === 'customer') {
    extra = await queryOne('SELECT * FROM customer_profiles WHERE user_id = ?', [req.user.id]) || {};
  } else if (user.role === 'chef') {
    extra = await queryOne('SELECT * FROM chef_profiles WHERE user_id = ?', [req.user.id]) || {};
  }

  res.json({ success: true, data: { ...user, profile: extra } });
};

exports.updateProfile = async (req, res) => {
  const { first_name, last_name, phone, preferred_language, avatar_url } = req.body;
  await query('UPDATE users SET first_name=?, last_name=?, phone=?, preferred_language=?, avatar_url=? WHERE id=?',
    [first_name, last_name, phone, preferred_language, avatar_url, req.user.id]);
  res.json({ success: true, message: 'Profile updated' });
};

exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

  const hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ success: true, message: 'Password changed successfully' });
};

exports.getAddresses = async (req, res) => {
  const addresses = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.id]);
  res.json({ success: true, data: addresses });
};

exports.addAddress = async (req, res) => {
  const { label, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, is_default } = req.body;
  if (is_default) {
    await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  }
  const [result] = await query(
    'INSERT INTO addresses (user_id, label, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, is_default) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [req.user.id, label || 'Home', address_line1, address_line2, city, state, postal_code, country || 'Kenya', latitude, longitude, is_default || false]
  );
  const address = await queryOne('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, data: address });
};

exports.updateAddress = async (req, res) => {
  const address = await queryOne('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

  const { label, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, is_default } = req.body;
  if (is_default) {
    await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  }
  await query(
    'UPDATE addresses SET label=?,address_line1=?,address_line2=?,city=?,state=?,postal_code=?,country=?,latitude=?,longitude=?,is_default=? WHERE id=?',
    [label, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, is_default, req.params.id]
  );
  res.json({ success: true, message: 'Address updated' });
};

exports.deleteAddress = async (req, res) => {
  const result = await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Address not found' });
  res.json({ success: true, message: 'Address deleted' });
};

exports.getFavoriteChefs = async (req, res) => {
  const favorites = await query(
    `SELECT fc.id, fc.created_at, cp.id AS chef_profile_id, cp.avg_rating, cp.base_hourly_rate, cp.is_available,
            u.first_name, u.last_name, u.avatar_url
     FROM favorite_chefs fc JOIN chef_profiles cp ON cp.id = fc.chef_id JOIN users u ON u.id = cp.user_id
     WHERE fc.customer_id = ? ORDER BY fc.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: favorites });
};

exports.toggleFavoriteChef = async (req, res) => {
  const { chef_id } = req.params;
  const existing = await queryOne('SELECT id FROM favorite_chefs WHERE customer_id = ? AND chef_id = ?', [req.user.id, chef_id]);
  if (existing) {
    await query('DELETE FROM favorite_chefs WHERE id = ?', [existing.id]);
    return res.json({ success: true, message: 'Removed from favorites', is_favorite: false });
  }
  await query('INSERT INTO favorite_chefs (customer_id, chef_id) VALUES (?,?)', [req.user.id, chef_id]);
  res.json({ success: true, message: 'Added to favorites', is_favorite: true });
};

exports.getLoyaltyInfo = async (req, res) => {
  const profile = await queryOne('SELECT loyalty_points, subscription_plan FROM customer_profiles WHERE user_id = ?', [req.user.id]);
  const transactions = await query(
    'SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [req.user.id]
  );
  res.json({ success: true, data: { ...profile, transactions } });
};

exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const notifications = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user.id, parseInt(limit), parseInt(offset)]
  );
  await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0', [req.user.id]);
  res.json({ success: true, data: notifications });
};
