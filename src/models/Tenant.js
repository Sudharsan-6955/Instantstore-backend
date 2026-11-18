const mongoose = require('mongoose');

const PageSectionSchema = new mongoose.Schema({
  id: { type: String, default: () => Math.random().toString(36).substring(2, 9) },
  type: { 
    type: String, 
    default: 'text_block',
  },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  content: { type: String, default: '' },
  ctaText: { type: String, default: '' },
  ctaLink: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  items: { type: Array, default: [] },
  data: mongoose.Schema.Types.Mixed,
  order: { type: Number, default: 0 }
}, { _id: false });

const PageSchema = new mongoose.Schema({
  slug: { type: String, required: true }, // e.g. 'home', 'about', 'catalog', 'contact'
  title: { type: String, required: true },
  sections: [PageSectionSchema],
  metaDescription: String,
  isPublished: { type: Boolean, default: true }
}, { _id: false });

const TenantSchema = new mongoose.Schema({
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Instant storefront powered by zero-build cloud architecture.',
  },
  ownerEmail: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  ownerClerkId: {
    type: String,
    trim: true,
    index: true,
    default: '',
  },
  ownerPassword: {
    type: String,
    default: 'clerk_authenticated',
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  theme: {
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#1E293B' },
    accentColor: { type: String, default: '#F59E0B' },
    fontHeading: { type: String, default: 'Inter' },
    fontBody: { type: String, default: 'Inter' },
    borderRadius: { type: String, default: '0.75rem' }, // '0px' | '0.375rem' | '0.75rem' | '1.5rem'
    mode: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  brand: {
    logoUrl: { type: String, default: '' },
    heroImage: { type: String, default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80' },
    bannerText: { type: String, default: 'Welcome to our official brand storefront!' },
    announcement: { type: String, default: 'Flash Sale: Enjoy Free Shipping on Orders Over $50' },
  },
  contact: {
    email: { type: String, default: 'contact@brand.com' },
    phone: { type: String, default: '+1 (555) 019-2834' },
    address: { type: String, default: '100 Innovation Boulevard, Silicon Valley, CA' },
    socials: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    }
  },
  navigation: [
    {
      id: { type: String, default: 'nav-home' },
      label: { type: String, default: 'Home' },
      path: { type: String, default: '/' },
      isVisible: { type: Boolean, default: true },
    },
    {
      id: { type: String, default: 'nav-catalog' },
      label: { type: String, default: 'Catalog' },
      path: { type: String, default: '/catalog' },
      isVisible: { type: Boolean, default: true },
    },
    {
      id: { type: String, default: 'nav-about' },
      label: { type: String, default: 'About' },
      path: { type: String, default: '/about' },
      isVisible: { type: Boolean, default: true },
    },
    {
      id: { type: String, default: 'nav-contact' },
      label: { type: String, default: 'Contact' },
      path: { type: String, default: '/contact' },
      isVisible: { type: Boolean, default: true },
    },
  ],
  pages: [PageSchema],
  // Performance and Telemetry metadata
  provisioningMetrics: {
    provisionedAtMs: { type: Number, default: 0 }, // Elapsed milliseconds to create store
    clusterNode: { type: String, default: 'cluster-edge-01' },
    dnsStatus: { type: String, default: 'WILDCARD_ACTIVE' },
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Tenant', TenantSchema);
