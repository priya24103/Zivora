import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { Mail, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:2409/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // References for automatic input focusing
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    // Attempt to extract email from pending user profile in localStorage
    const storedUser = localStorage.getItem('zivora_user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj && userObj.email) {
          setEmail(userObj.email);
        }
      } catch (e) {
        console.error('Failed to parse user details:', e);
      }
    }
  }, []);

  const handleChange = (value, idx) => {
    // Only accept numeric inputs
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Keep only the last character (in case they type multiple)
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
      const pasteArray = pastedData.split('');
      setOtp(pasteArray);
      // Focus final input
      inputRefs[5].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call verification endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
        email: email || JSON.parse(localStorage.getItem('zivora_user'))?.email,
        otp: fullOtp
      });

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        // Save verified tokens
        localStorage.setItem('zivora_token', token);
        localStorage.setItem('zivora_user', JSON.stringify(data.user));

        setSuccess('Email verified successfully! Opening your dashboard...');

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
      console.error('OTP Verification failed:', err);
      setError(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#F1EDE6', fontFamily: 'Outfit, sans-serif' }}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl border border-[#A48374]/20 p-8 shadow-xl text-center"
      >
        <div className="flex flex-col items-center mb-6">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-white"
            style={{ backgroundColor: '#3A2D28' }}
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif', fontWeight: 300 }}>
            Account Verification
          </h2>
          <p className="text-xs text-[#A48374] mt-2 tracking-wide font-medium">
            We've sent a 6-digit code to your email.
          </p>
          {email && (
            <span className="text-xs bg-[#F5F1EC] text-[#A48374] font-bold py-1 px-3 mt-3 rounded-full border border-[#CBAD8D]/25">
              {email}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/50 border border-red-200/50 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-left">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50/50 border border-green-200/50 rounded-xl text-green-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p className="text-left">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Digit Input Boxes */}
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

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 py-3.5 rounded-full text-white text-xs uppercase tracking-widest font-bold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            style={{ backgroundColor: '#A48374' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <button 
          onClick={() => navigate('/login')}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
        </button>
      </div>
    </motion.div>
  );
}
