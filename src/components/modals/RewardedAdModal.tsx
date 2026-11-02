'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { X, Check, Gift, Play, ArrowRight } from 'lucide-react';

export function RewardedAdModal() {
  const { adRequest, completeAdReward, cancelAd, addCoins } = useWallet();
  const [timeLeft, setTimeLeft] = useState(5);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (!adRequest) {
      setTimeLeft(5);
      setCanClaim(false);
      return;
    }

    setTimeLeft(5);
    setCanClaim(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [adRequest]);

  if (!adRequest) return null;

  const handleClaim = () => {
    addCoins(10);
    completeAdReward();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-jumby-ink/90 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-xs rounded-[32px] bg-zinc-950 border border-jumby-lavender/15 overflow-hidden shadow-2xl flex flex-col">
        {/* Top Ad Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-jumby-lime text-jumby-ink shadow-sm">
              Sponsored
            </span>
            <span className="text-xs font-heading font-bold text-zinc-300">Jumby Ads</span>
          </div>

          {canClaim ? (
            <button
              onClick={handleClaim}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-mono font-bold text-jumby-lime">
              {timeLeft}s
            </div>
          )}
        </div>

        {/* Video / Creative Simulation */}
        <div className="relative h-64 bg-gradient-to-b from-jumby-purple/80 via-indigo-950 to-jumby-ink p-4 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Animated Glow Rings */}
          <div className="absolute w-48 h-48 rounded-full border border-jumby-sky/20 animate-ping" />
          <div className="absolute w-36 h-36 rounded-full border border-jumby-lime/30" />

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-jumby-purple to-jumby-sky flex items-center justify-center shadow-2xl shadow-jumby-purple/50 mb-3 z-10">
            <Play className="w-7 h-7 text-white fill-current ml-0.5" />
          </div>

          <div className="text-lg font-heading font-black text-white tracking-tight z-10">
            SKY ISLANDS 3D
          </div>
          <div className="text-xs text-zinc-300 max-w-[210px] z-10 mb-2 font-sans">
            Explore endless floating worlds built by creators.
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-heading font-bold text-jumby-lime z-10">
            <Gift className="w-3.5 h-3.5" />
            <span>Reward: Revive + 10 Free Coins</span>
          </div>

          {/* Progress Bar in Jumby Lime */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-jumby-lime transition-all duration-1000 ease-linear shadow-sm shadow-jumby-lime"
              style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 bg-zinc-900 border-t border-white/10 flex flex-col gap-2">
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 rounded-full bg-jumby-lime font-heading font-black text-xs text-jumby-ink shadow-lg shadow-jumby-lime/25 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Claim Reward & Revive</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <div className="text-center py-2.5 text-xs font-heading font-bold text-zinc-400">
              Reward unlocks in {timeLeft} seconds...
            </div>
          )}

          <button
            onClick={cancelAd}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors text-center font-sans"
          >
            Skip ad (forfeit reward)
          </button>
        </div>
      </div>
    </div>
  );
}
