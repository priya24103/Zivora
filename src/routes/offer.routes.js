const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offer.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all direct negotiation routes
router.use(protect);

// Endpoint registration
router.post('/create', offerController.createOffer);
router.get('/inbox', offerController.getInbox);
router.put('/:id/action', offerController.handleOfferAction);

module.exports = router;
