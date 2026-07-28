const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

// All wishlist actions require user authentication
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

module.exports = router;
