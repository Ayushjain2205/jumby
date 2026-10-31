'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Sparkles, X, Check, Gift, Play } from 'lucide-react';

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
    addCoins(10); // Free +10 bonus coins for watching an ad!
    completeAdReward();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-xs rounded-3xl bg-zinc-950 border border-white/15 overflow-hidden shadow-2xl flex flex-col">
        {/* Top Ad Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Sponsored
            </span>
            <span className="text-xs font-bold text-zinc-300">Jumby Ads Engine</span>
          </div>

          {canClaim ? (
            <button
              onClick={handleClaim}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-mono font-bold text-zinc-400">
              {timeLeft}s
            </div>
          )}
        </div>

        {/* Video / Creative Simulation */}
        <div className="relative h-64 bg-gradient-to-b from-indigo-950 via-purple-950 to-black p-4 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Animated Background Rings */}
          <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20 animate-ping" />
          <div className="absolute w-36 h-36 rounded-full border border-fuchsia-500/30" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-cyan-500/40 mb-3 z-10">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>

          <div className="text-lg font-black text-white tracking-tight z-10">
            NEON DRIFT 2099
          </div>
          <div className="text-xs text-zinc-300 max-w-[200px] z-10 mb-2">
            The next-generation cyber arcade racer. Pre-register today!
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-cyan-300 z-10">
            <Gift className="w-3 h-3" />
            <span>Reward: Revive + 10 Free Coins</span>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 bg-zinc-900 border-t border-white/10 flex flex-col gap-2">
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 font-black text-xs text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Claim Reward & Revive</span>
            </button>
          ) : (
            <div className="text-center py-2.5 text-xs font-bold text-zinc-400">
              Reward unlocks in {timeLeft} seconds...
            </div>
          )}

          <button
            onClick={cancelAd}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors text-center"
          >
            Skip ad (forfeit reward)
          </button>
        </div>
      </div>
    </div>
  );
}
