import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:2409/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email and resetToken passed from ForgotPassword state
  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !resetToken) {
      setErrorMsg('Invalid session. Please start the password reset process again.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your input.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        resetToken,
        newPassword
      });

      if (response.data.status === 'success') {
        setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
        
        // Wait 1.5 seconds and redirect to /login page as requested
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. Please try again.');
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
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl mb-2" style={{ fontWeight: 300, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
            Reset Password
          </h1>
          <p className="text-xs tracking-wide" style={{ color: '#A48374' }}>
            Create a new strong password for your account
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white"
                  style={{ background: 'linear-gradient(135deg, #CBAD8D, #A48374)' }}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl mb-1" style={{ fontWeight: 300, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
                  Password Updated!
                </h3>
                <p className="text-xs text-[#A48374] max-w-xs">{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl flex items-start gap-3 text-xs"
                style={{ backgroundColor: '#FFF5F5', border: '1px solid #FFE3E3', color: '#E53E3E' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* New Password Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#3A2D28]">
                New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-[#A48374]" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-12 py-3 rounded-full text-sm focus:outline-none focus:ring-2 transition-shadow"
                  style={{
                    backgroundColor: '#F1EDE6',
                    color: '#3A2D28',
                    '--tw-ring-color': '#CBAD8D'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 p-1 text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#3A2D28]">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-[#A48374]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-11 pr-12 py-3 rounded-full text-sm focus:outline-none focus:ring-2 transition-shadow"
                  style={{
                    backgroundColor: '#F1EDE6',
                    color: '#3A2D28',
                    '--tw-ring-color': '#CBAD8D'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 p-1 text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                  Set New Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs border-t border-[#F1EDE6] pt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-[#A48374] hover:text-[#3A2D28] transition-colors cursor-pointer"
            >
              Back to Log In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
