const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// POST /api/products/create - Create a product listing
// Protected by JWT auth, restricted to 'seller' role
router.post('/create', protect, restrictTo('seller'), productController.createProduct);

// GET /api/products/seller - Get seller's own listings
router.get('/seller', protect, restrictTo('seller'), productController.getSellerProducts);

module.exports = router;
