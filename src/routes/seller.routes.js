const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auctionController = require('../controllers/auction.controller');
const { protect } = require('../middlewares/auth.middleware');
const sellerGuard = require('../middlewares/sellerGuard');

// All seller actions require verification and eKYC approval
router.use(protect);
router.use(sellerGuard);

// PUT /api/seller/products/:id - Update product details
router.put('/products/:id', productController.updateProduct);

// PUT /api/seller/products/:id/approve-memo - Approve memo request
router.put('/products/:id/approve-memo', productController.approveMemo);

// PUT /api/seller/auctions/:id - Update auction parameters
router.put('/auctions/:id', auctionController.updateAuction);

module.exports = router;
