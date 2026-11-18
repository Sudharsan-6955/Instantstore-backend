const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../utils/tenantIsolationPlugin');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  orderNumber: {
    type: String,
    required: true,
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, default: '' },
  },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Cash on Delivery'],
    default: 'Paid',
  },
  paymentMethod: {
    type: String,
    default: 'Card / Instant Mock Gateway',
  },
}, {
  timestamps: true,
});

// Compound Partitioning Indices for Multi-Tenant Mathematical Isolation
OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, orderNumber: 1 });

// Apply tenant isolation plugin
OrderSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Order', OrderSchema);
