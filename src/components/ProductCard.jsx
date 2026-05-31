import React from 'react';
import { Heart } from 'lucide-react';

export default function ProductCard({ name, price, image, carat, cut, color, clarity, certification }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col h-full" style={{ border: '1px solid rgba(203,173,141,0.2)' }}>
      <div className="relative h-56 bg-black flex-shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover opacity-90" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white text-[10px] font-medium rounded-full text-[#3A2D28] tracking-wide">
            {certification}
          </span>
        </div>
        <button className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-1 mb-3">
           <span className="text-[#CBAD8D] text-xs">★★★★★</span>
           <span className="text-xs text-gray-400">(24)</span>
        </div>
        
        <h3 className="text-sm font-semibold mb-4 text-[#3A2D28] leading-snug">{name}</h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2 py-1 text-[10px] rounded-full bg-[#F7F3EF] text-[#6B5549] border border-[#EBE3DB]">{carat} ct</span>
          <span className="px-2 py-1 text-[10px] rounded-full bg-[#F7F3EF] text-[#6B5549] border border-[#EBE3DB]">{cut}</span>
          <span className="px-2 py-1 text-[10px] rounded-full bg-[#F7F3EF] text-[#6B5549] border border-[#EBE3DB]">{color}</span>
          <span className="px-2 py-1 text-[10px] rounded-full bg-[#F7F3EF] text-[#6B5549] border border-[#EBE3DB]">{clarity}</span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-[#EBE3DB] flex items-end justify-between">
          <div>
            <p className="text-[9px] text-[#A48374] uppercase tracking-widest mb-1">Starting At</p>
            <p className="text-lg font-medium text-[#3A2D28]" style={{ fontFamily: 'Georgia, serif' }}>${price.toLocaleString()}</p>
          </div>
          <button className="flex items-center gap-1.5 px-5 py-2 rounded-full text-white text-xs font-medium" style={{ backgroundColor: '#A48374' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
