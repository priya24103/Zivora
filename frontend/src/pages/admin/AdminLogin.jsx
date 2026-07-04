import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Admin login request
      const response = await axios.post('http://localhost:2409/api/admin/login', {
        email,
        password
      });

      if (response.data.status === 'success') {
        const { token, data } = response.data;
        // Save to admin session keys
        localStorage.setItem('zivora_admin_token', token);
        localStorage.setItem('zivora_admin_user', JSON.stringify(data.user));
        
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Admin Login failed:', err);
      const msg = err.response?.data?.message || 'Invalid administrator credentials. Access denied.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F1EDE6', fontFamily: 'Outfit, sans-serif' }}
    >
      <div 
        className="w-full max-w-md rounded-2xl shadow-xl p-8 border"
        style={{ backgroundColor: '#ffffff', borderColor: 'rgba(164, 131, 116, 0.2)' }}
      >
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 hover:rotate-12"
            style={{ backgroundColor: '#3A2D28' }}
          >
            <ShieldCheck className="w-8 h-8" style={{ color: '#F1EDE6' }} />
          </div>
          <h1 
            className="text-2xl font-semibold tracking-wide text-center" 
            style={{ color: '#3A2D28', fontFamily: 'Georgia, serif' }}
          >
            ZIVORA ADMIN
          </h1>
          <p className="text-xs tracking-widest uppercase mt-1" style={{ color: '#A48374' }}>
            Control Panel Login
          </p>
        </div>

        {errorMsg && (
          <div 
            className="mb-6 p-4 rounded-lg flex items-center gap-3 border text-sm"
            style={{ 
              backgroundColor: '#FFF5F5', 
              borderColor: '#FEB2B2', 
              color: '#C53030' 
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email"
              className="block text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: '#3A2D28' }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3.5 top-3.5 w-5 h-5" 
                style={{ color: '#A48374' }}
              />
              <input 
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zivora.com"
                className="w-full pl-11 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-300"
                style={{ 
                  borderColor: 'rgba(164, 131, 116, 0.4)',
                  color: '#3A2D28'
                }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password"
              className="block text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: '#3A2D28' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3.5 top-3.5 w-5 h-5" 
                style={{ color: '#A48374' }}
              />
              <input 
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all duration-300"
                style={{ 
                  borderColor: 'rgba(164, 131, 116, 0.4)',
                  color: '#3A2D28'
                }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-90 shadow-md"
            style={{ 
              backgroundColor: '#A48374', 
              color: '#ffffff'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
