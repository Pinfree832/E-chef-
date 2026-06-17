const { query, queryOne } = require('../config/database');
const { emitToUser } = require('../websocket/socket.handler');

exports.updateChefLocation = async (req, res) => {
  const { booking_id, latitude, longitude, accuracy, speed, heading } = req.body;

  const profile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) return res.status(404).json({ success: false, message: 'Chef profile not found' });

  await query('UPDATE chef_profiles SET current_latitude = ?, current_longitude = ? WHERE id = ?', [latitude, longitude, profile.id]);

  if (booking_id) {
    const booking = await queryOne(
      'SELECT b.customer_id FROM bookings b WHERE b.id = ? AND b.chef_id = ? AND b.status IN ("confirmed","chef_en_route","in_progress")',
      [booking_id, profile.id]
    );

    if (booking) {
      await query(
        'INSERT INTO gps_tracking (booking_id, chef_id, latitude, longitude, accuracy, speed, heading) VALUES (?,?,?,?,?,?,?)',
        [booking_id, profile.id, latitude, longitude, accuracy, speed, heading]
      );
      emitToUser(booking.customer_id, 'chef_location_update', { booking_id, latitude, longitude, accuracy, speed, heading, timestamp: new Date() });
    }
  }

  res.json({ success: true });
};

exports.getChefLocation = async (req, res) => {
  const { booking_id } = req.params;
  const booking = await queryOne(
    'SELECT b.chef_id, b.customer_id, b.status FROM bookings b WHERE b.id = ? AND b.customer_id = ?',
    [booking_id, req.user.id]
  );
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (!['confirmed','chef_en_route','in_progress'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: 'Tracking not available for this booking status' });
  }

  const chef = await queryOne('SELECT current_latitude, current_longitude FROM chef_profiles WHERE id = ?', [booking.chef_id]);
  const lastTrack = await queryOne(
    'SELECT * FROM gps_tracking WHERE booking_id = ? ORDER BY recorded_at DESC LIMIT 1',
    [booking_id]
  );

  res.json({ success: true, data: { current_location: chef, last_update: lastTrack } });
};

exports.getTrackingHistory = async (req, res) => {
  const { booking_id } = req.params;
  const booking = await queryOne(
    'SELECT b.chef_id, b.customer_id FROM bookings b WHERE b.id = ? AND (b.customer_id = ? OR b.chef_id IN (SELECT id FROM chef_profiles WHERE user_id = ?))',
    [booking_id, req.user.id, req.user.id]
  );
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const history = await query(
    'SELECT latitude, longitude, recorded_at FROM gps_tracking WHERE booking_id = ? ORDER BY recorded_at',
    [booking_id]
  );
  res.json({ success: true, data: history });
};
