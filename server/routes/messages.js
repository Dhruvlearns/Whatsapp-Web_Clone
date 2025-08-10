const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Get all conversations (grouped by wa_id)
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.getConversations();

    // Get user details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findOne({ wa_id: conv._id });
        return {
          wa_id: conv._id,
          user: user || { 
            wa_id: conv._id, 
            name: `User ${conv._id.slice(-4)}`, 
            profile_name: `User ${conv._id.slice(-4)}`,
            profile_picture: null,
            is_online: false
          },
          lastMessage: conv.lastMessage,
          messageCount: conv.messageCount,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json(conversationsWithUsers);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific user
router.get('/chat/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.getChatMessages(wa_id, limit, skip);
    const user = await User.findByWaId(wa_id);

    // Mark messages as read (simulate reading)
    await Message.updateMany(
      { wa_id: wa_id, is_from_me: false, status: { $ne: 'read' } },
      { status: 'read' }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      user: user || { 
        wa_id, 
        name: `User ${wa_id.slice(-4)}`, 
        profile_name: `User ${wa_id.slice(-4)}`,
        profile_picture: null,
        is_online: false
      },
      hasMore: messages.length === limit,
      totalMessages: await Message.countDocuments({ wa_id })
    });
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const { wa_id, content, message_type = 'text' } = req.body;

    if (!wa_id || !content) {
      return res.status(400).json({ error: 'wa_id and content are required' });
    }

    // Ensure user exists
    let user = await User.findByWaId(wa_id);
    if (!user) {
      user = new User({
        wa_id,
        name: `User ${wa_id.slice(-4)}`,
        profile_name: `User ${wa_id.slice(-4)}`
      });
      await user.save();
    }

    const message = new Message({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wa_id,
      message_type,
      content,
      timestamp: new Date(),
      status: 'sent',
      is_from_me: true
    });

    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update message status
router.patch('/:messageId/status', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const message = await Message.findOneAndUpdate(
      { $or: [{ id: messageId }, { _id: messageId }] },
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('❌ Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndDelete(
      { $or: [{ id: messageId }, { _id: messageId }] }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { q, wa_id } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const filter = {
      content: { $regex: q, $options: 'i' }
    };

    if (wa_id) {
      filter.wa_id = wa_id;
    }

    const messages = await Message.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('❌ Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Get message statistics
router.get('/stats', async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const totalConversations = await Message.distinct('wa_id').then(arr => arr.length);
    const todayMessages = await Message.countDocuments({
      timestamp: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
      }
    });

    const messagesByType = await Message.aggregate([
      { $group: { _id: '$message_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const messagesByStatus = await Message.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalMessages,
      totalConversations,
      todayMessages,
      messagesByType,
      messagesByStatus
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
