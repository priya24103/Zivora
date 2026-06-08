const Razorpay = require('razorpay');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { Product } = require('../models/Product');

// @desc    Create a new Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({
        status: 'error',
        message: 'Razorpay keys are not configured on the server.'
      });
    }

    // 1. Fetch the user's cart populated with current product details
    const cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.productId',
      select: 'title price stock status'
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Your cart is empty'
      });
    }

    // Filter out items where the product no longer exists
    cart.items = cart.items.filter(item => item.productId != null);

    if (cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Your cart has no valid products'
      });
    }

    // 2. Calculate the exact total amount on the backend
    let totalAmount = 0;
    for (const item of cart.items) {
      const product = item.productId;
      if (product.status !== 'available' || product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Product "${product.title}" is out of stock or no longer available`
        });
      }
      totalAmount += product.price * item.quantity;
    }

    // Convert amount to paise (INR's smallest currency unit)
    const amountInPaise = Math.round(totalAmount * 100);

    // 3. Instantiate the Razorpay SDK
    const instance = new Razorpay({ key_id, key_secret });

    // Generate a unique receipt ID (must be <= 40 characters for Razorpay validation)
    const receipt = `rcpt_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

    // 4. Create the Razorpay Order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt
    };

    const razorpayOrder = await instance.orders.create(options);

    // 5. Return order details to client
    res.status(200).json({
      status: 'success',
      data: {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: key_id
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    next(error);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required Razorpay payment fields.'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Shipping address is required for checkout verification.'
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

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        status: 'error',
        message: 'Razorpay keys are not configured on the server.'
      });
    }

    // Generate the HMAC SHA256 signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    // Compare signature
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed'
      });
    }

    // Fetch the user's cart populated with current product details
    const cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.productId',
      select: 'title price stock status sellerId'
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty. Cannot process payment verification.'
      });
    }

    // Verify all items are still in stock and available
    for (const item of cart.items) {
      const product = item.productId;
      if (!product) {
        return res.status(400).json({
          status: 'error',
          message: 'One of the items in your cart is no longer available'
        });
      }

      if (product.status !== 'available' || product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Product "${product.title}" is out of stock or no longer available`
        });
      }
    }

    // Extract unique seller IDs and prepare snapshot item details
    const sellerIdsSet = new Set();
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = item.productId;
      
      if (product.sellerId) {
        sellerIdsSet.add(product.sellerId.toString());
      }

      orderItems.push({
        productId: product._id,
        title: product.title,
        priceAtPurchase: product.price,
        quantity: item.quantity
      });

      totalAmount += product.price * item.quantity;
    }

    const sellerIds = Array.from(sellerIdsSet);

    // Create the new Order document with paymentStatus = 'paid'
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
      paymentStatus: 'paid',
      orderStatus: 'processing',
      totalAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });

    // Update product stock and status
    for (const item of cart.items) {
      const product = item.productId;
      product.stock -= item.quantity;
      if (product.stock === 0) {
        product.status = 'sold';
      }
      await product.save();
    }

    // Clear user's Cart
    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment verified and order finalized successfully',
      data: {
        orderId: order._id
      }
    });

  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    next(error);
  }
};
