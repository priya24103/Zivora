const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all cart routes
router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.delete('/remove/:productId', cartController.removeFromCart);
router.put('/update-quantity', cartController.updateQuantity);
router.post('/checkout', cartController.checkout);

module.exports = router;
