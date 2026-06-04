'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Inbox, MapPin, ArrowRight } from 'lucide-react';

export default function NextOrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve orderId from query params, otherwise generate mock ID
  const orderId = searchParams.get('orderId') || `ZIV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  return (
    <div className="min-h-screen py-20 px-6 flex items-center justify-center bg-[#F1EDE6] animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-[36px] p-8 md:p-12 border border-[#E6DFD6] text-center shadow-lg relative overflow-hidden">
        {/* Decorative Luxury Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#A48374] via-[#CBAD8D] to-[#3A2D28]"></div>

        <div className="w-16 h-16 bg-[#F7F3EF] rounded-full flex items-center justify-center mx-auto mb-8 border border-[#EBE3DB]">
          <Check className="w-8 h-8 text-[#A48374]" />
        </div>

        <span className="text-[10px] uppercase tracking-[0.25em] text-[#CBAD8D] font-bold block mb-2">Acquisition Complete</span>
        <h1 className="font-serif text-3xl text-[#3A2D28] mb-4">Thank You for Your Order</h1>
        <p className="text-xs text-[#A48374] max-w-sm mx-auto leading-relaxed mb-8">
          Your reservation is verified. We are preparing to dispatch your selected item(s) from our secure vaults.
        </p>

        {/* Order Details Panel */}
        <div className="bg-[#FBF9F6] border border-[#E6DFD6] rounded-2xl p-5 mb-8 text-left space-y-4 text-xs">
          <div className="flex justify-between border-b border-[#F7F3EF] pb-3">
            <span className="text-[#A48374] font-medium">Order Reference ID</span>
            <span className="font-bold text-[#3A2D28] font-mono tracking-wider">{orderId}</span>
          </div>

          <div className="flex items-start gap-3 text-[11px] text-[#3A2D28]/80 leading-normal">
            <Inbox className="w-4 h-4 text-[#A48374] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#3A2D28]">Email Receipt Dispatched</p>
              <p className="text-[#A48374] mt-0.5">A copy of the sales contract and logistics schedule has been sent to your registered inbox.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-[11px] text-[#3A2D28]/80 leading-normal">
            <MapPin className="w-4 h-4 text-[#A48374] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#3A2D28]">Insured Freight Tracking</p>
              <p className="text-[#A48374] mt-0.5">You will receive real-time FedEx/Armored Courier tracking details within 24-48 hours.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/products')}
            className="flex-1 py-4 bg-[#3A2D28] text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            Return to Store
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              alert('Tracking systems are loading. A secure representative will call your number to finalize courier timing.');
            }}
            className="flex-1 py-4 border border-[#E6DFD6] text-[#3A2D28] text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-[#F7F3EF] transition-colors cursor-pointer bg-white"
          >
            Track Order
          </button>
        </div>
      </div>
    </div>
  );
}
