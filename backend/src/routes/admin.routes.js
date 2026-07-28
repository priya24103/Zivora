const express = require('express');
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middlewares/adminAuth.middleware');

const router = express.Router();

// Public route for admin login
router.post('/login', adminController.login);

// Protected routes (admin authorization required)
router.get('/stats', isAdmin, adminController.getStats);
router.get('/analytics', isAdmin, adminController.getAnalytics);
router.get('/users', isAdmin, adminController.getUsers);
router.put('/users/:id/status', isAdmin, adminController.toggleUserStatus);
router.get('/products', isAdmin, adminController.getProducts);
router.get('/auctions', isAdmin, adminController.getAuctions);
router.get('/rfqs', isAdmin, adminController.getRfqs);
router.get('/kyc-requests', isAdmin, adminController.getKycRequests);
router.put('/kyc/:userId/action', isAdmin, adminController.takeKycAction);

module.exports = router;
