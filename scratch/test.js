require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const runTest = async () => {
  try {
    console.log('Connecting to Atlas Cluster...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB successfully!');
    
    const email = `atlas_seller_${Date.now()}@example.com`;
    // Attempt to create a seller
    const testUser = await User.create({
      name: 'Atlas Test Seller',
      email,
      phone: '9876543210',
      password: 'password123',
      role: 'seller',
      sellerProfile: {
        panNumber: 'ABCDE1234F',
        gstNumber: '22ABCDE1234F1Z5',
        businessProofUrl: [
          'https://res.cloudinary.com/demo/image/upload/proof1.jpg',
          'https://res.cloudinary.com/demo/image/upload/proof2.jpg'
        ],
        idProofUrl: 'https://res.cloudinary.com/demo/image/upload/id_proof.jpg',
        kycStatus: 'pending'
      }
    });
    
    console.log('Seller created successfully in your cluster!');
    console.log('Seller Data:', testUser);
  } catch (error) {
    console.error('Error Stack Trace:');
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

runTest();
