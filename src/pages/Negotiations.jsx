import React from 'react';
import OfferInbox from '../components/OfferInbox';
import { Handshake, Sparkles } from 'lucide-react';

export default function Negotiations() {
  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-[#F7F3EF] px-4 md:px-8 py-8 flex flex-col font-sans">
      <div className="max-w-7xl w-full mx-auto mb-6">
        <h1 className="text-2xl md:text-3xl font-serif text-[#3A2D28] flex items-center gap-2.5">
          Active Negotiations <Sparkles className="w-5 h-5 text-[#CBAD8D]" />
        </h1>
        <p className="text-xs text-[#A48374] mt-1">
          Review counter-offers, direct price negotiations, and accept or modify deal terms.
        </p>
      </div>

      <div className="max-w-7xl w-full mx-auto bg-white rounded-3xl border border-[#CBAD8D]/20 p-6 md:p-8 shadow-xl">
        <OfferInbox />
      </div>
    </div>
  );
}
