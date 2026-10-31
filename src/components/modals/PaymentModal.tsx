'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Coins, Check, X, AlertCircle } from 'lucide-react';

export function PaymentModal() {
  const { paymentRequest, coins, confirmPayment, cancelPayment, openShop } = useWallet();

  if (!paymentRequest) return null;

  const hasEnoughCoins = coins >= paymentRequest.priceCoins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-xs rounded-3xl bg-zinc-900 border border-white/10 p-6 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
          <Coins className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
          In-Game Purchase
        </div>
        <h3 className="text-lg font-black text-white mb-1">
          {paymentRequest.item}
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Unlock item in {paymentRequest.gameTitle || 'this game'}
        </p>

        {/* Cost & Balance Card */}
        <div className="p-3 rounded-2xl bg-black border border-white/10 mb-5 flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-zinc-400 font-medium">Price</div>
            <div className="flex items-center gap-1 text-sm font-black text-amber-400">
              <span>🪙</span>
              <span>{paymentRequest.priceCoins} Coins</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-zinc-400 font-medium">Your Balance</div>
            <div className="text-xs font-mono font-bold text-zinc-200">
              🪙 {coins}
            </div>
          </div>
        </div>

        {hasEnoughCoins ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={confirmPayment}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 font-extrabold text-xs text-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm & Pay 🪙 {paymentRequest.priceCoins}</span>
            </button>
            <button
              onClick={cancelPayment}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs text-zinc-300 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2 rounded-xl text-left mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Insufficient coins to complete this purchase.</span>
            </div>
            <button
              onClick={() => {
                cancelPayment();
                openShop();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 font-extrabold text-xs text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Get More Coins</span>
            </button>
            <button
              onClick={cancelPayment}
              className="w-full py-2 rounded-2xl text-xs text-zinc-400 hover:text-white transition-all"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
