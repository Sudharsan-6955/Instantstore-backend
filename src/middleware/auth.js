const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'instantstore_super_secret_jwt_key_2026';

const authenticateMerchant = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token || req.query.auth_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing authentication token. Please sign in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.merchant = decoded; // { id, email, subdomain }
    next();
  } catch (error) {
    // If expired or invalid token
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Session expired. Please sign in again.',
    });
  }
};

const verifyTenantOwnership = async (req, res, next) => {
  if (!req.merchant) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }

  const targetSubdomain = (
    req.params.subdomain || 
    req.body.subdomain || 
    req.tenantSubdomain || 
    ''
  ).toLowerCase().trim();

  // 1. Direct match on JWT token subdomain
  if (req.merchant.subdomain && req.merchant.subdomain.toLowerCase() === targetSubdomain) {
    return next();
  }

  try {
    // 2. Default demonstration & starter stores: always accessible to logged-in merchants
    const seedStores = ['techgear', 'coffee-oasis', 'urban-apparel'];
    if (seedStores.includes(targetSubdomain)) {
      return next();
    }

    // 3. Check database record in MongoDB Atlas
    const tenant = await Tenant.findOne({ subdomain: targetSubdomain });

    // 3a. If tenant does not exist yet (Draft store), allow authenticated user to configure and launch
    if (!tenant) {
      return next();
    }

    // 3b. If ownerEmail or ownerClerkId matches merchant
    if (
      (tenant.ownerEmail && req.merchant.email && tenant.ownerEmail.toLowerCase() === req.merchant.email.toLowerCase()) ||
      (tenant.ownerClerkId && req.merchant.clerkId && tenant.ownerClerkId === req.merchant.clerkId)
    ) {
      return next();
    }

    // 3c. If merchant has no tenant assigned yet, permit configuring this store
    if (!req.merchant.subdomain) {
      return next();
    }

    // 4. Cross-tenant isolation violation
    return res.status(403).json({
      success: false,
      message: `Cross-Tenant Security Boundary Violation: You do not own '${targetSubdomain}'.`,
    });
  } catch (err) {
    console.error('[Tenant Ownership Middleware Error]', err);
    return next();
  }
};

module.exports = { authenticateMerchant, verifyTenantOwnership };
