require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { Product, Diamond, Jewelry } = require('../src/models/Product');

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    // 1. Get or create a test seller
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.log('No seller found, creating one...');
      seller = await User.create({
        name: 'Test Seller Inc.',
        email: `seller_${Date.now()}@example.com`,
        phone: '9876543210',
        password: 'password123',
        role: 'seller',
        sellerProfile: {
          panNumber: 'ABCDE1234F',
          gstNumber: '22ABCDE1234F1Z5',
          businessProofUrl: ['https://res.cloudinary.com/demo/image/upload/proof.jpg'],
          idProofUrl: 'https://res.cloudinary.com/demo/image/upload/id.jpg',
          kycStatus: 'approved'
        }
      });
      console.log('Created seller:', seller.email);
    } else {
      console.log('Using existing seller:', seller.email);
    }

    // 2. Clear old test products (optional, just for clean state)
    await Product.deleteMany({ title: /Test Product/ });
    console.log('Cleared previous test products.');

    // 3. Test creating a Diamond Product via Discriminator
    console.log('Testing Diamond discriminator...');
    const diamondPayload = {
      sellerId: seller._id,
      title: 'Test Product - Loose Diamond 2.5ct D VVS1',
      description: 'A gorgeous D color, VVS1 clarity round brilliant diamond.',
      price: 25000,
      stock: 1,
      category: 'Diamond',
      carat: 2.5,
      color: 'D',
      clarity: 'VVS1',
      cut: 'Excellent',
      shape: 'Round',
      certificateLab: 'GIA',
      certificateNumber: 'GIA-987654321'
    };

    const diamond = new Diamond(diamondPayload);
    const savedDiamond = await diamond.save();
    console.log('Diamond created successfully!', savedDiamond._id, savedDiamond.category);

    // 4. Test creating a Jewelry Product via Discriminator
    console.log('Testing Jewelry discriminator...');
    const jewelryPayload = {
      sellerId: seller._id,
      title: 'Test Product - 18k Rose Gold Diamond Ring',
      description: 'Stunning accent diamond ring in solid 18k rose gold.',
      price: 4500,
      stock: 3,
      category: 'Jewelry',
      jewelryType: 'Ring',
      metalType: '18k Rose Gold',
      weightGrams: 4.8,
      gender: 'Women',
      diamondDetails: '0.3ct total accent diamonds, VS clarity'
    };

    const jewelry = new Jewelry(jewelryPayload);
    const savedJewelry = await jewelry.save();
    console.log('Jewelry created successfully!', savedJewelry._id, savedJewelry.category);

    // 5. Test validation rules (e.g. invalid color grade for Diamond)
    console.log('Testing Validation rules with invalid Diamond color...');
    try {
      const invalidDiamond = new Diamond({
        sellerId: seller._id,
        title: 'Test Product - Invalid color Diamond',
        description: 'Should fail validation',
        price: 100,
        category: 'Diamond',
        carat: 1.0,
        color: 'INVALID_COLOR', // Should trigger enum validation
        clarity: 'IF',
        cut: 'Fair',
        shape: 'Round'
      });
      await invalidDiamond.save();
      console.log('FAILED: Invalid color diamond was saved successfully, which is incorrect!');
    } catch (err) {
      console.log('SUCCESS: Diamond validation correctly rejected invalid color! Error:', err.message);
    }

    // 6. Test retrieval from base collection
    console.log('Retrieving products from unified collection...');
    const retrievedProducts = await Product.find({ title: /Test Product/ });
    console.log(`Found ${retrievedProducts.length} test products in unified collection:`);
    retrievedProducts.forEach(p => {
      console.log(`- [${p.category}] ${p.title} - Price: $${p.price}`);
    });

  } catch (error) {
    console.error('Error during test execution:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

runTest();
