import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BuyerDashboard from './pages/BuyerDashboard';
import MyOrders from './pages/MyOrders';
import VerifyEmail from './pages/VerifyEmail';
import AdminKYC from './pages/admin/AdminKYC';
import SellerDashboard from './pages/SellerDashboard';
import SellerOrders from './pages/SellerOrders';
import AddProduct from './pages/AddProduct';
import VerificationPending from './pages/VerificationPending';
import CreateRfq from './pages/CreateRfq';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import LiveAuctionRoom from './pages/LiveAuctionRoom';
import CreateAuction from './pages/CreateAuction';
import Auctions from './pages/Auctions';
import Header from './components/Header';
import Footer from './components/Footer';
import Wishlist from './pages/Wishlist';
import MyRFQs from './pages/MyRFQs';
import { CartProvider } from './context/CartContext';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import UserManagement from './pages/admin/UserManagement';
import GlobalInventory from './pages/admin/GlobalInventory';
import AuctionsAndRfqs from './pages/admin/AuctionsAndRfqs';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const storedUser = localStorage.getItem('zivora_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin' && !location.pathname.startsWith('/admin')) {
          if (location.pathname !== '/login') {
            navigate('/admin/dashboard');
          }
        }
      } catch (e) {}
    }
  }, [location.pathname, navigate]);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAdminRoute && <Header />}
      
      <main className="main-content" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/add-product" element={<AddProduct />} />
          <Route path="/rfq/create" element={<CreateRfq />} />
          <Route path="/verification-pending" element={<VerificationPending />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/:orderId?" element={<Checkout />} />
          <Route path="/order/success" element={<OrderSuccess />} />
          <Route path="/auctions/:id" element={<LiveAuctionRoom />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/seller/create-auction" element={<CreateAuction />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/my-rfqs" element={<MyRFQs />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="inventory" element={<GlobalInventory />} />
            <Route path="auctions-rfqs" element={<AuctionsAndRfqs />} />
            <Route path="kyc-management" element={<AdminKYC />} />
          </Route>
        </Routes>
      </main>
      
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}

export default App;
