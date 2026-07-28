require('dotenv').config({ path: 'd:/Zivora branch/backend/Zivora-backend/.env' });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const RFQ = require('../src/models/RFQ');
const Order = require('../src/models/Order');
const { ensureRFQOrder } = require('../src/utils/rfqOrderHelper');

async function reconcileAllAwardedRFQs() {
  try {
    await connectDB();
    console.log('Connected to DB for RFQ reconciliation.');

    const awardedRFQs = await RFQ.find({
      status: { $in: ['awarded', 'completed'] }
    });

    console.log(`Found ${awardedRFQs.length} awarded/completed RFQs in DB.`);

    for (const rfq of awardedRFQs) {
      let winningQuote = rfq.winningQuoteId ? rfq.quotes.id(rfq.winningQuoteId) : null;
      if (!winningQuote) {
        winningQuote = rfq.quotes.find(q => q.accepted);
      }
      if (!winningQuote && rfq.quotes.length > 0) {
        winningQuote = rfq.quotes[0];
      }

      if (winningQuote) {
        const order = await ensureRFQOrder(rfq, winningQuote);
        console.log(`RFQ ${rfq._id}: reconciled order ID -> ${order ? order._id : 'N/A'}`);
      } else {
        console.log(`RFQ ${rfq._id} has no quotes.`);
      }
    }

    console.log('RFQ Reconciliation complete.');
    process.exit(0);
  } catch (err) {
    console.error('Reconciliation error:', err);
    process.exit(1);
  }
}

reconcileAllAwardedRFQs();
