const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfq.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const buyerGuard = require('../middlewares/buyerGuard');

// Protect all routes
router.use(protect);

router.post('/create', restrictTo('buyer'), buyerGuard, rfqController.createRFQ);
router.get('/seller', restrictTo('seller'), rfqController.getPendingRFQs);
router.post('/:id/quote', restrictTo('seller'), rfqController.submitQuote);
router.delete('/:id/quote', restrictTo('seller'), rfqController.retractQuote);
router.get('/', restrictTo('buyer'), rfqController.getBuyerRFQs);
router.get('/my-requests', restrictTo('buyer'), rfqController.getBuyerRFQs);
router.post('/:rfqId/accept-quote', restrictTo('buyer'), buyerGuard, rfqController.acceptQuote);

module.exports = router;
