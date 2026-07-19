const RFQ = require('../models/RFQ');
const Cart = require('../models/Cart');

// @desc    Create a Request for Quote (RFQ)
// @route   POST /api/rfq/create
// @access  Private (Buyer only)
exports.createRFQ = async (req, res, next) => {
  try {
    const { shape, carat, color, clarity, budget, deadline } = req.body;
    const buyerId = req.user._id;
    const buyerName = req.user.name;

    if (!shape || !carat || !color || !clarity || !budget || !deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'All specification fields, budget, and deadline are required'
      });
    }

    const rfq = await RFQ.create({
      buyerId,
      buyerName,
      shape,
      carat,
      color,
      clarity,
      budget,
      deadline,
      status: 'pending',
      quotes: []
    });

    res.status(201).json({
      status: 'success',
      message: 'Request for Quote submitted successfully',
      data: { rfq }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer's own RFQs
// @route   GET /api/rfq
// @access  Private (Buyer only)
exports.getBuyerRFQs = async (req, res, next) => {
  try {
    const buyerId = req.user._id;
    const rfqs = await RFQ.find({ buyerId })
      .populate('quotes.sellerId', 'name company')
      .populate('quotes.productId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: rfqs.length,
      data: { rfqs }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending RFQs for sellers to quote on
// @route   GET /api/rfq/seller
// @access  Private (Seller only)
exports.getPendingRFQs = async (req, res, next) => {
  try {
    const rfqs = await RFQ.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: rfqs.length,
      data: { rfqs }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a quote for an RFQ
// @route   POST /api/rfq/:id/quote
// @access  Private (Seller only)
exports.submitQuote = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const { quotePrice, message, productId } = req.body;
    const sellerId = req.user._id;
    const sellerName = req.user.name;

    if (!quotePrice || !message || !productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Quote price, message details, and product are required'
      });
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({
        status: 'error',
        message: 'RFQ request not found'
      });
    }

    // Add quote
    const newQuote = {
      sellerId,
      sellerName,
      productId,
      quotePrice,
      message,
      date: new Date()
    };

    rfq.quotes.push(newQuote);
    rfq.status = 'submitted';
    await rfq.save();

    res.status(200).json({
      status: 'success',
      message: 'Quote submitted successfully',
      data: { rfq }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retract a quote
// @route   DELETE /api/rfq/:id/quote
// @access  Private (Seller only)
exports.retractQuote = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const sellerId = req.user._id;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({
        status: 'error',
        message: 'RFQ request not found'
      });
    }

    rfq.quotes = rfq.quotes.filter(q => q.sellerId.toString() !== sellerId.toString());
    if (rfq.quotes.length === 0) {
      rfq.status = 'pending';
    } else {
      rfq.status = 'submitted';
    }
    await rfq.save();

    res.status(200).json({
      status: 'success',
      message: 'Quote retracted successfully',
      data: { rfq }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a quote for an RFQ
// @route   POST /api/rfq/:rfqId/accept-quote
// @access  Private (Buyer only)
exports.acceptQuote = async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({
        status: 'error',
        message: 'Quote ID is required to accept a quote'
      });
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({
        status: 'error',
        message: 'RFQ request not found'
      });
    }

    // Strict ownership validation
    if (rfq.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not own this RFQ'
      });
    }

    // Ensure status is open/submitted for acceptance
    if (rfq.status === 'completed' || rfq.status === 'closed' || rfq.status === 'awarded') {
      return res.status(400).json({
        status: 'error',
        message: 'RFQ is no longer open for quote acceptance'
      });
    }

    // Find the quote
    const quote = rfq.quotes.id(quoteId);
    if (!quote) {
      return res.status(404).json({
        status: 'error',
        message: 'Quote not found'
      });
    }

    // Mark quote as accepted
    quote.accepted = true;
    rfq.status = 'completed';
    rfq.winnerSeller = quote.sellerId;
    rfq.winningQuoteId = quote._id;

    await rfq.save();

    // Push item into the buyer's Cart
    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      cart = new Cart({ buyerId: req.user._id, items: [] });
    }

    const itemIdx = cart.items.findIndex(item => item.productId.toString() === quote.productId.toString());
    if (itemIdx === -1) {
      cart.items.push({
        productId: quote.productId,
        quantity: 1,
        priceAtAdd: quote.quotePrice
      });
    } else {
      cart.items[itemIdx].priceAtAdd = quote.quotePrice;
    }
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Quote accepted successfully. The item has been placed in your Cart.',
      data: {
        rfq,
        cartId: cart._id
      }
    });
  } catch (error) {
    next(error);
  }
};

