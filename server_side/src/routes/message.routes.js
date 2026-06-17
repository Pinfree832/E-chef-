const router = require('express').Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/conversations',                        messageController.getConversations);
router.get('/conversations/:conversation_id',       messageController.getMessages);
router.post('/send',                                messageController.sendMessage);

module.exports = router;
