const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all routes
router.use(protect);

router.post('/send', conversationController.sendMessage);
router.get('/', conversationController.getConversations);
router.patch('/:id/read', conversationController.markAsRead);

module.exports = router;
