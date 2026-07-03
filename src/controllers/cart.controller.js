const Cart = require('../models/Cart');
const { Product } = require('../models/Product');
const Auction = require('../models/Auction');
const Order = require('../models/Order');

// @desc    Fetch the logged-in buyer's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.productId',
      select: 'title price images category status stock'
    });

    if (!cart) {
      return res.status(200).json({
        status: 'success',
        data: {
          cart: {
            buyerId: req.user._id,
            items: [],
            cartTotal: 0
          }
        }
      });
    }

    // Filter out items where the product no longer exists
    cart.items = cart.items.filter(item => item.productId != null);

    // Calculate dynamic total on the fly, overriding prices for won auctions
    let cartTotal = 0;
    for (const item of cart.items) {
      const product = item.productId;
      const completedAuction = await Auction.findOne({
        productId: product._id,
        highestBidder: req.user._id,
        status: 'completed'
      });

      if (completedAuction) {
        product.price = completedAuction.currentHighestBid;
      }
      cartTotal += product.price * item.quantity;
    }

    res.status(200).json({
      status: 'success',
      data: {
        cart: {
          _id: cart._id,
          buyerId: cart.buyerId,
          items: cart.items,
          cartTotal
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a product to the cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required'
      });
    }

    // Verify product exists and check its stock & status
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (product.listingType !== 'direct_sale') {
      return res.status(400).json({
        status: 'error',
        message: 'Only direct sale products can be added to the cart'
      });
    }

    if (product.status !== 'available' || product.stock <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Product is sold out or unavailable'
      });
    }

    // Find or create buyer's cart
    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      cart = new Cart({ buyerId: req.user._id, items: [] });
    }

    // Check if item is already in the cart
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    const qtyToAdd = Number(quantity);

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qtyToAdd;
      if (newQty > product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot add more items. Only ${product.stock} items are in stock.`
        });
      }
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].priceAtAdd = product.price;
    } else {
      if (qtyToAdd > product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot add. Only ${product.stock} items are in stock.`
        });
      }
      cart.items.push({ productId, priceAtAdd: product.price, quantity: qtyToAdd });
    }

    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'title price images category status stock'
    });

    const cartTotal = updatedCart.items.reduce((total, item) => {
      const price = item.productId ? item.productId.price : 0;
      return total + (price * item.quantity);
    }, 0);

    res.status(200).json({
      status: 'success',
      message: 'Product added to cart successfully',
      data: {
        cart: {
          _id: updatedCart._id,
          buyerId: updatedCart.buyerId,
          items: updatedCart.items,
          cartTotal
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from the cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.productId',
      select: 'title price images category status stock'
    });

    const cartTotal = updatedCart.items.reduce((total, item) => {
      const price = item.productId ? item.productId.price : 0;
      return total + (price * item.quantity);
    }, 0);

    res.status(200).json({
      status: 'success',
      message: 'Product removed from cart successfully',
      data: {
        cart: {
          _id: updatedCart._id,
          buyerId: updatedCart.buyerId,
          items: updatedCart.items,
          cartTotal
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Checkout the cart and create a pending order
// @route   POST /api/cart/checkout
// @access  Private
exports.checkout = async (req, res, next) => {
  try {
    // 1. Fetch user's cart populated with current product details
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

    // 2. Verify all items are still status: 'available' and in stock
    const orderItems = [];
    const sellerIdsSet = new Set();
    let totalAmount = 0;

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

    // 3. Generate placeholder shipping address since user will finalize it on checkout page
    const shippingAddress = {
      fullName: req.user.name || 'Valued Client',
      streetAddress: 'Pending Address Confirmation',
      city: 'Pending Checkout',
      state: 'Pending Checkout',
      zipCode: '000000',
      phoneNumber: req.user.phone || '0000000000'
    };

    // 4. Create the new pending Order document (spanning all items)
    const order = await Order.create({
      buyerId: req.user._id,
      sellerIds: Array.from(sellerIdsSet),
      items: orderItems,
      shippingAddress,
      paymentStatus: 'pending',
      orderStatus: 'processing',
      totalAmount
    });

    // 5. Clear the user's Cart document entirely
    cart.items = [];
    await cart.save();

    // 6. Return orderId
    res.status(200).json({
      status: 'success',
      message: 'Checkout initialized successfully',
      data: {
        orderId: order._id
      }
    });
  } catch (error) {
    next(error);
  }
};
