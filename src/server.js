require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Initialize live bidding socket handler
const registerAuctionSocket = require('./socket/auctionSocket');
registerAuctionSocket(io);

const rfqCron = require('./jobs/rfqCron');
const auctionExpiry = require('./jobs/auctionExpiry');

const startServer = async () => {
  try {
    await connectDB();
    rfqCron.init();
    auctionExpiry.init();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
