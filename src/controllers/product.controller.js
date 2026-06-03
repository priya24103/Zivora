const mongoose = require('mongoose');
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

// @desc    Get all available products (public feed, search, and filter)
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, shape, sort, search, q } = req.query;
    
    // Status defaults to 'available' (which includes both available and on_memo products)
    const status = req.query.status || 'available';
    const filter = {};
    if (status === 'available') {
      filter.status = { $in: ['available', 'on_memo'] };
    } else if (status !== 'all') {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    // Price Filtering: support price[min]/price[max], priceMin/priceMax, price: { min, max }
    const priceMin = req.query.priceMin || req.query['price[min]'] || (req.query.price && req.query.price.min);
    const priceMax = req.query.priceMax || req.query['price[max]'] || (req.query.price && req.query.price.max);
    
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    // Text search: matches title or description
    const searchText = search || q;
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // Diamond Specific Filters
    if (category === 'Diamond') {
      if (shape) filter.shape = shape;
      if (req.query.color) filter.color = req.query.color;
      if (req.query.clarity) filter.clarity = req.query.clarity;

      const caratMin = req.query.caratMin || req.query['carat[min]'] || (req.query.carat && req.query.carat.min);
      const caratMax = req.query.caratMax || req.query['carat[max]'] || (req.query.carat && req.query.carat.max);

      if (caratMin || caratMax) {
        filter.carat = {};
        if (caratMin) filter.carat.$gte = Number(caratMin);
        if (caratMax) filter.carat.$lte = Number(caratMax);
      }
    }

    // Jewelry Specific Filters
    if (category === 'Jewelry') {
      if (req.query.metalType) filter.metalType = req.query.metalType;
      if (req.query.jewelryType) filter.jewelryType = req.query.jewelryType;
      if (req.query.gender) filter.gender = req.query.gender;
    }

    // Generic fallback: if category is not specified but search parameters are present, filter by them
    if (!category) {
      if (shape) filter.shape = shape;
      if (req.query.color) filter.color = req.query.color;
      if (req.query.clarity) filter.clarity = req.query.clarity;

      const caratMin = req.query.caratMin || req.query['carat[min]'] || (req.query.carat && req.query.carat.min);
      const caratMax = req.query.caratMax || req.query['carat[max]'] || (req.query.carat && req.query.carat.max);
      if (caratMin || caratMax) {
        filter.carat = {};
        if (caratMin) filter.carat.$gte = Number(caratMin);
        if (caratMax) filter.carat.$lte = Number(caratMax);
      }

      if (req.query.metalType) filter.metalType = req.query.metalType;
      if (req.query.jewelryType) filter.jewelryType = req.query.jewelryType;
      if (req.query.gender) filter.gender = req.query.gender;
    }

    // Sorting
    let sortOptions = {};
    if (sort) {
      if (sort === 'price_asc') {
        sortOptions.price = 1;
      } else if (sort === 'price_desc') {
        sortOptions.price = -1;
      } else if (sort === 'newest') {
        sortOptions.createdAt = -1;
      } else if (sort === 'oldest') {
        sortOptions.createdAt = 1;
      } else {
        const parts = sort.split(',');
        parts.forEach(part => {
          if (part.startsWith('-')) {
            sortOptions[part.substring(1)] = -1;
          } else {
            sortOptions[part] = 1;
          }
        });
      }
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('sellerId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single product listing by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate Mongoose ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id).populate('sellerId', 'name createdAt');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product status
// @route   PATCH /api/products/:id/status
// @access  Private (Seller only)
exports.updateProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or not authorized'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, sellerId: req.user._id });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or not authorized'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


