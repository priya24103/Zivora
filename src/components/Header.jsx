import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  MessageSquare, 
  Sparkles 
} from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Define pages that should display the simple guest header
  const guestPages = ['/', '/login', '/signup', '/verification-pending'];
  const isGuestPage = guestPages.includes(location.pathname);

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

  // ─── FULL PREMIUM SHOPPING HEADER (For Logged-In Portals / Dashboards) ─────
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
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-[#A48374]" />
            <input 
              type="text" 
              placeholder="Search diamonds, jewelry, auctions..." 
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
        </div>

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

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
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
          <Link to="/marketplace/diamonds" className="hover:text-[#CBAD8D] transition-colors">
            Diamonds
          </Link>
          <Link to="/marketplace/jewelry" className="hover:text-[#CBAD8D] transition-colors">
            Jewelry
          </Link>
          <Link to="/auctions" className="hover:text-[#CBAD8D] transition-colors">
            Live Auctions
          </Link>
          <Link to="/rfq/create" className="hover:text-[#CBAD8D] transition-colors">
            Request Quote
          </Link>
          <Link 
            to="/signup?role=seller" 
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
