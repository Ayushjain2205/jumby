'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Sparkles, Plus, Search } from 'lucide-react';

interface AppHeaderProps {
  activeTab?: 'for-you' | 'following';
  onTabChange?: (tab: 'for-you' | 'following') => void;
}

export function AppHeader({ activeTab = 'for-you', onTabChange }: AppHeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">
          jumby
        </span>
      </div>

      {/* Feed Tabs: Following / For You */}
      <div className="flex items-center gap-6 pointer-events-auto">
        <button
          onClick={() => onTabChange?.('following')}
          className={`text-sm font-bold tracking-wide transition-all ${
            activeTab === 'following'
              ? 'text-white scale-105 border-b-2 border-white pb-0.5'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Following
        </button>
        <button
          onClick={() => onTabChange?.('for-you')}
          className={`text-sm font-bold tracking-wide transition-all ${
            activeTab === 'for-you'
              ? 'text-white scale-105 border-b-2 border-cyan-400 pb-0.5'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          For You
        </button>
      </div>

      {/* Right Controls: Search & Create */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          aria-label="Search games"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95"
        >
          <Search className="w-4 h-4" />
        </button>

        <Link
          href="/create"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Create</span>
        </Link>
      </div>
    </header>
  );
}
