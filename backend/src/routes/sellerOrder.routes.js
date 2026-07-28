const express = require('express');
const router = express.Router();
const sellerOrderController = require('../controllers/sellerOrder.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// All routes require authentication and seller role restriction
router.use(protect);
router.use(restrictTo('seller'));

router.get('/', sellerOrderController.getSellerOrders);
router.put('/:id/tracking', sellerOrderController.updateTrackingStatus);

module.exports = router;
