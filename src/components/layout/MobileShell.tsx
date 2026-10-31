'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Space, Gamepad2 } from 'lucide-react';
import { WalletProvider } from '@/context/WalletContext';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { RewardedAdModal } from '@/components/modals/RewardedAdModal';
import { CoinShopModal } from '@/components/modals/CoinShopModal';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <WalletProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-[#05060b] flex items-center justify-center">
        {/* Desktop Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none hidden md:block overflow-hidden">
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[140px]" />
        </div>

        {/* Desktop Left Side Info Banner */}
        <div className="hidden lg:flex flex-col gap-6 absolute left-12 top-1/2 -translate-y-1/2 max-w-[240px] pointer-events-none select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-2xl tracking-tight text-white">jumby</div>
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">TikTok for Games</div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Swipe through instant-play user-generated micro-games. Play, earn Jumby Coins, and explore.
          </p>

          {/* Desktop Controls Guide */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Keyboard Shortcuts</div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="flex gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">
                  <ArrowUp className="w-3 h-3 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200">
                  <ArrowDown className="w-3 h-3 inline" />
                </kbd>
              </div>
              <span>Swipe Games</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-200 flex items-center gap-1">
                <Space className="w-3 h-3" /> Space
              </kbd>
              <span>Tap / Jump / Action</span>
            </div>
          </div>
        </div>

        {/* Mobile Device Frame */}
        <div className="relative w-full h-full md:w-[420px] md:h-[92vh] md:max-h-[860px] md:rounded-[42px] md:border-[6px] md:border-zinc-800/80 md:shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_80px_rgba(0,240,255,0.08)] overflow-hidden bg-black flex flex-col z-10">
          {/* Subtle Mobile Speaker Notch on Desktop */}
          <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-900 rounded-full z-50 pointer-events-none" />

          {/* Inner Content (Feed + Modals) */}
          <div className="relative w-full h-full overflow-hidden">
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
