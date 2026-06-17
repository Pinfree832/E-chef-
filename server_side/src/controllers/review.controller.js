const { query, queryOne } = require('../config/database');

exports.createReview = async (req, res) => {
  const { rating, comment, food_rating, service_rating, punctuality_rating } = req.body;
  const { booking_id } = req.params;

  const booking = await queryOne(
    'SELECT * FROM bookings WHERE id = ? AND customer_id = ? AND status = "completed"',
    [booking_id, req.user.id]
  );
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found or not completed' });

  const existingReview = await queryOne('SELECT id FROM reviews WHERE booking_id = ?', [booking_id]);
  if (existingReview) return res.status(409).json({ success: false, message: 'Review already submitted' });

  await query(
    'INSERT INTO reviews (booking_id, customer_id, chef_id, rating, comment, food_rating, service_rating, punctuality_rating) VALUES (?,?,?,?,?,?,?,?)',
    [booking_id, req.user.id, booking.chef_id, rating, comment, food_rating, service_rating, punctuality_rating]
  );

  const avg = await queryOne('SELECT AVG(rating) AS avg_rating FROM reviews WHERE chef_id = ? AND is_visible = 1', [booking.chef_id]);
  await query('UPDATE chef_profiles SET avg_rating = ? WHERE id = ?', [avg.avg_rating.toFixed(2), booking.chef_id]);

  res.status(201).json({ success: true, message: 'Review submitted. Thank you!' });
};

exports.getChefReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const reviews = await query(
    `SELECT r.*, CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') AS reviewer_name, u.avatar_url
     FROM reviews r JOIN users u ON u.id = r.customer_id
     WHERE r.chef_id = ? AND r.is_visible = 1 ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [req.params.chef_id, parseInt(limit), parseInt(offset)]
  );

  const stats = await queryOne(
    'SELECT AVG(rating) AS avg, AVG(food_rating) AS food_avg, AVG(service_rating) AS service_avg, AVG(punctuality_rating) AS punctuality_avg, COUNT(*) AS total FROM reviews WHERE chef_id = ? AND is_visible = 1',
    [req.params.chef_id]
  );

  res.json({ success: true, data: { reviews, stats } });
};

exports.replyToReview = async (req, res) => {
  const { reply } = req.body;
  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);
  const review = await queryOne('SELECT id FROM reviews WHERE id = ? AND chef_id = ?', [req.params.review_id, profile.id]);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  await query('UPDATE reviews SET chef_reply = ?, chef_replied_at = NOW() WHERE id = ?', [reply, review.id]);
  res.json({ success: true, message: 'Reply added' });
};
