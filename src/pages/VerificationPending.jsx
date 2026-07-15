import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, LogOut, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

export default function VerificationPending() {
  const navigate = useNavigate();
  
  // Retrieve user details from localStorage
  const user = JSON.parse(localStorage.getItem('zivora_user')) || {
    name: 'Valued Client',
    email: 'client@zivora.com',
    role: 'buyer'
  };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // References for automatic input focusing
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  const handleLogout = () => {
    localStorage.removeItem('zivora_token');
    localStorage.removeItem('zivora_user');
    navigate('/login');
  };

  const handleChange = (value, idx) => {
    // Only accept numeric inputs
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[idx] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input box if typed
    if (value && idx < 5) {
      inputRefs[idx + 1].current.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    // If backspace is hit and current box is empty, go back
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs[idx - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && !isNaN(pastedData)) {
      setOtp(pastedData.split(''));
      if (inputRefs[5].current) {
        inputRefs[5].current.focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await axios.post('http://localhost:2409/api/auth/verify-email', {
        email: user.email,
        otp: fullOtp
      });

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        localStorage.setItem('zivora_token', token);
        localStorage.setItem('zivora_user', JSON.stringify(data.user));

        setSuccessMsg('Email verified successfully! Redirecting...');
        
        setTimeout(() => {
          if (data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (data.user.role === 'seller') {
            navigate('/seller/dashboard');
          } else {
            navigate('/buyer/dashboard');
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const response = await axios.post('http://localhost:2409/api/auth/resend-otp', {
        email: user.email
      });

      if (response.data.status === 'success') {
        setSuccessMsg('A new 6-digit verification code has been successfully sent to your email.');
        // Clear OTP boxes
        setOtp(['', '', '', '', '', '']);
        if (inputRefs[0].current) {
          inputRefs[0].current.focus();
        }
      }
    } catch (err) {
      console.error('Resend error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
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

          <div className="p-4 rounded-2xl mb-6 flex items-center gap-3 text-left text-xs bg-[#FBF9F6] border border-[#CBAD8D]/20">
            <Mail className="w-4 h-4 text-[#A48374] flex-shrink-0" />
            <span style={{ color: '#6B5549' }}>
              Enter the 6-digit verification code sent to your email to complete registration.
            </span>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-xs flex items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* OTP Digit Input Boxes */}
          <form onSubmit={handleVerify} className="space-y-6 mb-8">
            <div className="flex justify-between gap-2 max-w-xs mx-auto" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength="1"
                  ref={inputRefs[idx]}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-11 h-13 text-center text-lg font-bold rounded-xl border border-[#A48374]/30 focus:outline-none focus:border-[#3A2D28] focus:ring-1 focus:ring-[#3A2D28] bg-[#FBF9F6] transition-colors"
                  style={{ color: '#3A2D28' }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || resending}
              className="w-full py-3.5 rounded-full text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              style={{ background: 'linear-gradient(135deg, #3A2D28, #A48374)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Proceed'
              )}
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleResend}
              disabled={resending || loading}
              className="w-full py-3.5 rounded-full text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)' }}
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending Email...
                </>
              ) : (
                <>
                  Resend Verification Email
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button 
              onClick={handleLogout}
              className="w-full py-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer bg-white"
              style={{ color: '#A48374', borderColor: 'rgba(164, 131, 116, 0.3)' }}
            >
              Back to Login
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
