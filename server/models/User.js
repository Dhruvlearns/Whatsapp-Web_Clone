const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  wa_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profile_name: {
    type: String,
    required: true,
    trim: true
  },
  profile_picture: {
    type: String,
    default: null
  },
  phone_number: {
    type: String,
    sparse: true
  },
  last_seen: {
    type: Date,
    default: Date.now
  },
  is_online: {
    type: Boolean,
    default: false
  },
  status_message: {
    type: String,
    default: 'Hey there! I am using WhatsApp.',
    maxlength: 139
  },
  blocked: {
    type: Boolean,
    default: false
  },
  muted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userSchema.index({ wa_id: 1 });
userSchema.index({ name: 'text', profile_name: 'text' });
userSchema.index({ last_seen: -1 });
userSchema.index({ is_online: 1, last_seen: -1 });

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.profile_name || this.name;
});

// Static methods
userSchema.statics.findByWaId = function(wa_id) {
  return this.findOne({ wa_id });
};

userSchema.statics.searchUsers = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { profile_name: { $regex: query, $options: 'i' } },
      { wa_id: { $regex: query, $options: 'i' } }
    ]
  });
};

userSchema.statics.getOnlineUsers = function() {
  return this.find({ is_online: true }).sort({ last_seen: -1 });
};

// Instance methods
userSchema.methods.updateLastSeen = function() {
  this.last_seen = new Date();
  return this.save();
};

userSchema.methods.setOnline = function(isOnline = true) {
  this.is_online = isOnline;
  if (isOnline) {
    this.last_seen = new Date();
  }
  return this.save();
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure profile_name defaults to name if not provided
  if (!this.profile_name) {
    this.profile_name = this.name;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
