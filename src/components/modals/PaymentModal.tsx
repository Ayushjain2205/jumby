'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { JumbyCoin } from '@/components/brand/JumbyCoin';
import { Coins, Check, AlertCircle, ArrowRight } from 'lucide-react';

export function PaymentModal() {
  const { paymentRequest, coins, confirmPayment, cancelPayment, openShop } = useWallet();

  if (!paymentRequest) return null;

  const hasEnoughCoins = coins >= paymentRequest.priceCoins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-jumby-ink/85 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="w-full max-w-xs rounded-[32px] bg-zinc-900 border border-jumby-lavender/15 p-6 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-jumby-lime/20 text-jumby-lime flex items-center justify-center mx-auto mb-3 shadow-lg shadow-jumby-lime/10">
          <Coins className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="text-[10px] font-black font-heading text-zinc-400 uppercase tracking-widest mb-1">
          In-Game Purchase
        </div>
        <h3 className="text-lg font-heading font-black text-white mb-1">
          {paymentRequest.item}
        </h3>
        <p className="text-xs text-zinc-400 mb-4 font-sans">
          Unlock item in {paymentRequest.gameTitle || 'this game'}
        </p>

        {/* Cost & Balance Card */}
        <div className="p-3.5 rounded-2xl bg-jumby-ink border border-white/10 mb-5 flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-zinc-400 font-medium font-sans">Price</div>
            <div className="flex items-center gap-1.5 text-sm font-heading font-black text-jumby-lime">
              <JumbyCoin size="xs" className="w-4 h-4" />
              <span>{paymentRequest.priceCoins} Coins</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-zinc-400 font-medium font-sans">Your Balance</div>
            <div className="text-xs font-mono font-bold text-zinc-200 flex items-center justify-end gap-1">
              <JumbyCoin size="xs" className="w-3.5 h-3.5" />
              <span>{coins}</span>
            </div>
          </div>
        </div>

        {hasEnoughCoins ? (
          <div className="flex flex-col gap-2.5">
            {/* Primary Brand Button: Lime with Black text */}
            <button
              onClick={confirmPayment}
              className="w-full py-3.5 rounded-full bg-jumby-lime hover:brightness-105 active:scale-95 font-heading font-black text-xs text-jumby-ink shadow-lg shadow-jumby-lime/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="flex items-center gap-1">Confirm & Pay <JumbyCoin size="xs" className="w-3.5 h-3.5" /> {paymentRequest.priceCoins}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={cancelPayment}
              className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 font-bold text-xs text-zinc-400 hover:text-white transition-all font-sans"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-jumby-coral bg-jumby-coral/10 border border-jumby-coral/30 p-2.5 rounded-2xl text-left mb-1 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Insufficient coins to complete purchase.</span>
            </div>
            {/* Secondary Brand Button: Jumby Purple */}
            <button
              onClick={() => {
                cancelPayment();
                openShop();
              }}
              className="w-full py-3.5 rounded-full bg-jumby-purple hover:brightness-110 active:scale-95 font-heading font-black text-xs text-white shadow-lg shadow-jumby-purple/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Get More Coins</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={cancelPayment}
              className="w-full py-2 rounded-full text-xs text-zinc-400 hover:text-white transition-all font-sans"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
