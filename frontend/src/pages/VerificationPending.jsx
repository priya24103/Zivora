import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, LogOut, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerificationPending() {
  const navigate = useNavigate();
  
  // Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem('zivora_user')) || {
    name: 'Valued Client',
    email: 'client@zivora.com',
    role: 'buyer'
  };

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F3EF' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] text-center"
      >
        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_12px_40px_rgba(58,45,40,0.04)] border border-[#CBAD8D]/10">
          
          {/* Animated Gold Shield Alert */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #CBAD8D, #A48374)' }}
          >
            <ShieldAlert className="w-8 h-8 text-white" />
          </motion.div>

          {/* Heading */}
          <h1 className="text-3xl mb-4" style={{ fontWeight: 300, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
            Account Verification Pending
          </h1>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#A48374' }}>
            Thank you for registering with Zivora Fine Diamonds. Your account for <strong>{user.email}</strong> has been created, but verification is required before you can access the marketplace and dashboards.
          </p>

          <div className="p-4 rounded-2xl mb-8 flex items-center gap-3 text-left text-xs bg-[#FBF9F6] border border-[#CBAD8D]/20">
            <Mail className="w-4 h-4 text-[#A48374] flex-shrink-0" />
            <span style={{ color: '#6B5549' }}>
              We have sent a verification link to your email address. Please click the link to confirm your account.
            </span>
          </div>

          {/* Placeholder for custom verification elements */}
          <div className="h-20 w-full mb-8 rounded-2xl border border-dashed border-[#D1C7BD] flex items-center justify-center text-xs text-[#A48374]">
            [ Custom Verification Design & Layout Will Be Implemented Here ]
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                alert('Verification link resent successfully!');
              }}
              className="w-full py-3.5 rounded-full text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)' }}
            >
              Resend Verification Email
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={handleLogout}
              className="w-full py-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer"
              style={{ color: '#A48374', borderColor: '#A48374/30' }}
            >
              Back to Login
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
