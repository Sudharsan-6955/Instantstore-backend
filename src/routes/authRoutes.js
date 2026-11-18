const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Sync Clerk user with MongoDB Atlas
router.post('/clerk-sync', authController.clerkSync);

// Get current verified session & user profile
router.get('/me', authController.getCurrentUser);

module.exports = router;
