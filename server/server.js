const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Models
const Message = require('./models/Message');
const User = require('./models/User');

// Routes
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Webhook endpoint for processing WhatsApp payloads
app.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('📨 Webhook received:', JSON.stringify(payload, null, 2));

    if (payload.entry && payload.entry[0]?.changes) {
      const change = payload.entry[0].changes[0];

      if (change.field === 'messages') {
        // Process messages
        if (change.value.messages) {
          for (const message of change.value.messages) {
            const contact = change.value.contacts?.[0];

            // Create or update user
            let user = await User.findOne({ wa_id: contact?.wa_id });
            if (!user && contact) {
              user = new User({
                wa_id: contact.wa_id,
                name: contact.profile?.name || 'Unknown User',
                profile_name: contact.profile?.name || 'Unknown User'
              });
              await user.save();
              console.log('👤 Created new user:', user.wa_id);
            }

            // Create message
            const newMessage = new Message({
              id: message.id,
              wa_id: message.from,
              message_type: message.type,
              content: getMessageContent(message),
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              status: 'received',
              is_from_me: false
            });

            await newMessage.save();
            console.log('💬 Saved message:', message.id);

            // Emit to connected clients
            io.emit('new_message', {
              message: newMessage,
              user: user
            });
          }
        }

        // Process status updates
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            const updated = await Message.findOneAndUpdate(
              { $or: [{ id: status.id }, { meta_msg_id: status.id }] },
              { status: status.status },
              { new: true }
            );

            if (updated) {
              console.log(`📊 Updated message ${status.id} status to ${status.status}`);

              // Emit status update
              io.emit('message_status_update', {
                id: status.id,
                status: status.status
              });
            }
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Helper function to extract message content
function getMessageContent(message) {
  switch (message.type) {
    case 'text':
      return message.text?.body || '';
    case 'image':
      return `📷 Image: ${message.image?.caption || 'No caption'}`;
    case 'audio':
      return '🎵 Audio message';
    case 'document':
      return `📄 Document: ${message.document?.filename || 'Unknown file'}`;
    case 'video':
      return `🎥 Video: ${message.video?.caption || 'No caption'}`;
    case 'sticker':
      return '🎭 Sticker';
    case 'location':
      return '📍 Location shared';
    default:
      return `📎 ${message.type} message`;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join_chat', (wa_id) => {
    socket.join(wa_id);
    console.log(`👥 User ${socket.id} joined chat ${wa_id}`);
  });

  socket.on('send_message', async (messageData) => {
    try {
      const { wa_id, content } = messageData;

      const newMessage = new Message({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        wa_id: wa_id,
        message_type: 'text',
        content: content,
        timestamp: new Date(),
        status: 'sent',
        is_from_me: true
      });

      await newMessage.save();
      console.log('📤 Message sent:', newMessage.id);

      // Broadcast to all clients
      io.emit('new_message', {
        message: newMessage,
        user: { wa_id: wa_id, name: 'Me' }
      });

      // Simulate status updates
      setTimeout(async () => {
        newMessage.status = 'delivered';
        await newMessage.save();
        io.emit('message_status_update', {
          id: newMessage.id,
          status: 'delivered'
        });
      }, 1000);

      setTimeout(async () => {
        newMessage.status = 'read';
        await newMessage.save();
        io.emit('message_status_update', {
          id: newMessage.id,
          status: 'read'
        });
      }, 3000);

      socket.emit('message_sent', { success: true, message: newMessage });
    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('message_sent', { success: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
// }); 

module.exports = app;
