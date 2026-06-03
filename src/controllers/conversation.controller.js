const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get user's conversations
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email role phone')
    .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message / Create conversation
// @route   POST /api/conversations/send
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const senderName = req.user.name;
    const { recipientId, text } = req.body;

    if (!recipientId || !text) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient ID and message text are required'
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient user not found'
      });
    }

    // Find if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    // Create new conversation if none exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        lastMsg: text,
        messages: [],
        unread: true
      });
    }

    const newMessage = {
      senderId,
      senderName,
      text,
      time: new Date()
    };

    conversation.messages.push(newMessage);
    conversation.lastMsg = text;
    conversation.unread = true;
    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email role phone');

    // Broadcast message via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('message', {
        conversationId: conversation._id,
        senderId,
        senderName,
        text,
        time: 'Just now'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Message sent successfully',
      data: { conversation: populatedConversation }
    });
  } catch (error) {
    next(error);
  }
};
