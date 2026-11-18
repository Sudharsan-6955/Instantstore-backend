const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'instantstore_super_secret_jwt_key_2026';

// Clerk-Native Authentication Sync
// Dual-sync: Authenticates via Clerk & stores persistent record in MongoDB Atlas 'users' collection
exports.clerkSync = async (req, res) => {
  try {
    const { clerkId, email, name, avatar, subdomain } = req.body;

    if (!email && !clerkId) {
      return res.status(400).json({ success: false, message: 'Clerk credentials required.' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();

    // Check if this Clerk user already owns any tenant store in MongoDB Atlas
    const searchConditions = [];
    if (clerkId) searchConditions.push({ ownerClerkId: clerkId });
    if (cleanEmail) searchConditions.push({ ownerEmail: cleanEmail });
    if (subdomain) searchConditions.push({ subdomain: subdomain.trim().toLowerCase() });

    let tenant = null;
    if (searchConditions.length > 0) {
      tenant = await Tenant.findOne({ $or: searchConditions }).select('-ownerPassword');
    }

    // Issue platform JWT signed with Clerk credentials & store subdomain
    const activeSubdomain = tenant ? tenant.subdomain : (subdomain || null);

    // Persist and Upsert User into MongoDB Atlas 'users' collection
    const userConditions = [];
    if (clerkId) userConditions.push({ clerkId });
    if (cleanEmail) userConditions.push({ email: cleanEmail });

    let atlasUser = null;
    if (userConditions.length > 0) {
      atlasUser = await User.findOneAndUpdate(
        { $or: userConditions },
        {
          $set: {
            clerkId: clerkId || undefined,
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            avatar: avatar || '',
            tenantSubdomain: activeSubdomain,
            authProvider: 'clerk',
            lastLoginAt: new Date(),
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const token = jwt.sign(
      {
        id: atlasUser?._id,
        clerkId: clerkId || '',
        email: cleanEmail,
        name: name || '',
        subdomain: activeSubdomain,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Clerk user session synchronized and stored in MongoDB Atlas!',
      token,
      user: {
        _id: atlasUser?._id,
        clerkId,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        avatar: avatar || '',
        tenantSubdomain: activeSubdomain,
      },
      tenant,
    });
  } catch (error) {
    console.error('[Clerk Sync Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Current User Profile & Token Verification
exports.getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No authorization token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch tenant store owned by this Clerk user if available
    const searchConditions = [];
    if (decoded.clerkId) searchConditions.push({ ownerClerkId: decoded.clerkId });
    if (decoded.email) searchConditions.push({ ownerEmail: decoded.email.toLowerCase() });
    if (decoded.subdomain) searchConditions.push({ subdomain: decoded.subdomain.toLowerCase() });

    let tenant = null;
    if (searchConditions.length > 0) {
      tenant = await Tenant.findOne({ $or: searchConditions }).select('-ownerPassword');
    }

    return res.status(200).json({
      success: true,
      user: {
        clerkId: decoded.clerkId,
        email: decoded.email,
        name: decoded.name,
        tenantSubdomain: tenant ? tenant.subdomain : decoded.subdomain,
      },
      tenant,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
