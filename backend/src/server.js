require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

app.set('io', io);

// Initialize live bidding socket handler
const registerAuctionSocket = require('./socket/auctionSocket');
registerAuctionSocket(io);

const rfqCron = require('./jobs/rfqCron');
const auctionExpiry = require('./jobs/auctionExpiry');
const memoExpiry = require('./jobs/memoExpiry');

const { verifySmtpConnection } = require('./utils/sendEmail');

const startServer = async () => {
  try {
    await connectDB();
    verifySmtpConnection();
    rfqCron.init();
    auctionExpiry.init();
    memoExpiry.init();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
