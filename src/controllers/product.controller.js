const { Product, Diamond, Jewelry } = require('../models/Product');

// @desc    Create a new product listing (Diamond or Jewelry)
// @route   POST /api/products/create
// @access  Private (Seller only)
exports.createProduct = async (req, res, next) => {
  try {
    const { category, ...payload } = req.body;

    if (!category) {
      return res.status(400).json({
        status: 'error',
        message: 'Product category is required'
      });
    }

    // Verify user role is seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        status: 'error',
        message: 'Access restricted to sellers only'
      });
    }

    // Inject sellerId from authenticated user
    const sellerId = req.user._id;

    // Instantiate the correct model based on category
    let productInstance;
    
    if (category === 'Diamond' || category === 'Loose Diamond') {
      productInstance = new Diamond({
        sellerId,
        ...payload
      });
    } else if (category === 'Jewelry') {
      productInstance = new Jewelry({
        sellerId,
        ...payload
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: `Invalid category: "${category}". Category must be either "Diamond" or "Jewelry".`
      });
    }

    // Save product (Mongoose discriminator schemas handle enums/validation)
    const savedProduct = await productInstance.save();

    res.status(201).json({
      status: 'success',
      message: 'Product listed successfully',
      data: {
        product: savedProduct
      }
    });

  } catch (error) {
    // Catch and cleanly format Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    // Pass other unexpected errors to the global error handler
    next(error);
  }
};

// @desc    Get products listed by the authenticated seller
// @route   GET /api/products/seller
// @access  Private (Seller only)
exports.getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    // Find all products listed by this seller, sorted by creation date
    const products = await Product.find({ sellerId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};
