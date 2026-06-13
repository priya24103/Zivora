const Auction = require('../models/Auction');
const User = require('../models/User');

const activeCooldowns = new Map(); // key: auctionId (string), value: expiration timestamp (number)

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room
    socket.on('join_auction', async ({ auctionId, userId }) => {
      try {
        if (!auctionId || !userId) {
          socket.emit('error', { message: 'Auction ID and User ID are required to join' });
          return;
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) {
          socket.emit('error', { message: 'Auction not found' });
          return;
        }

        // Verify registration or host (seller) permissions
        const isRegistered = auction.registeredBuyers.some(
          (buyerId) => buyerId.toString() === userId.toString()
        );
        const isHost = auction.sellerId.toString() === userId.toString();

        if (!isRegistered && !isHost) {
          socket.emit('error', { message: 'Access denied. You must be registered or be the auction owner to join.' });
          socket.disconnect(true);
          return;
        }

        socket.join(auctionId.toString());
        console.log(`User ${userId} joined auction room ${auctionId}`);
        socket.emit('joined_room', { auctionId, status: 'success' });
      } catch (error) {
        console.error('Error joining auction:', error);
        socket.emit('error', { message: 'Failed to join auction room' });
      }
    });

    // Place bid
    socket.on('place_bid', async ({ auctionId, userId, amount }) => {
      try {
        if (!auctionId || !userId || !amount) {
          socket.emit('error', { message: 'Auction ID, User ID, and bid amount are required' });
          return;
        }

        // Check backend cooldown
        const cooldownEnd = activeCooldowns.get(auctionId.toString());
        if (cooldownEnd && Date.now() < cooldownEnd) {
          socket.emit('error', { message: 'Bidding is currently locked. Evaluating bids.' });
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) {
          socket.emit('error', { message: 'Auction not found' });
          return;
        }

        // Verify registration
        const isRegistered = auction.registeredBuyers.some(
          (buyerId) => buyerId.toString() === userId.toString()
        );
        if (!isRegistered) {
          socket.emit('error', { message: 'Access denied. You must be registered for this auction to place a bid.' });
          return;
        }

        const now = new Date();
        if (now < new Date(auction.startTime)) {
          socket.emit('bid_error', { message: 'The auction has not started yet. Bidding opens when registration closes.' });
          return;
        }

        if (auction.status === 'pending') {
          auction.status = 'active';
          await auction.save();
        }

        if (auction.status !== 'active' || new Date(auction.endTime) < now) {
          socket.emit('error', { message: 'This auction has ended or is not active' });
          return;
        }

        const minIncrement = auction.minIncrement || 100;
        const minRequired = auction.currentHighestBid + minIncrement;
        if (Number(amount) < minRequired) {
          socket.emit('error', { message: `Bid amount must be at least ₹${minRequired.toLocaleString('en-IN')}` });
          return;
        }

        // Atomic update
        const newBid = {
          bidderId: userId,
          bidderName: user.name,
          amount: Number(amount),
          timestamp: new Date()
        };

        const updatedAuction = await Auction.findOneAndUpdate(
          {
            _id: auctionId,
            currentHighestBid: { $lt: Number(amount) },
            status: 'active',
            endTime: { $gt: new Date() }
          },
          {
            $set: {
              currentHighestBid: Number(amount),
              highestBidder: userId
            },
            $inc: { bidsCount: 1 },
            $push: { bids: newBid }
          },
          { new: true }
        );

        if (!updatedAuction) {
          socket.emit('error', { message: 'Bid failed. Someone may have placed a higher bid.' });
          return;
        }

        // Successful bid: start cooldown
        const cooldownTime = 5000;
        activeCooldowns.set(auctionId.toString(), Date.now() + cooldownTime);
        setTimeout(() => {
          activeCooldowns.delete(auctionId.toString());
        }, cooldownTime);

        // Emit new_bid to whole room
        io.to(auctionId.toString()).emit('new_bid', {
          auctionId,
          amount: Number(amount),
          bidderName: user.name,
          bidderId: user._id,
          timestamp: newBid.timestamp,
          currentHighestBid: Number(amount),
          bidsCount: updatedAuction.bidsCount,
          bids: updatedAuction.bids
        });

        // Emit bid_cooldown to whole room
        io.to(auctionId.toString()).emit('bid_cooldown', {
          auctionId,
          duration: 5
        });

      } catch (error) {
        console.error('Error placing bid:', error);
        socket.emit('error', { message: 'An error occurred while placing bid' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
