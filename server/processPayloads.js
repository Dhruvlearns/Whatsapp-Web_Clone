const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected for payload processing'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import models
const Message = require('./models/Message');
const User = require('./models/User');

// Function to process webhook payloads
async function processPayload(payload) {
  try {
  
    console.log('📄 Processing payload:', payload.object);

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

            // Check if message already exists
            const existingMessage = await Message.findOne({ id: message.id });
            if (existingMessage) {
              console.log('⚠️  Message already exists:', message.id);
              continue;
            }

            // Create new message
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
            } else {
              console.log(`⚠️  Message ${status.id} not found for status update`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing payload:', error);
  }
}

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

// Main function to process all payload files
async function processAllPayloads() {
  try {
    const payloadsDir = path.join(__dirname, '../sample_payloads');

    if (!fs.existsSync(payloadsDir)) {
      console.error('❌ Sample payloads directory not found. Please ensure sample_payloads folder exists.');
      console.log('💡 Create the sample_payloads folder and add JSON payload files to it.');
      process.exit(1);
    }

    const files = fs.readdirSync(payloadsDir)
      .filter(file => file.endsWith('.json'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No JSON payload files found in sample_payloads directory.');
      console.log('💡 Add some JSON webhook payload files to the sample_payloads folder.');
      process.exit(0);
    }

    console.log(`📂 Found ${files.length} payload files to process`);

    for (const file of files) {
      const filePath = path.join(payloadsDir, file);
      console.log(`\n📄 Processing file: ${file}`);

      try {
        const payloadData = fs.readFileSync(filePath, 'utf8');
        const payload = JSON.parse(payloadData);
        await processPayload(payload);
        console.log(`✅ Processed ${file} successfully`);
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }

    console.log('\n🎉 All payloads processed successfully!');

    // Display summary
    const messageCount = await Message.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`\n📊 Database Summary:`);
    console.log(`   📝 Total messages: ${messageCount}`);
    console.log(`   👥 Total users: ${userCount}`);

  } catch (error) {
    console.error('❌ Error processing payloads:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the processor
if (require.main === module) {
  console.log('🚀 Starting WhatsApp Webhook Payload Processor...');
  processAllPayloads();
}

module.exports = { processPayload, processAllPayloads };
