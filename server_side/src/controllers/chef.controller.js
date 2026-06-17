const { query, queryOne, transaction } = require('../config/database');

exports.getChefs = async (req, res) => {
  const { cuisine, min_rating, max_rate, lat, lng, radius = 25, search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];

  let sql = `
    SELECT cp.id, cp.bio, cp.specialties, cp.years_of_experience, cp.base_hourly_rate,
           cp.travel_rate_per_km, cp.equipment_fee, cp.avg_rating, cp.total_bookings,
           cp.is_available, cp.service_radius_km, cp.verification_status,
           u.first_name, u.last_name, u.avatar_url, u.email
    FROM chef_profiles cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.verification_status = 'approved' AND u.is_active = 1`;

  if (min_rating) { sql += ' AND cp.avg_rating >= ?'; params.push(parseFloat(min_rating)); }
  if (max_rate) { sql += ' AND cp.base_hourly_rate <= ?'; params.push(parseFloat(max_rate)); }
  if (search) { sql += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR cp.bio LIKE ?)'; const s = `%${search}%`; params.push(s,s,s); }

  sql += ' ORDER BY cp.avg_rating DESC, cp.total_bookings DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const chefs = await query(sql, params);
  res.json({ success: true, data: chefs, pagination: { page: parseInt(page), limit: parseInt(limit) } });
};

exports.getChefById = async (req, res) => {
  const chef = await queryOne(
    `SELECT cp.*, u.first_name, u.last_name, u.avatar_url, u.email, u.phone, u.created_at AS member_since
     FROM chef_profiles cp JOIN users u ON u.id = cp.user_id
     WHERE cp.id = ? AND cp.verification_status = 'approved'`,
    [req.params.id]
  );
  if (!chef) return res.status(404).json({ success: false, message: 'Chef not found' });

  const portfolio = await query('SELECT * FROM chef_portfolio WHERE chef_id = ? ORDER BY sort_order', [chef.id]);
  const reviews = await query(
    `SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name, u.avatar_url
     FROM reviews r JOIN users u ON u.id = r.customer_id WHERE r.chef_id = ? AND r.is_visible = 1 ORDER BY r.created_at DESC LIMIT 10`,
    [chef.id]
  );
  const menuItems = await query(
    `SELECT mi.*, cmi.custom_price, cc.name AS category_name
     FROM chef_menu_items cmi JOIN menu_items mi ON mi.id = cmi.menu_item_id JOIN cuisine_categories cc ON cc.id = mi.category_id
     WHERE cmi.chef_id = ? AND cmi.is_available = 1 AND mi.is_active = 1`,
    [chef.id]
  );

  res.json({ success: true, data: { ...chef, portfolio, reviews, menuItems } });
};

exports.updateChefProfile = async (req, res) => {
  const { bio, specialties, years_of_experience, base_hourly_rate, travel_rate_per_km, equipment_fee, service_radius_km, is_available, bank_account_name, bank_name, bank_account_number, mpesa_number } = req.body;

  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) return res.status(404).json({ success: false, message: 'Chef profile not found' });

  await query(
    `UPDATE chef_profiles SET bio=?, specialties=?, years_of_experience=?, base_hourly_rate=?,
     travel_rate_per_km=?, equipment_fee=?, service_radius_km=?, is_available=?,
     bank_account_name=?, bank_name=?, bank_account_number=?, mpesa_number=?
     WHERE user_id=?`,
    [bio, JSON.stringify(specialties), years_of_experience, base_hourly_rate, travel_rate_per_km,
     equipment_fee, service_radius_km, is_available, bank_account_name, bank_name, bank_account_number, mpesa_number, req.user.id]
  );

  res.json({ success: true, message: 'Profile updated successfully' });
};

exports.setAvailability = async (req, res) => {
  const { slots } = req.body;
  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) return res.status(404).json({ success: false, message: 'Chef profile not found' });

  await transaction(async (conn) => {
    await conn.execute('DELETE FROM chef_availability WHERE chef_id = ?', [profile.id]);
    for (const slot of slots) {
      await conn.execute(
        'INSERT INTO chef_availability (chef_id, day_of_week, date, start_time, end_time, is_blocked) VALUES (?,?,?,?,?,?)',
        [profile.id, slot.day_of_week || null, slot.date || null, slot.start_time, slot.end_time, slot.is_blocked || false]
      );
    }
  });

  res.json({ success: true, message: 'Availability updated' });
};

exports.getAvailability = async (req, res) => {
  const profile = await queryOne('SELECT id FROM chef_profiles WHERE id = ?', [req.params.id]);
  if (!profile) return res.status(404).json({ success: false, message: 'Chef not found' });

  const availability = await query('SELECT * FROM chef_availability WHERE chef_id = ? ORDER BY day_of_week, date', [req.params.id]);
  res.json({ success: true, data: availability });
};

exports.addPortfolio = async (req, res) => {
  const { caption } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;
  if (!image_url) return res.status(400).json({ success: false, message: 'Image is required' });

  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);
  await query('INSERT INTO chef_portfolio (chef_id, image_url, caption) VALUES (?,?,?)', [profile.id, image_url, caption]);

  res.status(201).json({ success: true, message: 'Portfolio item added' });
};

exports.getEarnings = async (req, res) => {
  const { period = 'month' } = req.query;
  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);

  const dateFilter = period === 'week' ? 'DATE_SUB(NOW(), INTERVAL 7 DAY)' : period === 'year' ? 'DATE_SUB(NOW(), INTERVAL 1 YEAR)' : 'DATE_SUB(NOW(), INTERVAL 1 MONTH)';

  const earnings = await query(
    `SELECT ce.*, b.booking_date, b.total_amount, CONCAT(u.first_name, ' ', u.last_name) AS customer_name
     FROM chef_earnings ce JOIN bookings b ON b.id = ce.booking_id JOIN users u ON u.id = b.customer_id
     WHERE ce.chef_id = ? AND ce.created_at >= ${dateFilter} ORDER BY ce.created_at DESC`,
    [profile.id]
  );

  const summary = await queryOne(
    `SELECT SUM(net_amount) AS total_earned, SUM(commission) AS total_commission,
            COUNT(*) AS total_bookings, AVG(net_amount) AS avg_per_booking
     FROM chef_earnings WHERE chef_id = ? AND created_at >= ${dateFilter}`,
    [profile.id]
  );

  res.json({ success: true, data: { earnings, summary } });
};

exports.updateMenuItems = async (req, res) => {
  const { items } = req.body;
  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);

  await transaction(async (conn) => {
    for (const item of items) {
      if (item.remove) {
        await conn.execute('DELETE FROM chef_menu_items WHERE chef_id = ? AND menu_item_id = ?', [profile.id, item.menu_item_id]);
      } else {
        await conn.execute(
          'INSERT INTO chef_menu_items (chef_id, menu_item_id, custom_price, is_available) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE custom_price=?, is_available=?',
          [profile.id, item.menu_item_id, item.custom_price || null, item.is_available !== false, item.custom_price || null, item.is_available !== false]
        );
      }
    }
  });

  res.json({ success: true, message: 'Menu updated' });
};

exports.updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  await query('UPDATE chef_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?', [latitude, longitude, req.user.id]);
  res.json({ success: true });
};
