require('dotenv').config();
const mongoose = require('mongoose');
const Auction = require('../src/models/Auction');
const { Product } = require('../src/models/Product');

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB successfully!');

    // Find all live (active) auctions
    const liveAuctions = await Auction.find({ status: 'active' });
    console.log(`Found ${liveAuctions.length} live auctions.`);

    if (liveAuctions.length > 0) {
      const productIds = liveAuctions.map(a => a.productId).filter(Boolean);
      
      if (productIds.length > 0) {
        console.log(`Restoring product statuses for ${productIds.length} products to 'available'...`);
        const updateResult = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { status: 'available' } }
        );
        console.log(`Products updated:`, updateResult);
      }

      console.log('Deleting live auctions...');
      const deleteResult = await Auction.deleteMany({ status: 'active' });
      console.log(`Auctions deleted:`, deleteResult);
    } else {
      console.log('No live auctions found to delete.');
    }

  } catch (error) {
    console.error('Error running delete script:');
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

run();
