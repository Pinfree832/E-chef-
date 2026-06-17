const { query, queryOne, transaction } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  const [users, chefs, bookings, revenue] = await Promise.all([
    queryOne('SELECT COUNT(*) AS total, SUM(role="customer") AS customers, SUM(role="chef") AS chefs FROM users WHERE deleted_at IS NULL'),
    queryOne('SELECT COUNT(*) AS total, SUM(verification_status="pending") AS pending, SUM(verification_status="approved") AS approved FROM chef_profiles'),
    queryOne('SELECT COUNT(*) AS total, SUM(status="pending") AS pending, SUM(status="completed") AS completed, SUM(status="cancelled") AS cancelled FROM bookings'),
    queryOne('SELECT SUM(amount) AS total, SUM(CASE WHEN payment_status="completed" THEN amount ELSE 0 END) AS collected FROM payments')
  ]);

  const recentBookings = await query(
    `SELECT b.id, b.status, b.total_amount, b.booking_date, b.created_at,
            CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
            CONCAT(cu.first_name, ' ', cu.last_name) AS chef_name
     FROM bookings b JOIN users u ON u.id = b.customer_id JOIN chef_profiles cp ON cp.id = b.chef_id JOIN users cu ON cu.id = cp.user_id
     ORDER BY b.created_at DESC LIMIT 10`
  );

  const monthlyRevenue = await query(
    `SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month, SUM(amount) AS revenue, COUNT(*) AS transactions
     FROM payments WHERE payment_status = 'completed' AND paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month`
  );

  res.json({ success: true, data: { users, chefs, bookings, revenue, recentBookings, monthlyRevenue } });
};

exports.getAllUsers = async (req, res) => {
  const { role, search, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let sql = 'SELECT id, uuid, role, first_name, last_name, email, phone, is_active, is_verified, created_at FROM users WHERE deleted_at IS NULL';

  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (search) { sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; const s = `%${search}%`; params.push(s,s,s); }
  if (status === 'active') { sql += ' AND is_active = 1'; }
  else if (status === 'inactive') { sql += ' AND is_active = 0'; }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const users = await query(sql, params);
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL');
  res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
};

exports.updateUserStatus = async (req, res) => {
  const { is_active } = req.body;
  await query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
  res.json({ success: true, message: `User ${is_active ? 'activated' : 'deactivated'}` });
};

exports.getPendingChefs = async (req, res) => {
  const chefs = await query(
    `SELECT cp.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.created_at
     FROM chef_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.verification_status = 'pending' ORDER BY u.created_at`
  );
  res.json({ success: true, data: chefs });
};

exports.verifyChef = async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['approved','rejected','suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  await transaction(async (conn) => {
    await conn.execute(
      'UPDATE chef_profiles SET verification_status = ?, verified_at = ?, verified_by_id = ? WHERE id = ?',
      [status, status === 'approved' ? new Date() : null, req.user.id, req.params.id]
    );
    if (status === 'approved') {
      const [rows] = await conn.execute('SELECT user_id FROM chef_profiles WHERE id = ?', [req.params.id]);
      await conn.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [rows[0].user_id]);
    }
  });

  res.json({ success: true, message: `Chef ${status}` });
};

exports.getAllBookings = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let sql = `
    SELECT b.*, CONCAT(cu.first_name, ' ', cu.last_name) AS customer_name,
           CONCAT(chu.first_name, ' ', chu.last_name) AS chef_name
    FROM bookings b JOIN users cu ON cu.id = b.customer_id JOIN chef_profiles cp ON cp.id = b.chef_id JOIN users chu ON chu.id = cp.user_id
    WHERE 1=1`;

  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const bookings = await query(sql, params);
  res.json({ success: true, data: bookings });
};

exports.getDisputes = async (req, res) => {
  const disputes = await query(
    `SELECT d.*, b.booking_date, b.total_amount,
            CONCAT(r.first_name, ' ', r.last_name) AS raised_by_name,
            CONCAT(a.first_name, ' ', a.last_name) AS against_name
     FROM disputes d JOIN bookings b ON b.id = d.booking_id
     JOIN users r ON r.id = d.raised_by JOIN users a ON a.id = d.against
     ORDER BY d.created_at DESC`
  );
  res.json({ success: true, data: disputes });
};

exports.resolveDispute = async (req, res) => {
  const { resolution } = req.body;
  await query(
    'UPDATE disputes SET status = "resolved", resolution = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?',
    [resolution, req.user.id, req.params.id]
  );
  res.json({ success: true, message: 'Dispute resolved' });
};

exports.getCommissionSettings = async (req, res) => {
  const settings = await query('SELECT * FROM commission_settings ORDER BY created_at DESC');
  res.json({ success: true, data: settings });
};

exports.updateCommissionSettings = async (req, res) => {
  const { commission_rate, tax_rate, name } = req.body;
  await query('UPDATE commission_settings SET is_active = 0 WHERE is_active = 1');
  await query(
    'INSERT INTO commission_settings (name, commission_rate, tax_rate, effective_from, is_active, created_by) VALUES (?,?,?,NOW(),1,?)',
    [name || 'Updated Rate', commission_rate, tax_rate, req.user.id]
  );
  res.json({ success: true, message: 'Commission settings updated' });
};

exports.getRevenueReport = async (req, res) => {
  const { start_date, end_date } = req.query;
  const report = await query(
    `SELECT DATE(p.paid_at) AS date, SUM(p.amount) AS gross_revenue,
            SUM(b.platform_commission) AS commission_earned,
            COUNT(DISTINCT p.id) AS transactions,
            COUNT(DISTINCT b.chef_id) AS active_chefs
     FROM payments p JOIN bookings b ON b.id = p.booking_id
     WHERE p.payment_status = 'completed' AND p.paid_at BETWEEN ? AND ?
     GROUP BY DATE(p.paid_at) ORDER BY date`,
    [start_date || '2020-01-01', end_date || new Date().toISOString().split('T')[0]]
  );
  res.json({ success: true, data: report });
};

exports.processRefund = async (req, res) => {
  const { payment_id, amount, reason } = req.body;
  const payment = await queryOne('SELECT * FROM payments WHERE id = ? AND payment_status = "completed"', [payment_id]);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

  const refundAmount = amount || payment.amount;
  await query(
    'UPDATE payments SET payment_status = ?, refund_amount = ?, refunded_at = NOW(), refund_reason = ? WHERE id = ?',
    [refundAmount >= payment.amount ? 'refunded' : 'partially_refunded', refundAmount, reason, payment_id]
  );
  res.json({ success: true, message: 'Refund processed' });
};
