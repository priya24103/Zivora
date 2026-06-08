const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all payment routes
router.use(protect);

// Endpoint to create a Razorpay order
router.post('/create-order', paymentController.createOrder);

// Endpoint to verify payment and process the order
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
