const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateMerchant, verifyTenantOwnership } = require('../middleware/auth');

// Public storefront catalog query (scoped to tenant subdomain)
router.get('/:subdomain', productController.getProducts);

// Protected Merchant Studio catalog management
router.post('/:subdomain', authenticateMerchant, verifyTenantOwnership, productController.createProduct);
router.put('/:subdomain/:id', authenticateMerchant, verifyTenantOwnership, productController.updateProduct);
router.delete('/:subdomain/:id', authenticateMerchant, verifyTenantOwnership, productController.deleteProduct);

module.exports = router;
