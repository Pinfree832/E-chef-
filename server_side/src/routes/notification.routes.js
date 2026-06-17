const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const notifications = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user.id, parseInt(limit), parseInt(offset)]
  );
  res.json({ success: true, data: notifications });
});

router.patch('/:id/read', async (req, res) => {
  await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.patch('/mark-all-read', async (req, res) => {
  await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
