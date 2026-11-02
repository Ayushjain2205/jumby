'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { JumbyAppIcon } from '@/components/brand/JumbyAppIcon';
import { Sparkles, X, Plus, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-jumby-ink/85 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="w-full max-w-sm rounded-[34px] bg-zinc-900 border border-jumby-lavender/15 p-5 shadow-2xl relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={closeShop}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with JumbyAppIcon */}
        <div className="flex items-center gap-3 mb-4">
          <JumbyAppIcon size={38} />
          <div>
            <h3 className="text-base font-heading font-black text-white">Jumby Wallet</h3>
            <div className="text-xs text-zinc-400 font-sans">Platform Coins & Store</div>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 rounded-2xl bg-jumby-ink border border-white/10 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-heading font-black">
              Your Balance
            </div>
            <div className="text-2xl font-heading font-black text-jumby-lime flex items-center gap-1.5">
              <span>🪙</span>
              <span>{coins}</span>
              <span className="text-xs text-zinc-400 font-normal font-sans">Coins</span>
            </div>
          </div>

          {/* Secondary Brand Button: Jumby Purple */}
          <button
            onClick={handleClaimDaily}
            disabled={claimedDaily}
            className={`px-3.5 py-2 rounded-full text-xs font-heading font-black transition-all flex items-center gap-1.5 ${
              claimedDaily
                ? 'bg-zinc-800 text-zinc-500 border border-white/5'
                : 'bg-jumby-purple hover:brightness-110 active:scale-95 text-white shadow-lg shadow-jumby-purple/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-jumby-lime" />
            <span>{claimedDaily ? 'Claimed' : '+50 Free'}</span>
          </button>
        </div>

        {/* Packs list */}
        <div className="text-xs font-heading font-black text-zinc-400 uppercase tracking-wider mb-2">
          Get More Coins
        </div>
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
                  ? 'border-jumby-lime/50 bg-jumby-lime/5 shadow-sm'
                  : 'border-white/10 bg-zinc-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🪙</span>
                <div>
                  <div className="text-xs font-heading font-black text-white flex items-center gap-1.5">
                    <span>+{pack.coins} Coins</span>
                    {pack.popular && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-jumby-lime text-jumby-ink font-heading font-black uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-sans">{pack.price}</div>
                </div>
              </div>

              <button
                onClick={() => handleBuyPack(pack.coins)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-black transition-all flex items-center gap-1 active:scale-95 ${
                  pack.popular
                    ? 'bg-jumby-lime text-jumby-ink hover:brightness-105 shadow-md shadow-jumby-lime/20'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {purchasedPack === pack.coins ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-jumby-lime stroke-[3]" />
                    <span className="text-jumby-lime">Added!</span>
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
          className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all font-sans"
        >
          Close
        </button>
      </div>
    </div>
  );
}
