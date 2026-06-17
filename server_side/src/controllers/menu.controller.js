const { query, queryOne } = require('../config/database');

exports.getCategories = async (req, res) => {
  const categories = await query('SELECT * FROM cuisine_categories WHERE is_active = 1 ORDER BY sort_order');
  res.json({ success: true, data: categories });
};

exports.getMenuItems = async (req, res) => {
  const { category_id, search, dietary, min_price, max_price, featured, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];

  let sql = `SELECT mi.*, cc.name AS category_name, cc.slug AS category_slug
             FROM menu_items mi JOIN cuisine_categories cc ON cc.id = mi.category_id WHERE mi.is_active = 1`;

  if (category_id) { sql += ' AND mi.category_id = ?'; params.push(parseInt(category_id)); }
  if (featured) { sql += ' AND mi.is_featured = 1'; }
  if (min_price) { sql += ' AND mi.base_price >= ?'; params.push(parseFloat(min_price)); }
  if (max_price) { sql += ' AND mi.base_price <= ?'; params.push(parseFloat(max_price)); }
  if (search) { sql += ' AND (mi.name LIKE ? OR mi.description LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  if (dietary) { sql += ` AND JSON_CONTAINS(mi.dietary_tags, '"${dietary}"')`; }

  sql += ' ORDER BY mi.is_featured DESC, mi.name ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const items = await query(sql, params);
  res.json({ success: true, data: items });
};

exports.getMenuItemById = async (req, res) => {
  const item = await queryOne(
    `SELECT mi.*, cc.name AS category_name
     FROM menu_items mi JOIN cuisine_categories cc ON cc.id = mi.category_id
     WHERE mi.id = ? AND mi.is_active = 1`,
    [req.params.id]
  );
  if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

  const chefsWhoOffer = await query(
    `SELECT cp.id, cp.base_hourly_rate, cp.avg_rating, cmi.custom_price, u.first_name, u.last_name, u.avatar_url
     FROM chef_menu_items cmi JOIN chef_profiles cp ON cp.id = cmi.chef_id JOIN users u ON u.id = cp.user_id
     WHERE cmi.menu_item_id = ? AND cmi.is_available = 1 AND cp.verification_status = 'approved'`,
    [req.params.id]
  );

  res.json({ success: true, data: { ...item, chefs: chefsWhoOffer } });
};

exports.createMenuItem = async (req, res) => {
  const { category_id, name, slug, description, base_price, prep_time_mins, serves, dietary_tags, ingredients, calories, is_featured } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

  const [result] = await query(
    `INSERT INTO menu_items (category_id, name, slug, description, image_url, base_price, prep_time_mins, serves, dietary_tags, ingredients, calories, is_featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [category_id, name, slug, description, image_url, base_price, prep_time_mins, serves, JSON.stringify(dietary_tags || []), JSON.stringify(ingredients || []), calories, is_featured || false]
  );
  const item = await queryOne('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, data: item });
};

exports.updateMenuItem = async (req, res) => {
  const { category_id, name, description, base_price, prep_time_mins, serves, dietary_tags, calories, is_active, is_featured } = req.body;
  await query(
    'UPDATE menu_items SET category_id=?,name=?,description=?,base_price=?,prep_time_mins=?,serves=?,dietary_tags=?,calories=?,is_active=?,is_featured=? WHERE id=?',
    [category_id, name, description, base_price, prep_time_mins, serves, JSON.stringify(dietary_tags || []), calories, is_active, is_featured, req.params.id]
  );
  res.json({ success: true, message: 'Menu item updated' });
};

exports.deleteMenuItem = async (req, res) => {
  await query('UPDATE menu_items SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Menu item deactivated' });
};

exports.getAIRecommendations = async (req, res) => {
  const profile = await queryOne('SELECT dietary_prefs FROM customer_profiles WHERE user_id = ?', [req.user.id]);
  const prefs = profile?.dietary_prefs || [];

  let sql = 'SELECT mi.*, cc.name AS category_name FROM menu_items mi JOIN cuisine_categories cc ON cc.id = mi.category_id WHERE mi.is_active = 1';
  const params = [];

  if (prefs.length > 0) {
    const prefFilters = prefs.map(p => `JSON_CONTAINS(mi.dietary_tags, '"${p}"')`).join(' OR ');
    sql += ` AND (${prefFilters})`;
  }

  const bookingHistory = await query(
    'SELECT bi.menu_item_id, COUNT(*) AS order_count FROM booking_items bi JOIN bookings b ON b.id = bi.booking_id WHERE b.customer_id = ? GROUP BY bi.menu_item_id ORDER BY order_count DESC LIMIT 5',
    [req.user.id]
  );

  sql += ' ORDER BY mi.is_featured DESC LIMIT 8';
  const recommendations = await query(sql, params);

  res.json({ success: true, data: recommendations, based_on: { dietary_prefs: prefs, past_orders: bookingHistory.map(b => b.menu_item_id) } });
};
