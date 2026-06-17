const { query, queryOne, transaction } = require('../config/database');
const { calculateBookingCost } = require('../utils/payment.calculator');
const { emitToUser } = require('../websocket/socket.handler');
const { sendBookingNotification } = require('../services/notification.service');

exports.createBooking = async (req, res) => {
  const { chef_id, address_id, booking_date, start_time, guests_count, booking_type, special_instructions, items, loyalty_points_to_use = 0 } = req.body;
  const customer_id = req.user.id;

  const chef = await queryOne(
    'SELECT cp.*, u.first_name, u.last_name FROM chef_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.id = ? AND cp.verification_status = "approved" AND cp.is_available = 1',
    [chef_id]
  );
  if (!chef) return res.status(404).json({ success: false, message: 'Chef not found or unavailable' });

  const address = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [address_id, customer_id]);
  if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

  const menuItems = await Promise.all(items.map(item =>
    queryOne('SELECT mi.*, cmi.custom_price FROM menu_items mi LEFT JOIN chef_menu_items cmi ON cmi.menu_item_id = mi.id AND cmi.chef_id = ? WHERE mi.id = ? AND mi.is_active = 1', [chef_id, item.menu_item_id])
  ));
  if (menuItems.some(m => !m)) return res.status(400).json({ success: false, message: 'One or more menu items not found' });

  const enrichedItems = items.map((item, i) => ({
    ...item,
    menu_item: menuItems[i],
    unit_price: menuItems[i].custom_price || menuItems[i].base_price
  }));

  const customerProfile = await queryOne('SELECT loyalty_points FROM customer_profiles WHERE user_id = ?', [customer_id]);
  const availablePoints = customerProfile?.loyalty_points || 0;
  const pointsToUse = Math.min(loyalty_points_to_use, availablePoints);

  const distance = 5; // Would use Google Maps API in production
  const costs = calculateBookingCost({
    items: enrichedItems,
    chef,
    distance,
    booking_type,
    loyalty_points_used: pointsToUse
  });

  const bookingId = await transaction(async (conn) => {
    const [bookingRes] = await conn.execute(
      `INSERT INTO bookings (customer_id, chef_id, address_id, booking_date, start_time, guests_count,
        booking_type, special_instructions, food_cost, chef_fee, transport_fee, equipment_fee,
        extra_service_fee, platform_commission, tax, total_amount, loyalty_points_used)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [customer_id, chef_id, address_id, booking_date, start_time, guests_count, booking_type,
       special_instructions, costs.food_cost, costs.chef_fee, costs.transport_fee, costs.equipment_fee,
       costs.extra_service_fee, costs.platform_commission, costs.tax, costs.total, pointsToUse]
    );
    const newBookingId = bookingRes.insertId;

    for (const item of enrichedItems) {
      await conn.execute(
        'INSERT INTO booking_items (booking_id, menu_item_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)',
        [newBookingId, item.menu_item_id, item.quantity, item.unit_price, item.unit_price * item.quantity]
      );
    }

    if (pointsToUse > 0) {
      await conn.execute(
        'UPDATE customer_profiles SET loyalty_points = loyalty_points - ? WHERE user_id = ?',
        [pointsToUse, customer_id]
      );
    }

    return newBookingId;
  });

  const booking = await queryOne('SELECT * FROM bookings WHERE id = ?', [bookingId]);

  await sendBookingNotification(chef.user_id, 'new_booking', booking);
  emitToUser(chef.user_id, 'new_booking', booking);

  res.status(201).json({ success: true, message: 'Booking created', data: { booking, costs } });
};

exports.getMyBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const isChef = req.user.role === 'chef';

  let sql = `
    SELECT b.*,
      CONCAT(cu.first_name, ' ', cu.last_name) AS customer_name, cu.phone AS customer_phone,
      CONCAT(chu.first_name, ' ', chu.last_name) AS chef_name, chu.phone AS chef_phone,
      cp.avg_rating AS chef_avg_rating,
      a.address_line1, a.city, a.latitude, a.longitude
    FROM bookings b
    JOIN users cu ON cu.id = b.customer_id
    JOIN chef_profiles cp ON cp.id = b.chef_id
    JOIN users chu ON chu.id = cp.user_id
    JOIN addresses a ON a.id = b.address_id
    WHERE `;

  const params = [];
  if (isChef) {
    const chefProfile = await queryOne('SELECT id FROM chef_profiles WHERE user_id = ?', [req.user.id]);
    sql += 'b.chef_id = ?';
    params.push(chefProfile?.id);
  } else {
    sql += 'b.customer_id = ?';
    params.push(req.user.id);
  }

  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const bookings = await query(sql, params);
  res.json({ success: true, data: bookings, pagination: { page: parseInt(page), limit: parseInt(limit) } });
};

exports.getBookingById = async (req, res) => {
  const booking = await queryOne(
    `SELECT b.*,
       CONCAT(cu.first_name, ' ', cu.last_name) AS customer_name, cu.phone AS customer_phone, cu.avatar_url AS customer_avatar,
       CONCAT(chu.first_name, ' ', chu.last_name) AS chef_name, chu.phone AS chef_phone, chu.avatar_url AS chef_avatar,
       cp.avg_rating, cp.base_hourly_rate, cp.mpesa_number,
       a.address_line1, a.address_line2, a.city, a.latitude, a.longitude
     FROM bookings b
     JOIN users cu ON cu.id = b.customer_id
     JOIN chef_profiles cp ON cp.id = b.chef_id
     JOIN users chu ON chu.id = cp.user_id
     JOIN addresses a ON a.id = b.address_id
     WHERE b.id = ? AND (b.customer_id = ? OR cp.user_id = ?)`,
    [req.params.id, req.user.id, req.user.id]
  );

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const items = await query(
    'SELECT bi.*, mi.name, mi.image_url FROM booking_items bi JOIN menu_items mi ON mi.id = bi.menu_item_id WHERE bi.booking_id = ?',
    [booking.id]
  );

  res.json({ success: true, data: { ...booking, items } });
};

exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const booking = await queryOne('SELECT b.*, cp.user_id AS chef_user_id FROM bookings b JOIN chef_profiles cp ON cp.id = b.chef_id WHERE b.id = ?', [req.params.id]);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const isChef = req.user.role === 'chef' && booking.chef_user_id === req.user.id;
  const isCustomer = req.user.role === 'customer' && booking.customer_id === req.user.id;

  const allowedTransitions = {
    chef: { pending: ['confirmed'], confirmed: ['chef_en_route'], chef_en_route: ['in_progress'], in_progress: ['completed'] },
    customer: { pending: ['cancelled'], confirmed: ['cancelled'], completed: ['completed'] }
  };

  const role = isChef ? 'chef' : isCustomer ? 'customer' : null;
  if (!role || !allowedTransitions[role][booking.status]?.includes(status)) {
    return res.status(403).json({ success: false, message: 'Invalid status transition' });
  }

  const timestampField = {
    confirmed: 'chef_accepted_at', chef_en_route: 'chef_departed_at',
    in_progress: 'chef_arrived_at', completed: status === 'completed' && isChef ? 'service_completed_at' : 'customer_confirmed_at',
    cancelled: 'cancelled_at'
  }[status];

  await query(`UPDATE bookings SET status = ?, ${timestampField} = NOW() WHERE id = ?`, [status, booking.id]);

  if (status === 'completed' && isCustomer) {
    const pointsEarned = Math.floor(booking.total_amount / 100) * (parseInt(process.env.LOYALTY_POINTS_PER_100) || 10);
    await query('UPDATE customer_profiles SET loyalty_points = loyalty_points + ? WHERE user_id = ?', [pointsEarned, booking.customer_id]);
    await query('UPDATE bookings SET loyalty_points_earned = ? WHERE id = ?', [pointsEarned, booking.id]);
    await query('UPDATE chef_profiles SET total_bookings = total_bookings + 1 WHERE id = ?', [booking.chef_id]);
  }

  const notifyUserId = isChef ? booking.customer_id : booking.chef_user_id;
  emitToUser(notifyUserId, 'booking_status_update', { booking_id: booking.id, status });

  res.json({ success: true, message: 'Booking status updated', data: { status } });
};

exports.cancelBooking = async (req, res) => {
  const { reason } = req.body;
  const booking = await queryOne('SELECT * FROM bookings WHERE id = ? AND (customer_id = ? OR chef_id IN (SELECT id FROM chef_profiles WHERE user_id = ?))', [req.params.id, req.user.id, req.user.id]);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (!['pending','confirmed'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: 'Booking cannot be cancelled at this stage' });
  }

  await query('UPDATE bookings SET status = "cancelled", cancelled_at = NOW(), cancelled_by = ?, cancellation_reason = ? WHERE id = ?',
    [req.user.id, reason || null, booking.id]);

  res.json({ success: true, message: 'Booking cancelled' });
};
