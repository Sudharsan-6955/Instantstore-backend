const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    sparse: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  tenantSubdomain: {
    type: String,
    default: null,
    trim: true,
  },
  role: {
    type: String,
    enum: ['merchant', 'admin', 'shopper'],
    default: 'merchant',
  },
  authProvider: {
    type: String,
    enum: ['clerk', 'local'],
    default: 'clerk',
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Indexes for fast lookups
UserSchema.index({ tenantSubdomain: 1 });

module.exports = mongoose.model('User', UserSchema);
