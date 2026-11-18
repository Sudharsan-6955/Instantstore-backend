const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateMerchant, verifyTenantOwnership } = require('../middleware/auth');

// Public storefront checkout endpoint (creates order strictly bound to tenant)
router.post('/:subdomain/checkout', orderController.createOrder);

// Protected merchant studio endpoints
router.get('/:subdomain', authenticateMerchant, verifyTenantOwnership, orderController.getTenantOrders);
router.patch('/:subdomain/:id/status', authenticateMerchant, verifyTenantOwnership, orderController.updateOrderStatus);

module.exports = router;
