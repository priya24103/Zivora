const RFQ = require('../models/RFQ');

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
    const rfqs = await RFQ.find({ buyerId }).sort({ createdAt: -1 });

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

