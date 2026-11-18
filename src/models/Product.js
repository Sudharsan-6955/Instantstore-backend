const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../utils/tenantIsolationPlugin');

const ProductSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  compareAtPrice: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  images: {
    type: [String],
    default: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
  },
  inventory: {
    type: Number,
    default: 100,
    min: 0,
  },
  badge: {
    type: String,
    default: '', // 'Bestseller', 'New', 'Sale', 'Popular'
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 12,
  },
}, {
  timestamps: true,
});

// Compound Partitioning Indices for Multi-Tenant Mathematical Isolation
ProductSchema.index({ tenantId: 1, _id: 1 });
ProductSchema.index({ tenantId: 1, slug: 1 });
ProductSchema.index({ tenantId: 1, category: 1 });
ProductSchema.index({ tenantId: 1, isFeatured: 1 });

// Apply tenant isolation plugin
ProductSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Product', ProductSchema);
