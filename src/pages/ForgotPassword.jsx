import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:2409/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send Email Code, 2: Verify Code
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Refs for OTP input focusing
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Handle Send Code Submission (Step 1)
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      if (response.data.status === 'success') {
        setSuccessMsg('A 6-digit verification code has been sent to your email.');
        setTimeout(() => {
          setSuccessMsg('');
          setStep(2);
        }, 1200);
      }
    } catch (err) {
      console.error('Forgot password request error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send verification code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Inputs (Step 2)
  const handleOtpChange = (value, idx) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && idx < 5) {
      inputRefs[idx + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs[idx - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && !isNaN(pastedData)) {
      setOtp(pastedData.split(''));
      inputRefs[5].current.focus();
    }
  };

  // Handle Verify Code Submission (Step 2)
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-reset-code`, {
        email,
        otp: fullOtp
      });

      if (response.data.status === 'success') {
        const { resetToken } = response.data;
        setSuccessMsg('Code verified! Redirecting to password reset page...');

        // Redirect to /reset-password passing email and resetToken
        setTimeout(() => {
          navigate('/reset-password', { state: { email, resetToken } });
        }, 1200);
      }
    } catch (err) {
      console.error('OTP Verification error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      if (response.data.status === 'success') {
        setSuccessMsg('A new verification code has been sent to your email.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#F7F3EF' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 text-white shadow-sm" style={{ backgroundColor: '#3A2D28' }}>
            {step === 1 ? <KeyRound className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <h1 className="text-3xl mb-2" style={{ fontWeight: 300, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
            {step === 1 ? 'Forgot Password?' : 'Enter Verification Code'}
          </h1>
          <p className="text-xs tracking-wide" style={{ color: '#A48374' }}>
            {step === 1
              ? 'Enter your registered email address to receive a verification code'
              : `We have sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 mb-6 rounded-2xl flex items-start gap-3 text-xs"
                style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-6 rounded-2xl flex items-start gap-3 text-xs"
              style={{ backgroundColor: '#FFF5F5', border: '1px solid #FFE3E3', color: '#E53E3E' }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {step === 1 ? (
            /* STEP 1: Request Code Form */
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#3A2D28]">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-[#A48374]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 transition-shadow"
                    style={{
                      backgroundColor: '#F1EDE6',
                      color: '#3A2D28',
                      '--tw-ring-color': '#CBAD8D'
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-sm"
                style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)', opacity: loading ? 0.8 : 1 }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Verification Code Entry */
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex justify-between gap-2 max-w-xs mx-auto my-4" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength="1"
                    ref={inputRefs[idx]}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-11 h-13 text-center text-lg font-bold rounded-xl border border-[#A48374]/30 focus:outline-none focus:border-[#3A2D28] focus:ring-1 focus:ring-[#3A2D28] bg-[#FBF9F6] transition-colors"
                    style={{ color: '#3A2D28' }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-sm"
                style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)', opacity: loading ? 0.8 : 1 }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="font-medium text-[#3A2D28] hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-xs border-t border-[#F1EDE6] pt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
