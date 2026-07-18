import React from 'react';
import { Heart } from 'lucide-react';

/**
 * Reusable Heart Button for luxury product cards and details views
 * 
 * @param {boolean} isFavorited - Active/saved state indicator
 * @param {function} onClick - Click handler invoking API toggle action
 * @param {string} className - Extra style classes override
 */
export default function HeartButton({ isFavorited, onClick, className = '' }) {
  return (
    <button
      onClick={(e) => {
        // Prevent event propagation so clicking the heart doesn't navigate to the product detail page
        e.stopPropagation();
        e.preventDefault();
        if (onClick) onClick();
      }}
      className={`p-2.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-[#A48374] hover:text-[#3A2D28] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center ${className}`}
      title={isFavorited ? 'Remove from Wishlist' : 'Save to Wishlist'}
    >
      <Heart
        className={`w-4 h-4 transition-transform active:scale-95 ${
          isFavorited ? 'fill-red-500 text-red-500' : 'text-[#A48374] hover:text-[#3A2D28]'
        }`}
      />
    </button>
  );
}
