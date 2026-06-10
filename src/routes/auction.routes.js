const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Protect all routes
router.use(protect);

router.get('/dashboard', auctionController.getAuctionDashboard);
router.post('/create', restrictTo('seller'), auctionController.createAuction);
router.get('/seller', restrictTo('seller'), auctionController.getSellerAuctions);
router.get('/my-bids', restrictTo('buyer'), auctionController.getMyBids);
router.get('/:id', auctionController.getAuctionById);
router.post('/:id/register', restrictTo('buyer'), auctionController.registerForAuction);
router.post('/:id/bid', restrictTo('buyer'), auctionController.placeBid);
router.get('/', auctionController.getActiveAuctions);

module.exports = router;
