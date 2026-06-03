const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// POST /api/products/create - Create a product listing
// Protected by JWT auth, restricted to 'seller' role
router.post('/create', protect, restrictTo('seller'), productController.createProduct);

// GET /api/products/seller - Get seller's own listings
router.get('/seller', protect, restrictTo('seller'), productController.getSellerProducts);

// GET /api/products - Get all public products
router.get('/', productController.getAllProducts);

// GET /api/products/:id - Get a single product by ID
router.get('/:id', productController.getProductById);

// PATCH /api/products/:id/status - Update status (seller only)
router.patch('/:id/status', protect, restrictTo('seller'), productController.updateProductStatus);

// DELETE /api/products/:id - Delete product (seller only)
router.delete('/:id', protect, restrictTo('seller'), productController.deleteProduct);

module.exports = router;
