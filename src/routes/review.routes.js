const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/seller', reviewController.submitSellerReview);
router.get('/my-reviews', reviewController.getMyReviews);
router.get('/seller-reviews', reviewController.getSellerReviews);

module.exports = router;
