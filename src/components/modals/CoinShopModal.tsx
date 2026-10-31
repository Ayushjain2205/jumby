'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Coins, Sparkles, X, Plus, Check } from 'lucide-react';

export function CoinShopModal() {
  const { isShopOpen, closeShop, coins, addCoins } = useWallet();
  const [claimedDaily, setClaimedDaily] = useState(false);
  const [purchasedPack, setPurchasedPack] = useState<number | null>(null);

  if (!isShopOpen) return null;

  const handleClaimDaily = () => {
    if (claimedDaily) return;
    addCoins(50);
    setClaimedDaily(true);
  };

  const handleBuyPack = (amount: number) => {
    addCoins(amount);
    setPurchasedPack(amount);
    setTimeout(() => setPurchasedPack(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/10 p-5 shadow-2xl relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={closeShop}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Coins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Jumby Wallet</h3>
            <div className="text-xs text-zinc-400">Platform Coins & Store</div>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 rounded-2xl bg-black border border-white/10 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Your Balance</div>
            <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5">
              <span>🪙</span>
              <span>{coins}</span>
              <span className="text-xs text-zinc-400 font-normal">Coins</span>
            </div>
          </div>

          <button
            onClick={handleClaimDaily}
            disabled={claimedDaily}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              claimedDaily
                ? 'bg-zinc-800 text-zinc-500 border border-white/5'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{claimedDaily ? 'Claimed Today' : '+50 Free Daily'}</span>
          </button>
        </div>

        {/* Packs list */}
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Get More Coins</div>
        <div className="flex flex-col gap-2 mb-4">
          {[
            { coins: 100, price: 'FREE (Demo)', popular: false },
            { coins: 500, price: '$1.99 Mock', popular: true },
            { coins: 1500, price: '$4.99 Mock', popular: false },
          ].map((pack) => (
            <div
              key={pack.coins}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                pack.popular
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-white/10 bg-zinc-950/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🪙</span>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>+{pack.coins} Coins</span>
                    {pack.popular && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-extrabold uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">{pack.price}</div>
                </div>
              </div>

              <button
                onClick={() => handleBuyPack(pack.coins)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-extrabold text-white transition-all flex items-center gap-1"
              >
                {purchasedPack === pack.coins ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400">Added!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Get</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={closeShop}
          className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
