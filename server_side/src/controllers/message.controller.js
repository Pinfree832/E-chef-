const { query, queryOne } = require('../config/database');
const { emitToUser } = require('../websocket/socket.handler');

exports.getConversations = async (req, res) => {
  const conversations = await query(
    `SELECT c.*,
       CASE WHEN c.user1_id = ? THEN u2.first_name ELSE u1.first_name END AS other_first_name,
       CASE WHEN c.user1_id = ? THEN u2.last_name ELSE u1.last_name END AS other_last_name,
       CASE WHEN c.user1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END AS other_avatar,
       CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id,
       (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) AS unread_count
     FROM conversations c
     JOIN users u1 ON u1.id = c.user1_id JOIN users u2 ON u2.id = c.user2_id
     WHERE c.user1_id = ? OR c.user2_id = ?
     ORDER BY c.last_message_at DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
  );
  res.json({ success: true, data: conversations });
};

exports.getMessages = async (req, res) => {
  const { conversation_id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conv = await queryOne('SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)', [conversation_id, req.user.id, req.user.id]);
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

  const messages = await query(
    `SELECT m.*, u.first_name, u.last_name, u.avatar_url
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ? ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [conversation_id, parseInt(limit), parseInt(offset)]
  );

  await query('UPDATE messages SET is_read = 1, read_at = NOW() WHERE conversation_id = ? AND sender_id != ? AND is_read = 0', [conversation_id, req.user.id]);

  res.json({ success: true, data: messages.reverse() });
};

exports.sendMessage = async (req, res) => {
  const { recipient_id, content, message_type = 'text', booking_id } = req.body;

  let conv = await queryOne(
    'SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
    [req.user.id, recipient_id, recipient_id, req.user.id]
  );

  if (!conv) {
    const [result] = await query(
      'INSERT INTO conversations (booking_id, user1_id, user2_id, last_message_at) VALUES (?,?,?,NOW())',
      [booking_id || null, req.user.id, recipient_id]
    );
    conv = { id: result.insertId };
  } else {
    await query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [conv.id]);
  }

  const [msgResult] = await query(
    'INSERT INTO messages (conversation_id, sender_id, message_type, content) VALUES (?,?,?,?)',
    [conv.id, req.user.id, message_type, content]
  );

  const message = await queryOne('SELECT m.*, u.first_name, u.last_name, u.avatar_url FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?', [msgResult.insertId]);

  emitToUser(recipient_id, 'new_message', { conversation_id: conv.id, message });

  res.status(201).json({ success: true, data: { conversation_id: conv.id, message } });
};
