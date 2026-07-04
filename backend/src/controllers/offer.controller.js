const Offer = require('../models/Offer');
const { Product } = require('../models/Product');
const User = require('../models/User');

// @desc    Create a new direct negotiation offer
// @route   POST /api/offers/create
// @access  Private
exports.createOffer = async (req, res, next) => {
  try {
    const { productId, initialAmount, message } = req.body;

    if (!productId || !initialAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID and initial offer amount are required.'
      });
    }

    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only buyers can make an initial negotiation offer.'
      });
    }

    // Look up product to verify existence and get sellerId
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found.'
      });
    }

    if (product.status !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'This product is no longer available for negotiation.'
      });
    }

    // Prevent buyers from buying their own listed products (in case role is hybrid)
    if (product.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot make an offer on your own product.'
      });
    }

    // Check if there is already an active offer thread between this buyer and product
    const existingOffer = await Offer.findOne({
      productId,
      buyerId: req.user._id,
      status: { $in: ['pending_seller', 'pending_buyer'] }
    });

    if (existingOffer) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active negotiation thread for this product.',
        data: { offerId: existingOffer._id }
      });
    }

    // Create the new offer document
    const newOffer = new Offer({
      productId,
      buyerId: req.user._id,
      sellerId: product.sellerId,
      status: 'pending_seller',
      history: [
        {
          senderType: 'buyer',
          offerAmount: Number(initialAmount),
          message: message || 'Initial offer submitted.',
          timestamp: new Date()
        }
      ]
    });

    await newOffer.save();

    res.status(201).json({
      status: 'success',
      message: 'Offer created successfully',
      data: {
        offer: newOffer
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get negotiation inbox list for the logged-in user
// @route   GET /api/offers/inbox
// @access  Private
exports.getInbox = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'buyer') {
      query.buyerId = req.user._id;
    } else if (req.user.role === 'seller') {
      query.sellerId = req.user._id;
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid user role for viewing offers inbox.'
      });
    }

    // Find and populate related schemas
    const offers = await Offer.find(query)
      .populate({
        path: 'productId',
        select: 'title price images category status stock cut carat clarity color shapes'
      })
      .populate('buyerId', 'name email phone')
      .populate('sellerId', 'name email phone')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: offers.length,
      data: {
        offers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Master action handler (Accept / Reject / Counter-Offer)
// @route   PUT /api/offers/:id/action
// @access  Private
exports.handleOfferAction = async (req, res, next) => {
  try {
    const { action, newAmount, message } = req.body;
    const { id } = req.params;

    if (!action || !['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid action (accept, reject, counter) is required.'
      });
    }

    // Find offer
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        status: 'error',
        message: 'Offer thread not found.'
      });
    }

    const isBuyer = offer.buyerId.toString() === req.user._id.toString();
    const isSeller = offer.sellerId.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to perform actions on this offer.'
      });
    }

    // Perform state checks
    if (offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: `This negotiation has already been marked as ${offer.status}.`
      });
    }

    // Validate that the user is acting on their turn
    if (offer.status === 'pending_seller' && !isSeller) {
      return res.status(400).json({
        status: 'error',
        message: 'Awaiting seller response. You cannot act on this offer currently.'
      });
    }

    if (offer.status === 'pending_buyer' && !isBuyer) {
      return res.status(400).json({
        status: 'error',
        message: 'Awaiting buyer response. You cannot act on this offer currently.'
      });
    }

    const senderType = isBuyer ? 'buyer' : 'seller';

    if (action === 'accept') {
      offer.status = 'accepted';
      // Optionally log who accepted it in history
      offer.history.push({
        senderType,
        offerAmount: offer.currentOfferAmount,
        message: message || `Offer accepted by ${senderType}.`,
        timestamp: new Date()
      });
    } else if (action === 'reject') {
      offer.status = 'rejected';
      offer.history.push({
        senderType,
        offerAmount: offer.currentOfferAmount,
        message: message || `Offer rejected by ${senderType}.`,
        timestamp: new Date()
      });
    } else if (action === 'counter') {
      if (!newAmount || Number(newAmount) <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'A valid positive counter-offer amount is required.'
        });
      }

      // Add counter offer details to history
      offer.history.push({
        senderType,
        offerAmount: Number(newAmount),
        message: message || `Counter-offer proposed.`,
        timestamp: new Date()
      });

      // Flip status appropriately
      offer.status = senderType === 'buyer' ? 'pending_seller' : 'pending_buyer';
    }

    await offer.save();

    // Populate the response nicely before returning
    const updatedOffer = await Offer.findById(offer._id)
      .populate({
        path: 'productId',
        select: 'title price images category status stock cut carat clarity color'
      })
      .populate('buyerId', 'name email phone')
      .populate('sellerId', 'name email phone');

    res.status(200).json({
      status: 'success',
      message: `Offer successfully processed with action: ${action}`,
      data: {
        offer: updatedOffer
      }
    });
  } catch (error) {
    next(error);
  }
};
