const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  wa_id: {
    type: String,
    required: true,
    index: true
  },
  message_type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'audio', 'video', 'document', 'sticker', 'location'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'received'],
    default: 'sent'
  },
  is_from_me: {
    type: Boolean,
    default: false
  },
  meta_msg_id: {
    type: String,
    sparse: true,
    index: true
  },
  media_url: {
    type: String,
    sparse: true
  },
  media_id: {
    type: String,
    sparse: true
  },
  media_caption: {
    type: String,
    sparse: true
  },
  reaction: {
    emoji: String,
    from: String,
    timestamp: Date
  }
}, {
  timestamps: true,
  collection: 'processed_messages'
});

// Compound indexes for efficient queries
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ wa_id: 1, is_from_me: 1, timestamp: -1 });
messageSchema.index({ status: 1, is_from_me: 1 });

// Static methods
messageSchema.statics.getConversations = async function() {
  return this.aggregate([
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$wa_id',
        lastMessage: { $first: '$$ROOT' },
        messageCount: { $sum: 1 },
        unreadCount: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$is_from_me', false] }, 
                  { $ne: ['$status', 'read'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.timestamp': -1 }
    }
  ]);
};

messageSchema.statics.getChatMessages = async function(wa_id, limit = 50, skip = 0) {
  return this.find({ wa_id })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
};

// Instance methods
messageSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
