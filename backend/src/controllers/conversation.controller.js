const { Conversation, Message } = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get user's conversations
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations the user is participating in
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email role phone')
    .sort({ updatedAt: -1 });

    // For each conversation, fetch its messages and format it for the frontend
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Fetch messages for this conversation
        const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 });
        
        // Convert Mongoose document to plain object
        const convObj = conv.toObject();
        
        // Map fields to match the old schema structure for frontend backward compatibility
        convObj.messages = messages;
        convObj.lastMsg = conv.lastMessage?.text || '';
        
        // Calculate unread boolean based on unreadCounts map
        const userUnreadCount = conv.unreadCounts ? (conv.unreadCounts.get(userId.toString()) || 0) : 0;
        convObj.unread = userUnreadCount > 0;

        return convObj;
      })
    );

    res.status(200).json({
      status: 'success',
      results: formattedConversations.length,
      data: { conversations: formattedConversations }
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
      conversation = new Conversation({
        participants: [senderId, recipientId],
        productId: null,
        lastMessage: {
          text: '',
          senderId: senderId,
          timestamp: new Date()
        },
        unreadCounts: new Map()
      });
    }

    // Save/update lastMessage metadata
    conversation.lastMessage = {
      text,
      senderId,
      timestamp: new Date()
    };

    // Increment unread count for recipient (participants who are not the sender)
    conversation.participants.forEach(participantId => {
      const pStr = participantId.toString();
      if (pStr !== senderId.toString()) {
        const currentCount = conversation.unreadCounts.get(pStr) || 0;
        conversation.unreadCounts.set(pStr, currentCount + 1);
      }
    });

    await conversation.save();

    // Create and save new message document
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      text,
      isRead: false
    });

    // Fetch all messages for the conversation to return
    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email role phone');

    // Format the conversation object to match what the frontend expects
    const convObj = populatedConversation.toObject();
    convObj.messages = messages;
    convObj.lastMsg = text;
    
    // For the recipient/sender unread calculation
    const userUnreadCount = populatedConversation.unreadCounts ? (populatedConversation.unreadCounts.get(senderId.toString()) || 0) : 0;
    convObj.unread = userUnreadCount > 0;

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
      data: { conversation: convObj }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation as read
// @route   PATCH /api/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    if (conversation.unreadCounts) {
      conversation.unreadCounts.set(userId.toString(), 0);
      await conversation.save();
    }

    await Message.updateMany(
      { conversationId: id, senderId: { $ne: userId } },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      status: 'success',
      message: 'Conversation marked as read'
    });
  } catch (error) {
    next(error);
  }
};

