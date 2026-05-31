import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Direct connection to port 2409 configured in the backend environment
      const response = await axios.post('http://localhost:2409/api/auth/login', { 
        email, 
        password 
      });

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        const user = data.user;

        // Store session tokens
        localStorage.setItem('zivora_token', token);
        localStorage.setItem('zivora_user', JSON.stringify(user));

        setSuccessMsg(`Welcome back, ${user.name}! Redirecting...`);

        // Wait 1.5 seconds for a premium success transition before redirecting
        setTimeout(() => {
          if (!user.isVerified) {
            navigate('/verification-pending');
          } else if (user.role === 'seller') {
            navigate('/seller/dashboard');
          } else {
            navigate('/buyer/dashboard');
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Login error:', err);
      const apiError = err.response?.data?.message || 'Connection failed. Please ensure the server is running.';
      setErrorMsg(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F3EF' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-3" style={{ fontWeight: 300, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
            Welcome Back
          </h1>
          <p className="text-[15px]" style={{ color: '#A48374' }}>
            Sign in to access your account
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
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #CBAD8D, #A48374)' }}
                >
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl mb-1" style={{ fontWeight: 300, color: '#3A2D28', fontFamily: 'Georgia, serif' }}>
                  Authenticated Successfully
                </h3>
                <p className="text-xs text-[#A48374]">{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Status Feedback */}
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

            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#3A2D28]">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-[#A48374]" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-4 h-4 rounded border flex items-center justify-center transition-colors relative"
                     style={{ borderColor: '#A48374', backgroundColor: 'transparent' }}>
                   <input type="checkbox" className="w-full h-full opacity-0 cursor-pointer absolute" />
                   <div className="w-2 h-2 bg-[#3A2D28] rounded-sm opacity-0 group-has-[input:checked]:opacity-100 transition-opacity"></div>
                </div>
                <span className="font-medium text-[#3A2D28]">Remember me</span>
              </label>
              <Link to="/forgot-password" style={{ color: '#A48374' }} className="hover:text-[#3A2D28] transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #A48374, #3A2D28)', opacity: loading ? 0.8 : 1 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm">
            <span style={{ color: '#6B5549' }}>Don't have an account? </span>
            <Link to="/signup" className="font-medium hover:underline" style={{ color: '#A48374' }}>
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
