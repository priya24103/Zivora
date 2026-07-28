require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Auction = require('../src/models/Auction');
const { getAnalytics } = require('../src/controllers/admin.controller');

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zivora');
    console.log('Connected!');

    // Fetch buyer/seller to attach to orders
    let buyer = await User.findOne({ role: 'buyer' });
    let seller = await User.findOne({ role: 'seller' });

    // Create mock order records to aggregate over
    console.log('Inserting mock orders to verify aggregation...');
    const order1 = await Order.create({
      buyerId: buyer ? buyer._id : new mongoose.Types.ObjectId(),
      sellerIds: [seller ? seller._id : new mongoose.Types.ObjectId()],
      items: [{ productId: new mongoose.Types.ObjectId(), title: 'Verified Stone A', priceAtPurchase: 150000, quantity: 1 }],
      shippingAddress: { fullName: 'Priya Patel', streetAddress: '123 Fine St', city: 'Mumbai', state: 'MH', zipCode: '400001', phoneNumber: '1234567890' },
      paymentStatus: 'paid',
      totalAmount: 150000,
      createdAt: new Date()
    });

    const order2 = await Order.create({
      buyerId: buyer ? buyer._id : new mongoose.Types.ObjectId(),
      sellerIds: [seller ? seller._id : new mongoose.Types.ObjectId()],
      items: [{ productId: new mongoose.Types.ObjectId(), title: 'Verified Stone B', priceAtPurchase: 180000, quantity: 1 }],
      shippingAddress: { fullName: 'Priya Patel', streetAddress: '123 Fine St', city: 'Mumbai', state: 'MH', zipCode: '400001', phoneNumber: '1234567890' },
      paymentStatus: 'paid',
      totalAmount: 180000,
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 2)) // 2 months ago
    });

    // An unpaid order (should be matched out of revenue aggregations)
    const order3 = await Order.create({
      buyerId: buyer ? buyer._id : new mongoose.Types.ObjectId(),
      sellerIds: [seller ? seller._id : new mongoose.Types.ObjectId()],
      items: [{ productId: new mongoose.Types.ObjectId(), title: 'Unpaid Stone C', priceAtPurchase: 100000, quantity: 1 }],
      shippingAddress: { fullName: 'Priya Patel', streetAddress: '123 Fine St', city: 'Mumbai', state: 'MH', zipCode: '400001', phoneNumber: '1234567890' },
      paymentStatus: 'pending',
      totalAmount: 100000,
      createdAt: new Date()
    });

    console.log('Simulating Admin Analytics API call...');
    const req = {};
    let jsonResult = null;
    const res = {
      status: (code) => {
        return {
          json: (data) => {
            jsonResult = data;
          }
        };
      }
    };

    await getAnalytics(req, res, (err) => console.error('Next error:', err));

    console.log('Analytics Controller Output:');
    console.log(JSON.stringify(jsonResult, null, 2));

    if (jsonResult.status !== 'success') {
      throw new Error('Analytics fetch status was not success');
    }

    const { totalRevenue, userCounts, activeAuctions, salesChartData } = jsonResult.data;

    console.log('Asserting values...');
    console.log('Total Platform Revenue retrieved:', totalRevenue);
    if (totalRevenue < 330000) {
      throw new Error('Total Revenue sum aggregation did not match expected value!');
    }

    console.log('User counts summary:', userCounts);
    if (userCounts.total <= 0) {
      throw new Error('User count aggregation failed!');
    }

    console.log('Sales Chart length:', salesChartData.length);
    if (salesChartData.length !== 6) {
      throw new Error('Sales chart chronology did not span exactly 6 points!');
    }

    console.log('Chart data items:', salesChartData);

    // Verify chronologically non-empty months filled correctly
    const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short' });
    const currentYearShort = new Date().getFullYear().toString().substring(2);
    const expectedCurrentMonthName = `${currentMonthLabel} ${currentYearShort}`;

    const currentMonthDataPoint = salesChartData.find(item => item.name === expectedCurrentMonthName);
    console.log(`Current Month (${expectedCurrentMonthName}) Revenue aggregated:`, currentMonthDataPoint.revenue);

    if (currentMonthDataPoint.revenue < 150000) {
      throw new Error('Paid order matching failed to include current month revenue!');
    }

    console.log('All analytics integration test checks passed!');

    // Cleanup
    await Order.findByIdAndDelete(order1._id);
    await Order.findByIdAndDelete(order2._id);
    await Order.findByIdAndDelete(order3._id);
    console.log('Database references cleaned up.');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Done.');
  }
};

runTest();
