'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Space, Sparkles } from 'lucide-react';
import { WalletProvider } from '@/context/WalletContext';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { RewardedAdModal } from '@/components/modals/RewardedAdModal';
import { CoinShopModal } from '@/components/modals/CoinShopModal';
import { JumbyLogo } from '@/components/brand/JumbyLogo';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <WalletProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-jumby-ink flex items-center justify-center font-sans">
        {/* Desktop Ambient Brand Glow */}
        <div className="absolute inset-0 pointer-events-none hidden md:block overflow-hidden">
          {/* Jumby Purple Glow */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-jumby-purple/15 rounded-full blur-[140px]" />
          {/* Jumby Lime Glow */}
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-jumby-lime/10 rounded-full blur-[150px]" />
          {/* Jumby Coral subtle warm touch */}
          <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-jumby-coral/10 rounded-full blur-[120px]" />
        </div>

        {/* Desktop Left Side Brand Overview (From Brand Swatch) */}
        <div className="hidden lg:flex flex-col gap-5 absolute left-12 top-1/2 -translate-y-1/2 max-w-[280px] pointer-events-none select-none">
          <div className="flex flex-col items-start gap-1">
            <JumbyLogo size="md" showSubtitle />
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="font-heading font-black text-xl text-white tracking-tight leading-snug">
              A world of games made by everyone.
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Jumby is a creative gaming platform where anyone can play, create, and share games together.
            </p>
          </div>

          {/* Color Swatch Dots */}
          <div className="flex items-center gap-2 pt-1">
            <div className="w-4 h-4 rounded-full bg-jumby-purple shadow-sm shadow-jumby-purple/50" title="Jumby Purple #7160FF" />
            <div className="w-4 h-4 rounded-full bg-jumby-lime shadow-sm shadow-jumby-lime/50" title="Jumby Lime #D8FF43" />
            <div className="w-4 h-4 rounded-full bg-jumby-coral shadow-sm shadow-jumby-coral/50" title="Jumby Coral #FF7657" />
            <div className="w-4 h-4 rounded-full bg-jumby-sky shadow-sm shadow-jumby-sky/50" title="Jumby Sky #4DB8FF" />
            <div className="w-4 h-4 rounded-full bg-jumby-lavender shadow-sm shadow-jumby-lavender/50" title="Jumby Lavender #E9E7FF" />
          </div>

          {/* Desktop Controls Guide */}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-heading">
              Quick Controls
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">
                  <ArrowUp className="w-3 h-3 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">
                  <ArrowDown className="w-3 h-3 inline" />
                </kbd>
              </div>
              <span>Swipe Games</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <kbd className="px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200 flex items-center gap-1">
                <Space className="w-3 h-3" /> Space
              </kbd>
              <span>Tap / Jump / Action</span>
            </div>
          </div>
        </div>

        {/* Mobile Device Frame */}
        <div className="relative w-full h-full md:w-[420px] md:h-[92vh] md:max-h-[860px] md:rounded-[44px] md:border-[5px] md:border-zinc-800/80 md:shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_80px_rgba(113,96,255,0.15)] overflow-hidden bg-jumby-ink flex flex-col z-10">
          {/* Inner Content (Feed + Modals) */}
          <div className="relative w-full h-full overflow-hidden bg-jumby-ink">
            {children}
            <PaymentModal />
            <RewardedAdModal />
            <CoinShopModal />
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
