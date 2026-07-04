import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#3A2D28', color: '#F1EDE6' }} className="pt-20 pb-8 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
           <Link to="/" className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
               <div className="w-3 h-3 bg-white rotate-45"></div>
             </div>
             <div className="flex flex-col">
               <span style={{ fontSize: '1.25rem', letterSpacing: '0.15em', fontWeight: '400', color: 'white', fontFamily: 'Georgia, serif', lineHeight: '1' }}>
                 ZIVORA
               </span>
               <span style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: '#A48374', marginTop: '2px' }}>
                 FINE DIAMONDS
               </span>
             </div>
           </Link>
           <p className="text-sm leading-relaxed text-[#A48374] mb-8 pr-4">
             The premier destination for certified luxury diamonds, fine jewelry, and exclusive live auctions — where every stone tells its story.
           </p>
           <div className="space-y-3 text-sm text-[#A48374]">
              <p>📍 47th Street Diamond District, Mumbai 400001</p>
              <p>📞 +91 98765 43210</p>
              <p>✉️ support@zivora.com</p>
           </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-[#CBAD8D] mb-6">Shop</h4>
          <ul className="space-y-4 text-sm text-[#A48374]">
            <li>Diamonds</li>
            <li>Jewelry</li>
            <li>Live Auctions</li>
            <li>Request Quote</li>
            <li>New Arrivals</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-[#CBAD8D] mb-6">Customer Care</h4>
          <ul className="space-y-4 text-sm text-[#A48374]">
            <li>Contact Us</li>
            <li>Shipping & Returns</li>
            <li>Certifications</li>
            <li>FAQ</li>
            <li>Book a Consultation</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-[#CBAD8D] mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-[#A48374]">
            <li>About Zivora</li>
            <li>Sell on Zivora</li>
            <li>Press</li>
            <li>Careers</li>
            <li>Blog</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-[#A48374]">
        <p>&copy; 2026 Zivora Fine Diamonds. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Cookie Policy</span>
        </div>
      </div>
    </footer>
  );
}
