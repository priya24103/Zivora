const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { Product } = require('../models/Product');
const Auction = require('../models/Auction');

// @desc    Checkout and create a new order from buyer's cart
// @route   POST /api/orders/checkout
// @access  Private
exports.checkout = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Shipping address is required for checkout'
      });
    }

    // Validate shipping address fields
    const { fullName, streetAddress, city, state, zipCode, phoneNumber } = shippingAddress;
    if (!fullName || !streetAddress || !city || !state || !zipCode || !phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'All shipping address fields (fullName, streetAddress, city, state, zipCode, phoneNumber) are required'
      });
    }

    // 1. Fetch the user's cart populated with current product details
    const cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.productId',
      select: 'title price stock status sellerId'
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Your cart is empty'
      });
    }

    // 2. Verify all items are still in stock and available (or are won auctions)
    for (const item of cart.items) {
      const product = item.productId;
      if (!product) {
        return res.status(400).json({
          status: 'error',
          message: 'One of the items in your cart is no longer available'
        });
      }

      // Check if this is a won auction
      const completedAuction = await Auction.findOne({
        productId: product._id,
        highestBidder: req.user._id,
        status: 'completed'
      });

      if (!completedAuction) {
        if (product.status !== 'available' || product.stock < item.quantity) {
          return res.status(400).json({
            status: 'error',
            message: `Product "${product.title}" is out of stock or no longer available in the requested quantity`
          });
        }
      }
    }

    // 3. Extract unique seller IDs and prepare snapshot item details
    const sellerIdsSet = new Set();
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = item.productId;
      
      // Store sellerId (convert to string first to make unique check work in set)
      if (product.sellerId) {
        sellerIdsSet.add(product.sellerId.toString());
      }

      // Check if this is a won auction to override price
      const completedAuction = await Auction.findOne({
        productId: product._id,
        highestBidder: req.user._id,
        status: 'completed'
      });

      const priceAtPurchase = completedAuction ? completedAuction.currentHighestBid : product.price;

      orderItems.push({
        productId: product._id,
        title: product.title,
        priceAtPurchase,
        quantity: item.quantity
      });

      totalAmount += priceAtPurchase * item.quantity;
    }

    const sellerIds = Array.from(sellerIdsSet);

    // 4. Create the new Order document
    const order = await Order.create({
      buyerId: req.user._id,
      sellerIds,
      items: orderItems,
      shippingAddress: {
        fullName,
        streetAddress,
        city,
        state,
        zipCode,
        phoneNumber
      },
      paymentStatus: 'pending', // default pending
      orderStatus: 'processing', // default processing
      totalAmount
    });

    // 5. Update product stock and status safely
    for (const item of cart.items) {
      const product = item.productId;
      if (product.stock > 0) {
        product.stock -= item.quantity;
        if (product.stock <= 0) {
          product.stock = 0;
          product.status = 'sold';
        }
        await product.save();
      }
    }

    // 6. Clear user's Cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in buyer's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate({
        path: 'items.productId',
        select: 'images category'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in seller's orders
// @route   GET /api/orders/seller-orders
// @access  Private
exports.getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerIds: req.user._id })
      .populate({
        path: 'items.productId',
        select: 'images category'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by order ID
// @route   GET /api/orders/:orderId
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Ensure the user is authorized (either buyer or one of the sellers)
    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isSeller = order.sellerIds.some(id => id.toString() === req.user._id.toString());

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this order'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending order and restore items to user's cart
// @route   POST /api/orders/:orderId/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Ensure only the buyer can cancel their pending order
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this order'
      });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be cancelled'
      });
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.paymentStatus = 'failed';
    await order.save();

    // Restore items to user's Cart
    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      cart = new Cart({ buyerId: req.user._id, items: [] });
    }

    for (const item of order.items) {
      const itemIndex = cart.items.findIndex(
        cItem => cItem.productId.toString() === item.productId.toString()
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += item.quantity;
      } else {
        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtPurchase
        });
      }
    }

    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully and items restored to cart'
    });
  } catch (error) {
    next(error);
  }
};
