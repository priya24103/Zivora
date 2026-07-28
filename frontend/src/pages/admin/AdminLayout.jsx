import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Diamond, 
  Gavel, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('zivora_admin_user');
    const storedToken = localStorage.getItem('zivora_admin_token');

    if (!storedUser || !storedToken) {
      navigate('/admin/login');
      return;
    }

    try {
      setAdminUser(JSON.parse(storedUser));
    } catch (e) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('zivora_admin_token');
    localStorage.removeItem('zivora_admin_user');
    navigate('/admin/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Seller KYC', path: '/admin/kyc-management', icon: FileText },
    { name: 'Global Inventory', path: '/admin/inventory', icon: Diamond },
    { name: 'Auctions & RFQs', path: '/admin/auctions-rfqs', icon: Gavel }
  ];

  if (!adminUser) return null;

  return (
    <div className="min-h-screen flex text-[#3A2D28]" style={{ backgroundColor: '#F1EDE6', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Sidebar for Desktop */}
      <aside 
        className="w-64 fixed inset-y-0 left-0 z-20 flex flex-col justify-between border-r shadow-sm"
        style={{ 
          backgroundColor: '#FFFFFF', 
          borderColor: 'rgba(164, 131, 116, 0.2)' 
        }}
      >
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: 'rgba(164, 131, 116, 0.15)' }}>
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: '#A48374' }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 
                className="font-medium tracking-[0.1em] text-sm leading-none" 
                style={{ fontFamily: 'Georgia, serif', color: '#3A2D28' }}
              >
                ZIVORA
              </h2>
              <span className="text-[9px] text-[#A48374] tracking-widest uppercase font-semibold">Admin Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 group"
                  style={{
                    color: isActive ? '#3A2D28' : 'rgba(58, 45, 40, 0.65)',
                    backgroundColor: isActive ? 'rgba(164, 131, 116, 0.12)' : 'transparent',
                  }}
                >
                  <Icon 
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" 
                    style={{ color: isActive ? '#A48374' : 'rgba(58, 45, 40, 0.45)' }}
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer / Logout */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'rgba(164, 131, 116, 0.15)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(164, 131, 116, 0.05)' }}>
            <div className="w-8 h-8 rounded-full bg-[#A48374]/20 flex items-center justify-center text-[#A48374]">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#3A2D28] truncate leading-none">{adminUser.name}</p>
              <span className="text-[10px] text-[#A48374] truncate block mt-0.5">{adminUser.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-30 flex md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 flex flex-col justify-between z-40 bg-white border-r shadow-lg"
              style={{ borderColor: 'rgba(164, 131, 116, 0.2)' }}
            >
              <div>
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(164, 131, 116, 0.15)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#A48374' }}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold tracking-wider text-sm leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                        ZIVORA
                      </h2>
                      <span className="text-[9px] text-[#A48374] tracking-widest uppercase">Admin</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="text-[#3A2D28] hover:scale-105 active:scale-95 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="p-4 space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300"
                        style={{
                          color: isActive ? '#3A2D28' : 'rgba(58, 45, 40, 0.65)',
                          backgroundColor: isActive ? 'rgba(164, 131, 116, 0.12)' : 'transparent',
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: isActive ? '#A48374' : 'rgba(58, 45, 40, 0.45)' }} />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t space-y-3" style={{ borderColor: 'rgba(164, 131, 116, 0.15)' }}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(164, 131, 116, 0.05)' }}>
                  <div className="w-8 h-8 rounded-full bg-[#A48374]/20 flex items-center justify-center text-[#A48374]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#3A2D28] truncate leading-none">{adminUser.name}</p>
                    <span className="text-[10px] text-[#A48374] truncate block mt-0.5">{adminUser.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <header 
          className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-white/70 backdrop-blur-md z-10"
          style={{ borderColor: 'rgba(164, 131, 116, 0.15)' }}
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-[#3A2D28] md:hidden p-1.5 rounded-xl hover:bg-[#F1EDE6] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs font-semibold uppercase tracking-widest text-[#3A2D28]/80 hidden sm:block">
              {navLinks.find(l => location.pathname === l.path)?.name || 'Admin Panel'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-none text-[#3A2D28]">{adminUser.name}</p>
              <span className="text-[9px] text-[#A48374] uppercase tracking-wider font-semibold">Administrator</span>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center border font-semibold text-xs transition-transform hover:scale-105"
              style={{ 
                borderColor: 'rgba(164, 131, 116, 0.4)', 
                color: '#3A2D28', 
                backgroundColor: 'rgba(164, 131, 116, 0.08)' 
              }}
            >
              {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* Nested Routing Content */}
        <main className="p-6 md:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
