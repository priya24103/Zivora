import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Diamond, FileText, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

export default function CreateRfq() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [shape, setShape] = useState('Round');
  const [carat, setCarat] = useState('');
  const [color, setColor] = useState('D');
  const [clarity, setClarity] = useState('VVS1');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!carat || !budget || !deadline) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('zivora_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const payload = {
        shape,
        carat: Number(carat),
        color,
        clarity,
        budget: Number(budget),
        deadline: new Date(deadline).toISOString()
      };

      const response = await axios.post('http://localhost:2409/api/rfq/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        alert('Request for Quote submitted successfully!');
        navigate('/buyer/dashboard');
      }
    } catch (err) {
      console.error('Error creating RFQ:', err);
      setError(err.response?.data?.message || 'Could not submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6 lg:px-16" style={{ backgroundColor: '#F7F3EF' }}>
      <div className="max-w-xl mx-auto">
        <button 
          onClick={() => navigate('/buyer/dashboard')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A48374] mb-8 hover:text-[#3A2D28] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#CBAD8D]/15"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#F7F3EF] text-[#A48374]">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: '#CBAD8D' }}>Bespoke Sourcing</span>
            <h1 className="text-3xl mt-2 text-[#3A2D28]" style={{ fontWeight: 200, fontFamily: 'Georgia, serif' }}>
              Request a Custom Quote
            </h1>
            <p className="text-xs text-[#A48374] mt-2 leading-relaxed max-w-sm mx-auto">
              Provide your required diamond specifications. Verified sellers will compete to offer you the best pricing from their inventory.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2">
                Diamond Shape
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
              >
                {['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'].map((sh) => (
                  <option key={sh} value={sh}>{sh}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2">
                  Carat Weight (e.g., 1.5) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.5"
                  value={carat}
                  onChange={(e) => setCarat(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2">
                  Color Grade
                </label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                >
                  {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map((col) => (
                    <option key={col} value={col}>{col} Grade</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2">
                  Clarity Grade
                </label>
                <select
                  value={clarity}
                  onChange={(e) => setClarity(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                >
                  {['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'].map((cl) => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2">
                  Max Budget (INR) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A48374] mb-2">
                Deadline Date *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl text-sm border border-[#CBAD8D]/20 focus:outline-none focus:border-[#A48374] bg-[#F7F3EF]/30 text-[#3A2D28]"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-full text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #A48374, #3A2D28)',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Submitting Request...' : 'Submit RFQ Request'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
