const Wishlist = require('../models/Wishlist');
const { Product } = require('../models/Product');

// @desc    Fetch the logged-in user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
      path: 'items.productId',
      select: 'title price images category status stock'
    });

    if (!wishlist) {
      return res.status(200).json({
        status: 'success',
        data: {
          wishlist: {
            userId: req.user._id,
            items: []
          }
        }
      });
    }

    // Filter out items where the product no longer exists
    wishlist.items = wishlist.items.filter(item => item.productId != null);

    res.status(200).json({
      status: 'success',
      data: {
        wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle a product in the wishlist (adds if not present, removes if present)
// @route   POST /api/wishlist/toggle
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required'
      });
    }

    // Verify product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      // Create new wishlist with the item
      wishlist = await Wishlist.create({
        userId: req.user._id,
        items: [{ productId }]
      });
    } else {
      // Check if item is already in wishlist
      const itemIndex = wishlist.items.findIndex(
        item => item.productId.toString() === productId.toString()
      );

      if (itemIndex > -1) {
        // Pull/remove item
        wishlist.items.splice(itemIndex, 1);
      } else {
        // Push/add item
        wishlist.items.push({ productId });
      }
      await wishlist.save();
    }

    // Return populated wishlist
    const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'items.productId',
      select: 'title price images category status stock'
    });

    res.status(200).json({
      status: 'success',
      message: 'Wishlist updated successfully',
      data: {
        wishlist: populatedWishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from the wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { items: { productId } } },
      { new: true }
    ).populate({
      path: 'items.productId',
      select: 'title price images category status stock'
    });

    if (!wishlist) {
      return res.status(200).json({
        status: 'success',
        data: {
          wishlist: {
            userId: req.user._id,
            items: []
          }
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Item removed from wishlist',
      data: {
        wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};
