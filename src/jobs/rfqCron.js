const cron = require('node-cron');
const RFQ = require('../models/RFQ');
const { ensureRFQOrder } = require('../utils/rfqOrderHelper');

class MinHeap {
  constructor() {
    this.heap = [];
  }

  getParentIndex(i) { return Math.floor((i - 1) / 2); }
  getLeftChildIndex(i) { return 2 * i + 1; }
  getRightChildIndex(i) { return 2 * i + 2; }

  swap(i1, i2) {
    [this.heap[i1], this.heap[i2]] = [this.heap[i2], this.heap[i1]];
  }

  compare(item1, item2) {
    // Tier 1: Price (Lowest price wins)
    if (item1.quotePrice !== item2.quotePrice) {
      return item1.quotePrice < item2.quotePrice;
    }

    // Tier 2: Seller Rating (Higher rating wins)
    const rating1 = item1.sellerId?.sellerProfile?.rating ?? item1.sellerRating ?? 0.0;
    const rating2 = item2.sellerId?.sellerProfile?.rating ?? item2.sellerRating ?? 0.0;
    if (rating1 !== rating2) {
      return rating1 > rating2;
    }

    // Tier 3: Submission Timestamp (Earliest timestamp wins)
    const t1 = item1.createdAt ? new Date(item1.createdAt).getTime() : 0;
    const t2 = item2.createdAt ? new Date(item2.createdAt).getTime() : 0;
    if (t1 !== t2) {
      return t1 < t2;
    }

    // Tier 4: Deterministic fallback (_id lexicographical comparison)
    const id1 = item1._id ? item1._id.toString() : '';
    const id2 = item2._id ? item2._id.toString() : '';
    return id1 < id2;
  }

  insert(item) {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.compare(this.heap[index], this.heap[parentIndex])) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return min;
  }

  heapifyDown(index) {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = this.getLeftChildIndex(index);
      const right = this.getRightChildIndex(index);

      if (left < length && this.compare(this.heap[left], this.heap[smallest])) {
        smallest = left;
      }

      if (right < length && this.compare(this.heap[right], this.heap[smallest])) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  size() {
    return this.heap.length;
  }
}

const processExpiredRFQs = async () => {
  try {
    const now = new Date();
    // Find RFQs with pending, submitted, or open status where the deadline has passed
    const expiredRFQs = await RFQ.find({
      status: { $in: ['pending', 'submitted', 'open'] },
      deadline: { $lte: now }
    }).populate('quotes.sellerId', 'name sellerProfile');

    if (expiredRFQs.length === 0) return;

    console.log(`[RFQ Cron Job] Found ${expiredRFQs.length} expired RFQs to process.`);

    for (const rfq of expiredRFQs) {
      if (rfq.quotes && rfq.quotes.length > 0) {
        const heap = new MinHeap();
        for (const quote of rfq.quotes) {
          heap.insert(quote);
        }

        const winningQuote = heap.extractMin();

        if (winningQuote) {
          const winnerId = winningQuote.sellerId?._id || winningQuote.sellerId;
          rfq.winnerSeller = winnerId;
          rfq.winningQuoteId = winningQuote._id;
          rfq.status = 'awarded';
          console.log(`[RFQ Cron Job] RFQ ${rfq._id} successfully awarded to Seller ${winnerId} (Quote: ₹${winningQuote.quotePrice})`);
          
          // Automatically create pending order record for the winner seller
          await ensureRFQOrder(rfq, winningQuote);
        } else {
          rfq.status = 'closed';
          console.log(`[RFQ Cron Job] RFQ ${rfq._id} set to closed.`);
        }
      } else {
        rfq.status = 'closed';
        console.log(`[RFQ Cron Job] RFQ ${rfq._id} closed with no quotes submitted.`);
      }

      await rfq.save();
    }
  } catch (error) {
    console.error('[RFQ Cron Job] Error processing expired RFQs:', error);
  }
};

const init = () => {
  // Scans for expired RFQs every minute
  cron.schedule('* * * * *', () => {
    console.log('[RFQ Cron Job] Scanning for expired RFQs...');
    processExpiredRFQs();
  });
};

module.exports = {
  init,
  MinHeap
};
