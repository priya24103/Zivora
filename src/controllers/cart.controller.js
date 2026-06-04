const Cart = require('../models/Cart');
const { Product } = require('../models/Product');

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

    // Calculate dynamic total on the fly
    const cartTotal = cart.items.reduce((total, item) => {
      return total + (item.productId.price * item.quantity);
    }, 0);

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
    } else {
      if (qtyToAdd > product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot add. Only ${product.stock} items are in stock.`
        });
      }
      cart.items.push({ productId, quantity: qtyToAdd });
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
