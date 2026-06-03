import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  MessageSquare, 
  Sparkles,
  Bell,
  LogOut,
  Gavel,
  ClipboardList,
  LayoutDashboard,
  PlusCircle
} from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Bid Received', desc: '₹12,40,000 offered on 2.02ct Round Brilliant', time: '5m ago', read: false },
    { id: 2, title: 'New RFQ Match', desc: 'Buyer request for 1.5ct VVS1 Cushion Cut', time: '1h ago', read: false },
    { id: 3, title: 'KYC Document Verified', desc: 'Your GST certification has been approved', time: '1d ago', read: true },
    { id: 4, title: 'Stock Alert', desc: '2 items in your inventory have sold', time: '2d ago', read: true }
  ]);

  // Sync user status on render or navigation
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('zivora_user');
      const storedToken = localStorage.getItem('zivora_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };
    checkUser();
    
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    setUser(null);
    setDropdownOpen(false);
    navigate('/login');
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Define pages that should display the simple guest header
  const guestPages = ['/', '/login', '/signup', '/verification-pending'];
  // If the user is logged in, show the full premium header instead of the simple guest header
  const isGuestPage = guestPages.includes(location.pathname) && !user;

  // ─── SIMPLE GUEST HEADER (For /, /login, /signup, /verification-pending) ─
  if (isGuestPage) {
    return (
      <header 
        className="w-full px-6 lg:px-12 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#F7F3EF', borderBottom: '1px solid rgba(203,173,141,0.2)' }}
      >
        {/* Left spacer for flex balancing */}
        <div className="flex-1 hidden md:block"></div>

        {/* Center: Zivora Logo */}
        <div className="flex-1 flex justify-start md:justify-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 duration-500" 
              style={{ backgroundColor: '#A48374' }}
            >
              <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
            </div>
            <div className="flex flex-col">
              <span 
                style={{ 
                  fontSize: '1.6rem', 
                  letterSpacing: '0.12em', 
                  fontWeight: '400', 
                  color: '#3A2D28', 
                  fontFamily: 'Georgia, serif', 
                  lineHeight: '1' 
                }}
              >
                ZIVORA
              </span>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: '#A48374', marginTop: '3px' }}>
                FINE DIAMONDS
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Sign In & Register Buttons */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <Link 
            to="/login" 
            className="text-xs font-semibold hover:text-[#A48374] transition-colors"
            style={{ color: '#3A2D28' }}
          >
            Sign In
          </Link>
          <Link 
            to="/signup" 
            className="px-5 py-2 rounded-full text-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity" 
            style={{ backgroundColor: '#A48374' }}
          >
            Register
          </Link>
        </div>
      </header>
    );
  }

  // ─── FULL PREMIUM SELLER HEADER (For Logged-In Sellers) ───────────────────
  if (user && user.role === 'seller') {
    return (
      <div className="w-full flex flex-col font-sans">
        {/* TOP ANNOUNCEMENT BANNER */}
        <div 
          className="w-full text-center py-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] flex items-center justify-center gap-2"
          style={{ backgroundColor: '#3A2D28', color: '#F1EDE6', borderBottom: '1px solid rgba(203,173,141,0.15)' }}
        >
          <span>✦</span> SELLER CONSOLE — REAL-TIME AUCTIONS, RFQs & CUSTOMER OFFERS <span>✦</span>
        </div>

        {/* MAIN HEADER ROW */}
        <header 
          className="w-full px-6 lg:px-12 py-5 flex items-center justify-between gap-6"
          style={{ backgroundColor: '#F7F3EF', borderBottom: '1px solid rgba(203,173,141,0.2)' }}
        >
          {/* Logo with Seller Hub Badge */}
          <div className="flex-shrink-0">
            <Link to="/seller/dashboard" className="flex items-center gap-3 group">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 duration-500" 
                style={{ backgroundColor: '#3A2D28' }}
              >
                <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
              </div>
              <div className="flex flex-col">
                <span 
                  style={{ 
                    fontSize: '1.6rem', 
                    letterSpacing: '0.12em', 
                    fontWeight: '400', 
                    color: '#3A2D28', 
                    fontFamily: 'Georgia, serif', 
                    lineHeight: '1' 
                  }}
                >
                  ZIVORA
                </span>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#A48374', fontWeight: 'bold', marginTop: '3px' }}>
                  SELLER PORTAL
                </span>
              </div>
            </Link>
          </div>

          {/* Search bar tailored for the seller */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-[#A48374]" />
              <input 
                type="text" 
                placeholder="Search SKU, listings, active bids, RFQs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs focus:outline-none focus:ring-1 transition-shadow"
                style={{ 
                  backgroundColor: '#F1EDE6', 
                  color: '#3A2D28',
                  borderColor: '#E6DFD6',
                  borderWidth: '1px',
                  '--tw-ring-color': '#CBAD8D'
                }}
              />
            </div>
          </form>

          {/* Right Utility Icons */}
          <div className="flex items-center gap-5 lg:gap-6">
            <div className="flex items-center gap-4 text-[#A48374]">
              {/* Messages button */}
              <button 
                onClick={() => navigate('/seller/dashboard?tab=messages')}
                className="hover:text-[#3A2D28] transition-colors relative p-1 cursor-pointer"
                title="Seller Messages"
              >
                <MessageSquare className="w-[18px] h-[18px]" />
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="hover:text-[#3A2D28] transition-colors relative p-1 cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center animate-pulse"
                      style={{ backgroundColor: '#3A2D28' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-[#CBAD8D]/15 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 pb-2.5 border-b border-[#CBAD8D]/10 flex justify-between items-center">
                        <span className="font-semibold text-xs text-[#3A2D28]">System Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllNotificationsRead}
                            className="text-[10px] text-[#A48374] hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto pt-1">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className="px-4 py-3 hover:bg-[#F7F3EF]/50 transition-colors flex items-start gap-2.5 border-b border-[#CBAD8D]/5 last:border-b-0"
                          >
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: n.read ? 'transparent' : '#A48374' }} />
                            <div className="flex-1">
                              <p className="font-semibold text-xs text-[#3A2D28]">{n.title}</p>
                              <p className="text-[10px] text-[#A48374] mt-0.5 leading-normal">{n.desc}</p>
                              <span className="text-[9px] text-[#CBAD8D] block mt-1">{n.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="h-4 w-px bg-[#CBAD8D]/30"></div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3A2D28, #A48374)' }}
                >
                  {user.name ? user.name[0] : 'S'}
                </button>
                
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div 
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-[#CBAD8D]/15 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                      style={{ color: '#3A2D28' }}
                    >
                      <div className="px-4 pb-3 border-b border-[#CBAD8D]/10">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-[#A48374] truncate">{user.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 mt-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#3A2D28] text-[#F1EDE6]">
                          {user.role} Hub
                        </span>
                      </div>
                      
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/seller/dashboard?tab=overview');
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-[#F7F3EF] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                          Seller Dashboard
                        </button>
                        <button 
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/seller/dashboard?tab=inventory');
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-[#F7F3EF] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                          My Inventory
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-xs text-[#E53E3E] hover:bg-[#FFF5F5] transition-colors flex items-center gap-2 border-t border-[#CBAD8D]/10 mt-2 pt-2 cursor-pointer font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* LOWER NAVIGATION ROW FOR SELLER FUNCTIONALITIES */}
        <nav 
          className="w-full py-3.5 flex items-center justify-center border-b border-t"
          style={{ 
            backgroundColor: '#FBF9F6', 
            borderColor: 'rgba(203,173,141,0.15)',
            borderTopWidth: '0px'
          }}
        >
          <div className="flex items-center gap-8 lg:gap-12 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B5549]">
            <Link to="/seller/dashboard?tab=overview" className={`hover:text-[#CBAD8D] transition-colors flex items-center gap-1.5 ${location.search.includes('tab=overview') || location.search === '' ? 'text-[#3A2D28] font-bold border-b border-[#3A2D28]' : ''}`}>
              Dashboard
            </Link>
            <Link to="/seller/dashboard?tab=inventory" className={`hover:text-[#CBAD8D] transition-colors ${location.search.includes('tab=inventory') ? 'text-[#3A2D28] font-bold border-b border-[#3A2D28]' : ''}`}>
              Inventory
            </Link>
            <Link to="/seller/dashboard?tab=auctions" className={`hover:text-[#CBAD8D] transition-colors ${location.search.includes('tab=auctions') ? 'text-[#3A2D28] font-bold border-b border-[#3A2D28]' : ''}`}>
              Auctions
            </Link>
            <Link to="/seller/dashboard?tab=rfqs" className={`hover:text-[#CBAD8D] transition-colors ${location.search.includes('tab=rfqs') ? 'text-[#3A2D28] font-bold border-b border-[#3A2D28]' : ''}`}>
              Buyer RFQs
            </Link>
            <Link to="/seller/dashboard?tab=messages" className={`hover:text-[#CBAD8D] transition-colors ${location.search.includes('tab=messages') ? 'text-[#3A2D28] font-bold border-b border-[#3A2D28]' : ''}`}>
              Messages
            </Link>
            <Link 
              to="/seller/add-product" 
              className="hover:text-[#CBAD8D] transition-colors flex items-center gap-1.5"
              style={{ color: '#A48374' }}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#CBAD8D]" />
              List Diamond
            </Link>
          </div>
        </nav>
      </div>
    );
  }

  // ─── FULL PREMIUM SHOPPING HEADER (For Logged-In Buyers) ───────────────────
  return (
    <div className="w-full flex flex-col font-sans">
      {/* ─── TOP ANNOUNCEMENT BANNER ───────────────────────────────────── */}
      <div 
        className="w-full text-center py-2 text-[10px] md:text-xs font-semibold tracking-[0.2em] flex items-center justify-center gap-2"
        style={{ backgroundColor: '#E0D0C1', color: '#3A2D28', borderBottom: '1px solid rgba(203,173,141,0.15)' }}
      >
        <span>✦</span> FREE INSURED SHIPPING ON ORDERS ABOVE ₹5,00,000 <span>✦</span>
      </div>

      {/* ─── MAIN HEADER ROW ────────────────────────────────────────────── */}
      <header 
        className="w-full px-6 lg:px-12 py-5 flex items-center justify-between gap-6"
        style={{ backgroundColor: '#F7F3EF', borderBottom: '1px solid rgba(203,173,141,0.2)' }}
      >
        {/* Left Side: Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 duration-500" 
              style={{ backgroundColor: '#A48374' }}
            >
              <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
            </div>
            <div className="flex flex-col">
              <span 
                style={{ 
                  fontSize: '1.6rem', 
                  letterSpacing: '0.12em', 
                  fontWeight: '400', 
                  color: '#3A2D28', 
                  fontFamily: 'Georgia, serif', 
                  lineHeight: '1' 
                }}
              >
                ZIVORA
              </span>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: '#A48374', marginTop: '3px' }}>
                FINE DIAMONDS
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-[#A48374]" />
            <input 
              type="text" 
              placeholder="Search diamonds, jewelry, auctions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs focus:outline-none focus:ring-1 transition-shadow"
              style={{ 
                backgroundColor: '#F1EDE6', 
                color: '#3A2D28',
                borderColor: '#E6DFD6',
                borderWidth: '1px',
                '--tw-ring-color': '#CBAD8D'
              }}
            />
          </div>
        </form>

        {/* Right Side: Navigation Actions & Auth */}
        <div className="flex items-center gap-5 lg:gap-6">
          {/* Wishlist & Cart Icons */}
          <div className="flex items-center gap-4 text-[#A48374]">
            <button className="hover:text-[#3A2D28] transition-colors relative p-1 cursor-pointer">
              <MessageSquare className="w-[18px] h-[18px]" />
            </button>
            <button className="hover:text-[#3A2D28] transition-colors relative p-1 cursor-pointer">
              <Heart className="w-[18px] h-[18px]" />
            </button>
            <button className="hover:text-[#3A2D28] transition-colors relative p-1 cursor-pointer">
              <ShoppingBag className="w-[18px] h-[18px]" />
              <span 
                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: '#A48374' }}
              >
                3
              </span>
            </button>
          </div>

          <div className="h-4 w-px bg-[#CBAD8D]/30"></div>

          {/* Auth Buttons / Profile Avatar */}
          <div className="flex items-center gap-3 relative">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #CBAD8D, #A48374)' }}
                >
                  {user.name ? user.name[0] : 'U'}
                </button>
                
                {dropdownOpen && (
                  <>
                    {/* Click outside overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    
                    <div 
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-[#CBAD8D]/15 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                      style={{ color: '#3A2D28' }}
                    >
                      <div className="px-4 pb-3 border-b border-[#CBAD8D]/10">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-[#A48374] truncate">{user.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 mt-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F1EDE6] text-[#A48374]">
                          {user.role}
                        </span>
                      </div>
                      
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            setDropdownOpen(false);
                            alert('Profile editing is currently being configured.');
                          }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-[#F7F3EF] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                        >
                          Edit Profile
                        </button>

                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-xs text-[#E53E3E] hover:bg-[#FFF5F5] transition-colors flex items-center gap-2 border-t border-[#CBAD8D]/10 mt-2 pt-2 cursor-pointer font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-xs font-semibold hover:text-[#A48374] transition-colors"
                  style={{ color: '#3A2D28' }}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="px-5 py-2 rounded-full text-white text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity" 
                  style={{ backgroundColor: '#A48374' }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── LOWER NAVIGATION ROW ───────────────────────────────────────── */}
      <nav 
        className="w-full py-3.5 flex items-center justify-center border-b border-t"
        style={{ 
          backgroundColor: '#FBF9F6', 
          borderColor: 'rgba(203,173,141,0.15)',
          borderTopWidth: '0px'
        }}
      >
        <div className="flex items-center gap-8 lg:gap-12 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B5549]">
          <Link to="/products?category=Diamond" className="hover:text-[#CBAD8D] transition-colors">
            Diamonds
          </Link>
          <Link to="/products?category=Jewelry" className="hover:text-[#CBAD8D] transition-colors">
            Jewelry
          </Link>
          <Link to="/auctions" className="hover:text-[#CBAD8D] transition-colors">
            Live Auctions
          </Link>
          <Link to="/rfq/create" className="hover:text-[#CBAD8D] transition-colors">
            Request Quote
          </Link>
          <Link 
            to={user && user.role === 'seller' ? "/seller/add-product" : "/signup?role=seller"} 
            className="hover:text-[#CBAD8D] transition-colors flex items-center gap-1.5"
            style={{ color: '#A48374' }}
          >
            <Sparkles className="w-3 h-3 text-[#CBAD8D]" />
            Sell
          </Link>
        </div>
      </nav>
    </div>
  );
}

