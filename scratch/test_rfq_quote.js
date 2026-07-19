require('dotenv').config();
const mongoose = require('mongoose');
const RFQ = require('../src/models/RFQ');
const Cart = require('../src/models/Cart');
const User = require('../src/models/User');
const { Product } = require('../src/models/Product');
const { acceptQuote, getBuyerRFQs } = require('../src/controllers/rfq.controller');
const { getCart } = require('../src/controllers/cart.controller');

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zivora');
    console.log('Connected!');

    // 1. Fetch or create users
    let buyer = await User.findOne({ role: 'buyer' });
    if (!buyer) {
      buyer = await User.create({
        name: 'John Buyer',
        email: `buyer_${Date.now()}@example.com`,
        phone: '1234567890',
        password: 'password123',
        role: 'buyer',
        isVerified: true
      });
    }

    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      seller = await User.create({
        name: 'Luxury Merchant',
        email: `seller_${Date.now()}@example.com`,
        phone: '9876543210',
        password: 'password123',
        role: 'seller',
        isVerified: true,
        company: 'Exquisite Gems Co'
      });
    }

    // 2. Create test products
    console.log('Creating test products...');
    const product1 = await Product.create({
      sellerId: seller._id,
      title: 'Bespot Diamond Stone A',
      description: 'GIA 1.5 Carat Diamond',
      price: 200000,
      stock: 1,
      category: 'Diamond',
      carat: 1.5,
      color: 'D',
      clarity: 'IF',
      cut: 'Excellent',
      shape: 'Round'
    });

    const product2 = await Product.create({
      sellerId: seller._id,
      title: 'Bespot Diamond Stone B',
      description: 'GIA 1.5 Carat Diamond Alternative',
      price: 220000,
      stock: 1,
      category: 'Diamond',
      carat: 1.5,
      color: 'D',
      clarity: 'IF',
      cut: 'Excellent',
      shape: 'Round'
    });

    // 3. Create RFQ
    console.log('Creating test RFQ...');
    const rfq = await RFQ.create({
      buyerId: buyer._id,
      buyerName: buyer.name,
      shape: 'Round',
      carat: 1.5,
      color: 'D',
      clarity: 'IF',
      budget: 250000,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'submitted',
      quotes: [
        {
          sellerId: seller._id,
          sellerName: seller.name,
          productId: product1._id,
          quotePrice: 195000, // Quote price (lower than base price)
          message: 'Best offer on Round D-IF'
        },
        {
          sellerId: seller._id,
          sellerName: seller.name,
          productId: product2._id,
          quotePrice: 210000,
          message: 'Premium selection alternate'
        }
      ]
    });
    console.log('Created RFQ ID:', rfq._id);

    // 4. Test fetch buyer RFQs populate query
    console.log('Simulating Fetch Buyer RFQs API...');
    const reqGet = { user: buyer };
    let jsonResult = null;
    const resGet = {
      status: (code) => {
        return {
          json: (data) => {
            jsonResult = data;
          }
        };
      }
    };
    await getBuyerRFQs(reqGet, resGet, (err) => console.error(err));

    console.log('Retrieved RFQs count:', jsonResult.results);
    const fetchedRfq = jsonResult.data.rfqs.find(r => r._id.toString() === rfq._id.toString());
    console.log('Populated first quote seller company:', fetchedRfq.quotes[0].sellerId.company);
    console.log('Populated first quote product description:', fetchedRfq.quotes[0].productId.description);

    if (fetchedRfq.quotes[0].sellerId.company !== 'Exquisite Gems Co') {
      throw new Error('Seller population failed!');
    }

    // 5. Test quote acceptance
    console.log('Simulating Quote Acceptance API...');
    const targetQuote = fetchedRfq.quotes.find(q => q.quotePrice === 195000);
    const reqPost = {
      params: { rfqId: rfq._id },
      body: { quoteId: targetQuote._id },
      user: buyer
    };
    let acceptJsonResult = null;
    const resPost = {
      status: (code) => {
        return {
          json: (data) => {
            acceptJsonResult = data;
          }
        };
      }
    };
    await acceptQuote(reqPost, resPost, (err) => console.error(err));

    console.log('Accept Quote Result Message:', acceptJsonResult.message);
    const rfqAfter = await RFQ.findById(rfq._id);
    console.log('RFQ Status after acceptance:', rfqAfter.status);
    console.log('Accepted Quote Status:', rfqAfter.quotes.id(targetQuote._id).accepted);

    if (rfqAfter.status !== 'completed' || rfqAfter.quotes.id(targetQuote._id).accepted !== true) {
      throw new Error('RFQ status and quote accepted field verification failed!');
    }

    // 6. Verify cart populate price override
    console.log('Verifying Cart population and price overrides...');
    const reqCart = { user: buyer };
    let cartJsonResult = null;
    const resCart = {
      status: (code) => {
        return {
          json: (data) => {
            cartJsonResult = data;
          }
        };
      }
    };
    await getCart(reqCart, resCart, (err) => console.error(err));

    console.log('Cart Items in Response:', cartJsonResult.data.cart.items);
    console.log('Calculated Cart Total:', cartJsonResult.data.cart.cartTotal);

    const cartItem = cartJsonResult.data.cart.items.find(item => item.productId._id.toString() === product1._id.toString());
    console.log('Populated cart item overridden price:', cartItem.productId.price);

    if (cartItem.productId.price !== 195000 || cartJsonResult.data.cart.cartTotal !== 195000) {
      throw new Error('Cart price override verification failed!');
    }

    console.log('All tests passed successfully!');

    // Cleanup
    await RFQ.findByIdAndDelete(rfq._id);
    await Product.findByIdAndDelete(product1._id);
    await Product.findByIdAndDelete(product2._id);
    await Cart.deleteOne({ buyerId: buyer._id });
    console.log('Cleaned up database references.');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Done.');
  }
};

runTest();
