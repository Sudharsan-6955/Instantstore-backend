const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateMerchant, verifyTenantOwnership } = require('../middleware/auth');

// Public endpoints
router.get('/', tenantController.listTenants);
router.get('/check-slug/:subdomain', tenantController.checkSubdomainAvailability);
router.get('/user/:identifier', tenantController.getUserTenants);
router.post('/provision', tenantController.provisionTenant);
router.post('/login', tenantController.merchantLogin);

// Storefront dynamic hydration (zero-build)
router.get('/:subdomain/storefront', tenantController.getTenantStorefront);

// Protected merchant studio endpoints
router.put('/:subdomain/theme', authenticateMerchant, verifyTenantOwnership, tenantController.updateTenantTheme);
router.delete('/:subdomain', authenticateMerchant, tenantController.deleteTenant);

module.exports = router;
