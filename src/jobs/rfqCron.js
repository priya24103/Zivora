const cron = require('node-cron');
const RFQ = require('../models/RFQ');

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
    if (item1.quotePrice !== item2.quotePrice) {
      return item1.quotePrice < item2.quotePrice;
    }
    return new Date(item1.createdAt) < new Date(item2.createdAt);
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
    });

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
          rfq.winnerSeller = winningQuote.sellerId;
          rfq.winningQuoteId = winningQuote._id;
          rfq.status = 'awarded';
          console.log(`[RFQ Cron Job] RFQ ${rfq._id} successfully awarded to Seller ${winningQuote.sellerId} (Quote: ₹${winningQuote.quotePrice})`);
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
