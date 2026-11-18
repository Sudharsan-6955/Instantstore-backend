require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const Order = require('../models/Order');

const seedData = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/instantstore';
  console.log('Connecting to database...');
  await mongoose.connect(uri);

  console.log('Clearing existing collections for clean seed...');
  await Tenant.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Store 1: TechGear Studio
  console.log('Seeding Store 1: TechGear Studio (techgear.localhost)...');
  const techTenant = await Tenant.create({
    subdomain: 'techgear',
    name: 'TechGear Studio',
    tagline: 'High-performance computing accessories and ergonomic desk gear.',
    ownerEmail: 'alex@techgear.io',
    ownerPassword: defaultPassword,
    theme: {
      primaryColor: '#6366F1', // Indigo
      secondaryColor: '#0F172A',
      accentColor: '#10B981',
      fontHeading: 'Space Grotesk',
      fontBody: 'Inter',
      borderRadius: '0.75rem',
      mode: 'dark',
    },
    brand: {
      logoUrl: '',
      heroImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
      bannerText: 'Engineered for Developers, Designers, and Creators.',
      announcement: '🚀 Next-Gen Keyboards Now In Stock — Limited Batch Available!',
    },
    contact: {
      email: 'support@techgear.io',
      phone: '+1 (415) 880-9921',
      address: '742 Cyber Plaza, Tech Quarter, San Francisco, CA',
    },
    navigation: [
      { id: '1', label: 'Home', path: '/', isVisible: true },
      { id: '2', label: 'Catalog', path: '/catalog', isVisible: true },
      { id: '3', label: 'About', path: '/about', isVisible: true },
      { id: '4', label: 'Contact', path: '/contact', isVisible: true },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            title: 'Precision Tools for Modern Builders',
            subtitle: 'Elevate your workspace with aerospace-grade anodized aluminum accessories, hot-swappable tactile switches, and high-DPI wireless optics.',
            ctaText: 'Explore Gear',
            ctaLink: '/catalog',
            imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
          },
          {
            type: 'featured_products',
            title: 'Flagship Hardware',
            subtitle: 'Battle-tested by software engineers and digital artists around the globe.',
          },
          {
            type: 'banner',
            title: 'Built with Precision CNC Machining',
            subtitle: 'Every unit is individually calibrated for weight, acoustic dampening, and long-term durability.',
          }
        ]
      },
      {
        slug: 'about',
        title: 'About TechGear',
        sections: [
          {
            type: 'story',
            title: 'Born in a Garage, Refined for the Desk',
            subtitle: 'We grew tired of flimsy plastic peripherals that break after a year.',
            content: 'TechGear started in 2022 when three hardware engineers decided to build mechanical keyboards that sound like rain on slate and monitors arms that hold their position for a decade. Today, our products power work setups across 42 countries.',
            imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
          },
          {
            type: 'stats',
            title: 'Hardware Milestones',
            data: {
              stat1: { number: '45,000+', label: 'Units Deployed' },
              stat2: { number: '4.9 / 5', label: 'Customer Rating' },
              stat3: { number: '3-Year', label: 'Hassle-Free Warranty' },
            }
          }
        ]
      },
      {
        slug: 'contact',
        title: 'Contact Engineering Support',
        sections: [
          {
            type: 'contact_form',
            title: 'Have a Hardware Question or Custom Order?',
            subtitle: 'Our technical support team responds within 4 business hours.',
          }
        ]
      }
    ],
    provisioningMetrics: {
      provisionedAtMs: 14.82,
      clusterNode: 'cluster-edge-01',
      dnsStatus: 'WILDCARD_ACTIVE'
    }
  });

  const techProducts = [
    {
      tenantId: 'techgear',
      title: 'Apex-75 Custom Mechanical Keyboard',
      slug: 'apex-75-keyboard',
      description: 'Gasket-mounted 75% layout, pre-lubed linear switches, hot-swap PCB, and double-shot PBT keycaps.',
      price: 189,
      compareAtPrice: 220,
      category: 'Keyboards',
      images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'],
      inventory: 40,
      badge: 'Flagship',
      isFeatured: true,
      rating: 4.9,
      reviewCount: 88,
    },
    {
      tenantId: 'techgear',
      title: 'Precision Ergonomic Wireless Mouse',
      slug: 'precision-mouse',
      description: '4K polling rate, Nordic MCU, optical switches, and 80-hour battery life on a single USB-C charge.',
      price: 89,
      compareAtPrice: 110,
      category: 'Mice & Pointers',
      images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80'],
      inventory: 65,
      badge: 'Bestseller',
      isFeatured: true,
      rating: 4.8,
      reviewCount: 42,
    },
    {
      tenantId: 'techgear',
      title: 'Solid Walnut Monitor Riser',
      slug: 'walnut-monitor-riser',
      description: 'Crafted from sustainable American walnut with matte powder-coated steel legs and cork feet.',
      price: 125,
      compareAtPrice: 145,
      category: 'Desk Organization',
      images: ['https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80'],
      inventory: 28,
      badge: 'Artisan',
      isFeatured: true,
      rating: 5.0,
      reviewCount: 31,
    },
    {
      tenantId: 'techgear',
      title: 'Coiled Aviator Cable (Type-C to A)',
      slug: 'coiled-aviator-cable',
      description: 'Double-sleeved with Paracord and Techflex, gold-plated connectors, and GX16 4-pin aviator plug.',
      price: 34,
      compareAtPrice: 42,
      category: 'Accessories',
      images: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80'],
      inventory: 110,
      badge: 'Popular',
      isFeatured: false,
      rating: 4.7,
      reviewCount: 19,
    }
  ];
  await Product.insertMany(techProducts);

  // Store 2: Coffee Oasis
  console.log('Seeding Store 2: Coffee Oasis (coffee-oasis.localhost)...');
  const coffeeTenant = await Tenant.create({
    subdomain: 'coffee-oasis',
    name: 'Coffee Oasis Roasters',
    tagline: 'Single-origin micro-lot specialty coffees sourced directly from ethical farmers.',
    ownerEmail: 'elena@coffeeoasis.com',
    ownerPassword: defaultPassword,
    theme: {
      primaryColor: '#D97706', // Warm Amber
      secondaryColor: '#292524',
      accentColor: '#B45309',
      fontHeading: 'Playfair Display',
      fontBody: 'Plus Jakarta Sans',
      borderRadius: '0.375rem',
      mode: 'light',
    },
    brand: {
      logoUrl: '',
      heroImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
      bannerText: 'Freshly Roasted Every Tuesday & Friday. Shipped in Compostable Pouches.',
      announcement: '☕ Ethiopian Yirgacheffe Natural Process Batch Just Landed!',
    },
    contact: {
      email: 'roastery@coffeeoasis.com',
      phone: '+1 (503) 912-4411',
      address: '210 Artisan Roasters Lane, Portland, OR',
    },
    navigation: [
      { id: '1', label: 'Home', path: '/', isVisible: true },
      { id: '2', label: 'Catalog', path: '/catalog', isVisible: true },
      { id: '3', label: 'About', path: '/about', isVisible: true },
      { id: '4', label: 'Contact', path: '/contact', isVisible: true },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            title: 'Coffee Roasted for the Mindful Palate',
            subtitle: 'Discover notes of jasmine, bergamot, candied stone fruit, and dark chocolate in our hand-sorted micro-lots.',
            ctaText: 'Shop Roasts',
            ctaLink: '/catalog',
            imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
          },
          {
            type: 'featured_products',
            title: 'Current Harvest Roasts',
            subtitle: 'Direct-trade beans scored 87+ on the Specialty Coffee Association scale.',
          }
        ]
      },
      {
        slug: 'about',
        title: 'Our Roasting Philosophy',
        sections: [
          {
            type: 'story',
            title: 'Direct Trade, Respect for the Soil',
            subtitle: 'Paying 300% above fair trade minimums to support farm families.',
            content: 'We visit every cooperative we buy from. By eliminating export brokers, we return maximum value to regenerative farmers while delivering freshly harvested beans to your doorstep.',
            imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80',
          }
        ]
      },
      {
        slug: 'contact',
        title: 'Visit Our Tasting Room',
        sections: [
          {
            type: 'contact_form',
            title: 'Have Questions About Grind Sizes or Wholesale?',
            subtitle: 'Drop us a message or stop by our Portland roastery for a cupping session.',
          }
        ]
      }
    ],
    provisioningMetrics: {
      provisionedAtMs: 12.35,
      clusterNode: 'cluster-edge-01',
      dnsStatus: 'WILDCARD_ACTIVE'
    }
  });

  const coffeeProducts = [
    {
      tenantId: 'coffee-oasis',
      title: 'Ethiopia Yirgacheffe (Natural)',
      slug: 'ethiopia-yirgacheffe',
      description: 'Tasting notes: Blueberry jam, jasmine floral aroma, sweet lemon curd finish. Elevation: 2,100m.',
      price: 22,
      compareAtPrice: 26,
      category: 'Single Origin',
      images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'],
      inventory: 90,
      badge: 'Staff Pick',
      isFeatured: true,
      rating: 4.9,
      reviewCount: 64,
    },
    {
      tenantId: 'coffee-oasis',
      title: 'Guatemala Huehuetenango (Washed)',
      slug: 'guatemala-huehuetenango',
      description: 'Tasting notes: Brown sugar sweetness, crisp red apple acidity, dark cacao body.',
      price: 20,
      compareAtPrice: 0,
      category: 'Single Origin',
      images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
      inventory: 75,
      badge: 'Classic',
      isFeatured: true,
      rating: 4.8,
      reviewCount: 38,
    },
    {
      tenantId: 'coffee-oasis',
      title: 'Midnight Velvet Espresso Blend',
      slug: 'midnight-velvet-espresso',
      description: 'Rich crema, toasted hazelnut, molasses, and dark baker chocolate. Perfect for flat whites and lattes.',
      price: 18,
      compareAtPrice: 22,
      category: 'Espresso Blends',
      images: ['https://images.unsplash.com/photo-1610632380989-680fe40816c6?auto=format&fit=crop&w=800&q=80'],
      inventory: 140,
      badge: 'Bestseller',
      isFeatured: true,
      rating: 4.9,
      reviewCount: 112,
    }
  ];
  await Product.insertMany(coffeeProducts);

  // Store 3: Urban Minimalist
  console.log('Seeding Store 3: Urban Minimalist (urban-apparel.localhost)...');
  await Tenant.create({
    subdomain: 'urban-apparel',
    name: 'Urban Minimalist',
    tagline: 'Timeless everyday silhouettes cut from sustainable heavyweight materials.',
    ownerEmail: 'sarah@urbanminimal.com',
    ownerPassword: defaultPassword,
    theme: {
      primaryColor: '#09090B', // Zinc Black
      secondaryColor: '#71717A',
      accentColor: '#3F3F46',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      borderRadius: '0px', // Sharp brutalist / modern
      mode: 'light',
    },
    brand: {
      logoUrl: '',
      heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
      bannerText: 'Architectural Cuts. Organic Fibers. Zero Fast Fashion.',
      announcement: 'Winter Capsule Collection 04 is now available globally.',
    },
    contact: {
      email: 'studio@urbanminimal.com',
      phone: '+1 (212) 555-0182',
      address: '45 Wooster Street, SoHo, New York, NY',
    },
    navigation: [
      { id: '1', label: 'Home', path: '/', isVisible: true },
      { id: '2', label: 'Catalog', path: '/catalog', isVisible: true },
      { id: '3', label: 'About', path: '/about', isVisible: true },
      { id: '4', label: 'Contact', path: '/contact', isVisible: true },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            title: 'Uniform for Modern Living',
            subtitle: 'Stripped of unnecessary branding. Thoughtfully engineered garments designed to endure seasons, not trends.',
            ctaText: 'View Capsule',
            ctaLink: '/catalog',
            imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
          },
          {
            type: 'featured_products',
            title: 'Capsule 04 Selected Pieces',
            subtitle: 'Unisex structured essentials crafted in Portugal.',
          }
        ]
      },
      {
        slug: 'about',
        title: 'Manifesto',
        sections: [
          {
            type: 'story',
            title: 'Rejecting the Trend Cycle',
            subtitle: 'Fewer garments, superior construction.',
            content: 'The fashion industry overproduces billions of unwearable items each season. We produce limited seasonal batches using GOTS-certified organic cotton, Japanese denim, and recycled Italian wool.',
            imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
          }
        ]
      },
      {
        slug: 'contact',
        title: 'SoHo Flagship & Inquiries',
        sections: [
          {
            type: 'contact_form',
            title: 'Book a Fitting Appointment or Inquire',
            subtitle: 'Our stylists are available both in-person in SoHo and via digital consultation.',
          }
        ]
      }
    ],
    provisioningMetrics: {
      provisionedAtMs: 16.12,
      clusterNode: 'cluster-edge-01',
      dnsStatus: 'WILDCARD_ACTIVE'
    }
  });

  const urbanProducts = [
    {
      tenantId: 'urban-apparel',
      title: 'Heavyweight Boxy Crewneck (450 GSM)',
      slug: 'heavyweight-boxy-crewneck',
      description: 'French terry knit, drop shoulder silhouette, ribbed cuffs and double-needle collar stitch.',
      price: 110,
      compareAtPrice: 135,
      category: 'Outerwear',
      images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'],
      inventory: 50,
      badge: 'Core Essential',
      isFeatured: true,
      rating: 5.0,
      reviewCount: 47,
    },
    {
      tenantId: 'urban-apparel',
      title: 'Tailored Wide-Leg Pleated Trouser',
      slug: 'pleated-trouser',
      description: 'High-waisted silhouette with deep front pleats, hidden coin pocket, and custom horn buttons.',
      price: 145,
      compareAtPrice: 0,
      category: 'Bottoms',
      images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80'],
      inventory: 35,
      badge: 'New',
      isFeatured: true,
      rating: 4.8,
      reviewCount: 29,
    }
  ];
  await Product.insertMany(urbanProducts);

  // Add initial orders for techgear
  await Order.create({
    tenantId: 'techgear',
    orderNumber: 'ORD-TECH-1001',
    customer: {
      name: 'Jordan Miller',
      email: 'jordan@developer.io',
      phone: '+1 555-0144',
      address: '404 Silicon Way',
      city: 'Austin',
      postalCode: '78701'
    },
    items: [
      {
        productId: 'prod-apex75',
        title: 'Apex-75 Custom Mechanical Keyboard',
        price: 189,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
      }
    ],
    subtotal: 189,
    tax: 15.12,
    shipping: 0,
    total: 204.12,
    status: 'Processing',
    paymentStatus: 'Paid',
  });

  console.log('✅ Seeding complete!');
  console.log('3 Demo Stores Active:');
  console.log('  1) http://techgear.localhost:5173      (TechGear Studio - Dark/Indigo)');
  console.log('  2) http://coffee-oasis.localhost:5173   (Coffee Oasis Roasters - Amber/Warm)');
  console.log('  3) http://urban-apparel.localhost:5173  (Urban Minimalist - Brutalist Monochrome)');
  console.log('Central Studio: http://localhost:5173');
  
  await mongoose.disconnect();
};

seedData().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
