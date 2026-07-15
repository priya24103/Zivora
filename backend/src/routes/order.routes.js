const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Protect all order routes
router.use(protect);

router.post('/checkout', orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);
router.get('/seller-orders', orderController.getSellerOrders);
router.get('/:orderId/invoice', orderController.getInvoice);
router.put('/:orderId/tracking', restrictTo('seller', 'admin'), orderController.updateTrackingStatus);
router.get('/:orderId', orderController.getOrderById);
router.post('/:orderId/cancel', orderController.cancelOrder);

module.exports = router;
