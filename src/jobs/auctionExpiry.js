const cron = require('node-cron');
const Auction = require('../models/Auction');
const { Product } = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');

/**
 * Processes a single expired auction.
 * Marks the auction as completed and handles winner creation or product availability.
 * @param {Object} auction - The Auction Mongoose document.
 */
const processSingleAuction = async (auction) => {
  // Step A: Atomically mark the auction as completed to avoid double processing or race conditions
  const updatedAuction = await Auction.findOneAndUpdate(
    { _id: auction._id, status: 'active' },
    { status: 'completed' },
    { new: true }
  );

  if (!updatedAuction) {
    // If status was already updated to completed/cancelled by another thread, skip it.
    return;
  }

  console.log(`[Auction Expiry Job] Processing expired auction: ${auction._id}`);

  // Step B: Determine Winner
  if (auction.highestBidder) {
    // A bidder won the auction
    const product = await Product.findById(auction.productId);
    if (!product) {
      throw new Error(`Product ${auction.productId} associated with auction ${auction._id} not found.`);
    }

    // Retrieve winner details to populate Order's shippingAddress fullName & phone
    const winner = await User.findById(auction.highestBidder);
    if (!winner) {
      throw new Error(`Highest bidder user ${auction.highestBidder} for auction ${auction._id} not found.`);
    }

    // Update the associated Product: status to 'sold' and stock to 0
    product.status = 'sold';
    product.stock = 0;
    await product.save();

    // Create a new pending Order document mapping winner details & product snapshot
    const order = await Order.create({
      buyerId: auction.highestBidder,
      sellerIds: [auction.sellerId || product.sellerId],
      items: [
        {
          productId: auction.productId,
          title: product.title,
          priceAtPurchase: auction.currentHighestBid,
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: winner.name || 'Auction Winner',
        streetAddress: 'Pending Address Confirmation',
        city: 'Pending Checkout',
        state: 'Pending Checkout',
        zipCode: '000000',
        phoneNumber: winner.phone || '0000000000'
      },
      paymentStatus: 'pending',
      orderStatus: 'processing',
      totalAmount: auction.currentHighestBid
    });

    console.log(`[Auction Expiry Job] Declared winner User ${auction.highestBidder} for auction ${auction._id}. Created pending Order ${order._id}.`);

    // Step C: Auto-add to Winner's Cart
    let cart = await Cart.findOne({ buyerId: auction.highestBidder });
    if (!cart) {
      cart = new Cart({ buyerId: auction.highestBidder, items: [] });
    }

    const itemExists = cart.items.some(
      (item) => item.productId.toString() === auction.productId.toString()
    );

    if (!itemExists) {
      cart.items.push({ productId: auction.productId, quantity: 1 });
      await cart.save();
      console.log(`[Auction Expiry Job] Automatically added product ${auction.productId} to winner ${auction.highestBidder}'s cart.`);
    }
  } else {
    // Zero bids: Leave Product status as 'available' (it's already available).
    console.log(`[Auction Expiry Job] Auction ${auction._id} ended with no bids. Product ${auction.productId} remains available.`);
  }
};

/**
 * Queries and processes all active, expired auctions.
 */
const processExpiredAuctions = async () => {
  try {
    const now = new Date();
    // Query active auctions where endTime <= current time
    const expiredAuctions = await Auction.find({
      status: 'active',
      endTime: { $lte: now }
    });

    if (expiredAuctions.length === 0) {
      return;
    }

    console.log(`[Auction Expiry Job] Found ${expiredAuctions.length} expired active auctions to process.`);

    // Process all expired auctions concurrently using Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(
      expiredAuctions.map((auction) => processSingleAuction(auction))
    );

    // Analyze outcomes
    results.forEach((res, idx) => {
      const auctionId = expiredAuctions[idx]._id;
      if (res.status === 'rejected') {
        console.error(`[Auction Expiry Job] Failed to process auction ${auctionId}:`, res.reason);
      } else {
        console.log(`[Auction Expiry Job] Finished processing auction ${auctionId}`);
      }
    });
  } catch (error) {
    console.error('[Auction Expiry Job] Error processing expired auctions:', error);
  }
};

/**
 * Initializes and schedules the node-cron task to run every minute.
 */
const init = () => {
  // Schedule to run every minute
  cron.schedule('* * * * *', async () => {
    console.log('[Auction Expiry Job] Scanning for expired live auctions...');
    await processExpiredAuctions();
  });
};

module.exports = {
  init,
  processSingleAuction,
  processExpiredAuctions
};
