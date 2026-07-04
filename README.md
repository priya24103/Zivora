# Zivora – Luxury B2B Diamond & Jewelry Marketplace

Zivora is a high-end, production-ready B2B marketplace engineered for the diamond and jewelry industry. The platform facilitates premium trading operations through multiple transaction models, including automated live auctions, real-time counter-offer negotiations, and structured Reverse Bidding RFQs (Request for Quotes). Built using the MERN stack (MongoDB, Express, React, Node.js) and optimized with WebSockets, it provides separate, tailored experiences for Buyers, Sellers, and Platform Administrators.

---

## 💎 Core Architecture & Features

### 1. Advanced Trading Mechanisms

* **Live Auction System:** Powered by Socket.io for sub-second real-time bidding synchronization. Features atomic bid processing, automated bid validations, a 5-second anti-snipe/congestion bidding cooldown, and localized dynamic countdown timers.
* **Direct Negotiation (Make an Offer):** A comprehensive offer management loop allowing private, asynchronous counter-offers between buyers and sellers. Keeps an absolute historical audit trail of prices and messages within sub-documents.
* **Reverse Bidding RFQs:** Allows buyers to post custom sourcing requests. Sellers bid downwards to fulfill the order. Optimized on the backend using a custom **Min-Heap data structure** for fast retrieval of the lowest active quotes.

### 2. Intelligent Inventory Management

* **Polymorphic Mongoose Discriminators:** A unified inventory schema branching into distinct `Diamond` data structures (tracking Carat, Cut, Color, Clarity, Shape, GIA Certificate Numbers) and `Jewelry` data structures (tracking Metal Type, Weight, Gemstones).
* **Hold Memo System:** Industry-standard 48-hour digital locking mechanism allowing trusted buyers to temporarily hold premium goods for retail client reviews.

### 3. Automated Platform Mechanics (Cron Jobs)

* **Auction Auto-Award Worker:** An hourly/minutely background automation engine that tracks expired auctions, closes bidding rooms instantly, selects the true highest bidder, adjusts catalog stock, and automatically spawns a pending transaction order.
* **Memo Auto-Release Worker:** Periodically cleans up expired inventory holds, reverting product statuses back to public availability seamlessly if a buyer fails to finalize a transaction.

### 4. Enterprise-Grade Security & Roles

* **Role-Based Access Control (RBAC):** Strict JWT-based verification separation gating standard Buyers, verified Sellers, and Platform Administrators.
* **Seeded Admin Operations:** Dedicated control center lacking public entry vectors (no registration route available). Features platform performance indexing, global user monitoring, listing moderation, and integrity health monitoring for external media storage or workers.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion (Luxury UI Micro-interactions), Lucide Icons
* **Backend:** Node.js, Express.js, Socket.io (WebSockets)
* **Database:** MongoDB, Mongoose ODM (Using Discriminators for schema hierarchy)
* **Task Scheduling:** Node-Cron
* **Third-Party Integrations:** Razorpay Payment Gateway, Cloudinary Media Pipeline

---

## 📂 Project Structure

```text
├── backend/
│   ├── config/             # DB connections and external SDK configurations
│   ├── cron/               # Node-cron automated jobs (Auction expiry, Memo release)
│   ├── middleware/         # JWT verify, Role guards (isSeller, isAdmin)
│   ├── models/             # Mongoose schemas (User, Product, Auction, Offer, Order, RFQ)
│   ├── controllers/        # Business logic controllers
│   ├── routes/             # REST API Endpoints
│   ├── socket/             # Socket.io connection event handlers
│   └── server.js           # Server bootstrapper & configuration integration
│
├── frontend/
│   ├── src/
│   │   ├── context/        # Global states (AuthContext, CartContext)
│   │   ├── components/     # UI components (Layouts, Drawers, Modals)
│   │   ├── pages/          # Full page layouts (Dashboard, LiveRoom, AdminControl)
│   │   ├── App.jsx         # Routes definition
│   │   └── main.jsx        # Client entry engine

```

---

## 🚀 Installation & Setup

### Prerequisites

* Node.js (v16.x or higher)
* MongoDB Instance (Local or Atlas)
* Razorpay API Keys

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/zivora.git
cd zivora

```

### 2. Backend Environment Configuration

Navigate to the backend directory and create a `.env` file:

```bash
cd backend
npm install

```

Add the following configuration lines to your `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zivora
JWT_SECRET=your_jwt_encryption_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_URL=your_cloudinary_connection_string

```

Start the backend development server:

```bash
npm run dev

```

### 3. Frontend Environment Configuration

Open a secondary terminal workspace, navigate to the frontend directory:

```bash
cd ../frontend
npm install

```

Create a `.env` configuration template file:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

```

Start the Vite localized development compilation link:

```bash
npm run dev

```

### 4. Initialization Configuration (Seeding Admin)

Because admin accounts are locked down against standard registration routes, open MongoDB Compass or Mongo Shell and manually append the primary system administrator document:

```json
{
  "name": "Priya Admin",
  "email": "admin@gmail.com",
  "password": "$2b$10$YourHashedBcryptPasswordStringHere",
  "role": "admin",
  "status": "active"
}

```

---

## 🔒 Security & Data Integrity Validations

* **Race-Condition Overrides:** Checkout systems verify live item availability checks prior to forwarding payment payloads, preventing multi-user direct checkouts on the exact same physical stone.
* **Socket-Validation Layer:** Real-time incoming bid messages are vetted against active DB timestamps rather than relying on client clock arrays, mitigating manual expiration bypassing attempts.
