const cron = require('node-cron');
const { Product } = require('../models/Product');

/**
 * Checks database for expired memos and reverts products back to available.
 */
const checkExpiredMemos = async () => {
  try {
    const now = new Date();
    // Query products where status === 'memo' AND memoExpiresAt is past
    const result = await Product.updateMany(
      {
        status: 'memo',
        memoExpiresAt: { $lt: now }
      },
      {
        $set: {
          status: 'available',
          memoHeldBy: null,
          memoExpiresAt: null
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Memo Expiry Job] Reverted ${result.modifiedCount} expired memo products back to 'available'.`);
    }
  } catch (error) {
    console.error('[Memo Expiry Job] Error while checking/releasing expired memos:', error);
  }
};

/**
 * Initializes and schedules the cron task to run every hour.
 */
const init = () => {
  // Cron schedule: runs every hour ('0 * * * *')
  cron.schedule('0 * * * *', async () => {
    console.log('[Memo Expiry Job] Running hourly check for expired memos...');
    await checkExpiredMemos();
  });
};

module.exports = {
  init,
  checkExpiredMemos
};
