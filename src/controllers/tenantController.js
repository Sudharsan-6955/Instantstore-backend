const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');

const JWT_SECRET = process.env.JWT_SECRET || 'instantstore_super_secret_jwt_key_2026';

// Reserved subdomains that cannot be registered
const RESERVED = new Set(['app', 'admin', 'api', 'www', 'static', 'cdn', 'dashboard', 'localhost', 'mail', 'root']);

// Check Subdomain Availability
exports.checkSubdomainAvailability = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const cleanSub = (subdomain || '').trim().toLowerCase();

    if (!cleanSub || cleanSub.length < 3) {
      return res.status(400).json({
        available: false,
        message: 'Subdomain must be at least 3 alphanumeric characters.',
      });
    }

    if (RESERVED.has(cleanSub)) {
      return res.status(200).json({
        available: false,
        message: 'This subdomain is reserved for platform infrastructure.',
      });
    }

    const existing = await Tenant.findOne({ subdomain: cleanSub });
    return res.status(200).json({
      available: !existing,
      subdomain: cleanSub,
      message: existing ? 'Subdomain is already registered.' : 'Subdomain is available for instant zero-build provisioning!',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Zero-Build Instant Tenant Provisioning (< 50ms)
exports.provisionTenant = async (req, res) => {
  const startTime = process.hrtime.bigint();

  try {
    const { 
      subdomain, 
      name, 
      tagline, 
      ownerEmail, 
      ownerPassword, 
      ownerClerkId,
      theme, 
      brand, 
      contact,
      navigation,
      pages,
      sampleCategory 
    } = req.body;

    const cleanSub = (subdomain || '').trim().toLowerCase();

    if (!cleanSub || cleanSub.length < 3) {
      return res.status(400).json({ success: false, message: 'Subdomain must be at least 3 characters.' });
    }

    if (RESERVED.has(cleanSub)) {
      return res.status(400).json({ success: false, message: 'Subdomain is reserved for platform operations.' });
    }

    const existing = await Tenant.findOne({ subdomain: cleanSub });
    if (existing) {
      // Check if user is owner (or customizing default demo store) to allow re-launch & updates
      const isOwner = (ownerClerkId && existing.ownerClerkId === ownerClerkId) ||
                      (ownerEmail && existing.ownerEmail?.toLowerCase() === ownerEmail.toLowerCase()) ||
                      ['techgear', 'coffee-oasis', 'urban-apparel'].includes(cleanSub);

      if (isOwner) {
        if (theme) existing.theme = { ...existing.theme.toObject(), ...theme };
        if (brand) existing.brand = { ...existing.brand.toObject(), ...brand };
        if (contact) existing.contact = { ...existing.contact.toObject(), ...contact };
        if (name) existing.name = name;
        if (tagline) existing.tagline = tagline;
        if (pages) existing.pages = pages;
        if (ownerClerkId) existing.ownerClerkId = ownerClerkId;
        if (ownerEmail) existing.ownerEmail = ownerEmail;
        existing.isPublished = true;

        await existing.save();

        // Upsert any products passed
        if (Array.isArray(req.body.products) && req.body.products.length > 0) {
          for (const p of req.body.products) {
            const pSlug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
            await Product.findOneAndUpdate(
              { tenantId: cleanSub, title: p.title },
              {
                tenantId: cleanSub,
                title: p.title,
                slug: pSlug,
                price: Number(p.price) || 29,
                compareAtPrice: Number(p.compareAtPrice) || 0,
                category: p.category || 'General',
                images: p.images || [],
                description: p.description || '',
                inventory: Number(p.inventory) || 50,
                badge: p.badge || '',
                isFeatured: p.isFeatured !== undefined ? Boolean(p.isFeatured) : true,
              },
              { upsert: true, new: true }
            );
          }
        }

        const token = jwt.sign(
          {
            id: existing._id,
            clerkId: existing.ownerClerkId || ownerClerkId,
            email: existing.ownerEmail,
            subdomain: existing.subdomain,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          success: true,
          message: `Storefront '${cleanSub}' updated and published successfully to MongoDB Atlas!`,
          subdomain: cleanSub,
          token,
          tenant: existing,
        });
      }

      return res.status(409).json({ success: false, message: 'Subdomain already taken by another merchant.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ownerPassword || Math.random().toString(36).substring(2, 12), 10);

    // Initial multi-page configuration for Home, Catalog, About, Contact
    const initialPages = [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            title: name || 'Welcome to Our Flagship Store',
            subtitle: tagline || 'Crafted with passion, delivered with speed. Zero build lag, instant live catalog.',
            ctaText: 'Explore Catalog',
            ctaLink: '/catalog',
            imageUrl: brand?.heroImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
          },
          {
            type: 'featured_products',
            title: 'Featured Collection',
            subtitle: 'Handpicked premium items just for you',
          },
          {
            type: 'banner',
            title: 'Sustainable & Fast Delivery',
            subtitle: 'Every order comes with a 100% satisfaction guarantee and carbon-neutral packaging.',
          }
        ]
      },
      {
        slug: 'about',
        title: 'About Us',
        sections: [
          {
            type: 'story',
            title: `The Story of ${name || 'Our Brand'}`,
            subtitle: 'Born from innovation, driven by community',
            content: `We started ${name || 'our brand'} with a single mission: to create exceptional quality products without the middleman markups. Our architecture enables instant updates and true customer direct pricing.`,
            imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          },
          {
            type: 'stats',
            title: 'By The Numbers',
            data: {
              stat1: { number: '10,000+', label: 'Happy Customers' },
              stat2: { number: '99.8%', label: 'Positive Reviews' },
              stat3: { number: '48 Hrs', label: 'Express Shipping' }
            }
          }
        ]
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        sections: [
          {
            type: 'contact_form',
            title: 'Get In Touch',
            subtitle: "Have questions about our products or custom orders? We'd love to hear from you.",
          }
        ]
      }
    ];

    // Atomic DB write for Tenant
    const newTenant = new Tenant({
      subdomain: cleanSub,
      name: name || `${cleanSub.toUpperCase()} Store`,
      tagline: tagline || 'Instant storefront powered by zero-build cloud architecture.',
      ownerEmail: ownerEmail || `merchant@${cleanSub}.com`,
      ownerClerkId: ownerClerkId || '',
      ownerPassword: hashedPassword,
      theme: {
        primaryColor: theme?.primaryColor || '#3B82F6',
        secondaryColor: theme?.secondaryColor || '#1E293B',
        accentColor: theme?.accentColor || '#F59E0B',
        fontHeading: theme?.fontHeading || 'Inter',
        fontBody: theme?.fontBody || 'Inter',
        borderRadius: theme?.borderRadius || '0.75rem',
        mode: theme?.mode || 'light',
      },
      brand: {
        logoUrl: brand?.logoUrl || '',
        heroImage: brand?.heroImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
        bannerText: brand?.bannerText || 'Welcome to our official brand storefront!',
        announcement: brand?.announcement || 'Flash Sale: Enjoy Free Shipping on Orders Over $50',
      },
      contact: {
        email: contact?.email || ownerEmail || `contact@${cleanSub}.com`,
        phone: contact?.phone || '+1 (555) 019-2834',
        address: contact?.address || '100 Innovation Boulevard, Silicon Valley, CA',
      },
      navigation: navigation && navigation.length > 0 ? navigation : [
        { id: '1', label: 'Home', path: '/', isVisible: true },
        { id: '2', label: 'Catalog', path: '/catalog', isVisible: true },
        { id: '3', label: 'About', path: '/about', isVisible: true },
        { id: '4', label: 'Contact', path: '/contact', isVisible: true },
      ],
      pages: pages && pages.length > 0 ? pages : initialPages,
    });

    await newTenant.save();

    // Seed products for the new tenant
    let productsToInsert = [];
    if (Array.isArray(req.body.products) && req.body.products.length > 0) {
      productsToInsert = req.body.products.map(p => ({
        tenantId: cleanSub,
        title: p.title,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
        description: p.description || '',
        price: Number(p.price) || 29,
        compareAtPrice: Number(p.compareAtPrice) || 0,
        category: p.category || 'General',
        images: p.images && p.images.length ? p.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
        inventory: Number(p.inventory) || 50,
        badge: p.badge || '',
        isFeatured: p.isFeatured !== undefined ? Boolean(p.isFeatured) : true,
      }));
    } else {
      const category = sampleCategory || 'Apparel & Gear';
      productsToInsert = [
        {
          tenantId: cleanSub,
          title: 'Signature Minimalist Tee',
          slug: 'signature-minimalist-tee',
          description: '100% organic heavyweight cotton with a tailored modern fit and pre-shrunk finish.',
          price: 38,
          compareAtPrice: 48,
          category: category,
          images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
          inventory: 150,
          badge: 'Bestseller',
          isFeatured: true,
        },
        {
          tenantId: cleanSub,
          title: 'Everyday Canvas Tote Bag',
          slug: 'everyday-canvas-tote-bag',
          description: 'Reinforced stitch handles with internal organizer pockets, water-repellent canvas.',
          price: 24,
          compareAtPrice: 30,
          category: category,
          images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'],
          inventory: 85,
          badge: 'New',
          isFeatured: true,
        },
        {
          tenantId: cleanSub,
          title: 'Thermal Insulated Water Bottle',
          slug: 'thermal-insulated-water-bottle',
          description: 'Double-wall vacuum insulation keeps beverages cold for 24 hours or piping hot for 12 hours.',
          price: 32,
          compareAtPrice: 0,
          category: category,
          images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'],
          inventory: 120,
          badge: 'Popular',
          isFeatured: true,
        },
        {
          tenantId: cleanSub,
          title: 'Custom Ceramic Travel Mug',
          slug: 'custom-ceramic-travel-mug',
          description: 'Handcrafted ceramic texture with leak-proof silicone lid and ergonomic grip.',
          price: 26,
          compareAtPrice: 32,
          category: category,
          images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
          inventory: 45,
          badge: 'Limited',
          isFeatured: false,
        }
      ];
    }

    await Product.insertMany(productsToInsert);

    // Link user if ownerEmail or ownerClerkId matches an existing User record in MongoDB Atlas
    const User = require('../models/User');
    if (newTenant.ownerEmail || newTenant.ownerClerkId) {
      await User.findOneAndUpdate(
        { $or: [
          ...(newTenant.ownerClerkId ? [{ clerkId: newTenant.ownerClerkId }] : []),
          ...(newTenant.ownerEmail ? [{ email: newTenant.ownerEmail.toLowerCase() }] : [])
        ]},
        { tenantSubdomain: cleanSub }
      );
    }

    // Compute high-precision provisioning latency
    const endTime = process.hrtime.bigint();
    const provisioningMs = Number(endTime - startTime) / 1e6;

    // Update recorded metric
    newTenant.provisioningMetrics = {
      provisionedAtMs: provisioningMs,
      clusterNode: 'cluster-edge-01',
      dnsStatus: 'WILDCARD_ACTIVE'
    };
    await newTenant.save();

    // Generate JWT token for Merchant Studio session
    const token = jwt.sign(
      {
        id: newTenant._id,
        email: newTenant.ownerEmail,
        subdomain: newTenant.subdomain,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: `Tenant '${cleanSub}' successfully provisioned in ${provisioningMs.toFixed(2)} ms!`,
      provisioningLatencyMs: provisioningMs,
      dnsStatus: 'WILDCARD_ACTIVE',
      liveUrl: `http://${cleanSub}.localhost:5173`,
      tenant: {
        _id: newTenant._id,
        subdomain: newTenant.subdomain,
        name: newTenant.name,
        tagline: newTenant.tagline,
        ownerEmail: newTenant.ownerEmail,
        theme: newTenant.theme,
        brand: newTenant.brand,
        navigation: newTenant.navigation,
        pages: newTenant.pages,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Dynamic Hydration for Zero-Build Storefront (< 15ms)
exports.getTenantStorefront = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const subdomain = req.params.subdomain || req.tenantSubdomain;

    if (!subdomain) {
      return res.status(400).json({ success: false, message: 'Subdomain identifier is required.' });
    }

    const tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() }).select('-ownerPassword');
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: `Storefront for subdomain '${subdomain}' not found. Check spelling or create it in InstantStore Studio.`,
      });
    }

    // Fetch tenant-scoped catalog using compound index
    const products = await Product.find({ tenantId: tenant.subdomain }).sort({ isFeatured: -1, createdAt: -1 });

    const end = process.hrtime.bigint();
    const hydrationMs = Number(end - start) / 1e6;

    res.setHeader('X-Storefront-Hydration-Ms', hydrationMs.toFixed(3));

    return res.status(200).json({
      success: true,
      hydrationLatencyMs: hydrationMs,
      tenant,
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Tenant Theme & Brand Configuration (Real-Time Studio Sync)
exports.updateTenantTheme = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { theme, brand, contact, name, tagline, navigation, pages, ownerClerkId, ownerEmail } = req.body;
    const User = require('../models/User');

    let tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
    if (!tenant) {
      // Auto-provision if saving draft for a new store
      const cleanSub = subdomain.toLowerCase().trim();
      const resolvedOwnerEmail = req.merchant?.email || ownerEmail || `merchant@${cleanSub}.com`;
      const resolvedClerkId = ownerClerkId || req.merchant?.clerkId || '';

      tenant = new Tenant({
        subdomain: cleanSub,
        name: name || `${cleanSub.toUpperCase()} Store`,
        tagline: tagline || 'Instant storefront powered by zero-build cloud architecture.',
        ownerEmail: resolvedOwnerEmail,
        ownerClerkId: resolvedClerkId,
        ownerPassword: 'password123',
        theme: theme || {},
        brand: brand || {},
        contact: contact || {},
        navigation: navigation || [],
        pages: pages || [],
      });
      await tenant.save();

      if (resolvedOwnerEmail || resolvedClerkId) {
        await User.findOneAndUpdate(
          { $or: [
            ...(resolvedClerkId ? [{ clerkId: resolvedClerkId }] : []),
            ...(resolvedOwnerEmail ? [{ email: resolvedOwnerEmail.toLowerCase() }] : [])
          ]},
          { tenantSubdomain: cleanSub },
          { upsert: false }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Storefront created and saved atomically to MongoDB Atlas.',
        tenant,
      });
    }

    if (theme) tenant.theme = { ...tenant.theme.toObject(), ...theme };
    if (brand) tenant.brand = { ...tenant.brand.toObject(), ...brand };
    if (contact) tenant.contact = { ...tenant.contact.toObject(), ...contact };
    if (name) tenant.name = name;
    if (tagline) tenant.tagline = tagline;
    if (navigation) tenant.navigation = navigation;
    if (pages) tenant.pages = pages;
    if (ownerClerkId) tenant.ownerClerkId = ownerClerkId;
    if (ownerEmail) tenant.ownerEmail = ownerEmail;

    await tenant.save();

    // Link user subdomain in MongoDB Atlas
    const userEmail = tenant.ownerEmail || ownerEmail;
    const userClerk = tenant.ownerClerkId || ownerClerkId;
    if (userEmail || userClerk) {
      await User.findOneAndUpdate(
        { $or: [
          ...(userClerk ? [{ clerkId: userClerk }] : []),
          ...(userEmail ? [{ email: userEmail.toLowerCase() }] : [])
        ]},
        { tenantSubdomain: tenant.subdomain }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Storefront styling and configuration updated atomically.',
      tenant,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Merchant Login
exports.merchantLogin = async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;

    let query = {};
    if (subdomain) {
      query.subdomain = subdomain.trim().toLowerCase();
    } else if (email) {
      query.ownerEmail = email.trim().toLowerCase();
    } else {
      return res.status(400).json({ success: false, message: 'Provide email or store subdomain.' });
    }

    const tenant = await Tenant.findOne(query);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'No store registered with these credentials.' });
    }

    const isMatch = await bcrypt.compare(password, tenant.ownerPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        id: tenant._id,
        email: tenant.ownerEmail,
        subdomain: tenant.subdomain,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      tenant: {
        _id: tenant._id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        tagline: tenant.tagline,
        ownerEmail: tenant.ownerEmail,
        theme: tenant.theme,
        brand: tenant.brand,
        contact: tenant.contact,
        navigation: tenant.navigation,
        pages: tenant.pages,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// List all tenants (Central Admin Directory)
exports.listTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({}).select('subdomain name tagline theme brand createdAt provisioningMetrics').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: tenants.length,
      tenants,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all stores owned by a specific user (by email or clerkId)
exports.getUserTenants = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'User identifier required' });
    }

    const clean = identifier.trim().toLowerCase();
    const tenants = await Tenant.find({
      $or: [
        { ownerClerkId: identifier },
        { ownerEmail: clean }
      ]
    }).select('-ownerPassword').sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: tenants.length,
      tenants
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a tenant store and its catalog products from Atlas
exports.deleteTenant = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const cleanSub = (subdomain || '').trim().toLowerCase();

    // Prevent deleting core demo starter stores
    if (['techgear', 'coffee-oasis', 'urban-apparel'].includes(cleanSub)) {
      return res.status(400).json({ success: false, message: 'Core platform demo stores cannot be deleted.' });
    }

    const tenant = await Tenant.findOne({ subdomain: cleanSub });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Delete tenant and associated catalog products
    await Tenant.deleteOne({ subdomain: cleanSub });
    await Product.deleteMany({ tenantId: cleanSub });

    return res.status(200).json({
      success: true,
      message: `Store '${cleanSub}' and its catalog records deleted successfully from MongoDB Atlas.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
