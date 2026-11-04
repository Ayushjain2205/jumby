'use client';

import React from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { Flame, Sparkles } from 'lucide-react';

interface GameTileProps {
  game: Game;
  index: number;
}

// Preset playful color themes for tiles to recreate the rich Friv mosaic vibe
const TILE_GRADIENTS = [
  'from-violet-600 via-purple-700 to-indigo-900',
  'from-emerald-500 via-teal-600 to-cyan-900',
  'from-rose-500 via-pink-600 to-purple-900',
  'from-amber-500 via-orange-600 to-red-900',
  'from-cyan-500 via-blue-600 to-slate-900',
  'from-fuchsia-600 via-pink-600 to-rose-950',
  'from-lime-500 via-emerald-600 to-teal-950',
  'from-sky-500 via-indigo-600 to-violet-950',
];

const GAME_EMOJIS: Record<string, string> = {
  'sky-islands': '🏝️',
  'flappy-neon': '⚡',
  'build-and-chill': '🧱',
  'laser-dodge': '🎯',
  'cyberdrift-ad': '🏎️',
  'chroma-jump': '🌈',
  'pixel-dash': '🏃',
  'tower-slice': '🏛️',
  'orbit-clash': '🪐',
  'space-blast': '🚀',
  'gravity-flip': '🔄',
  'make-a-tik-cvfv': '✨',
};

export function GameTile({ game, index }: GameTileProps) {
  const gradient = TILE_GRADIENTS[index % TILE_GRADIENTS.length];
  const emoji = GAME_EMOJIS[game.slug] || '🎮';
  const isHot = game.stats.plays > 80000;
  const isAi = game.tags.some((t) => t.toLowerCase().includes('ai'));

  return (
    <Link
      href={`/g/${game.slug}`}
      className="group relative flex flex-col aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-jumby-lime/80 shadow-md hover:shadow-xl hover:shadow-jumby-purple/20 transition-all duration-200 active:scale-95 hover:-translate-y-1 select-none cursor-pointer bg-zinc-900"
    >
      {/* Dynamic Vibrant Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

      {/* Grid Pattern Texture Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:12px_12px] opacity-40 group-hover:opacity-60 transition-opacity" />

      {/* Badge (Hot or AI) */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
        {isHot && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-jumby-coral border border-jumby-coral/30">
            <Flame className="w-2.5 h-2.5 fill-jumby-coral" />
            <span className="hidden sm:inline">Hot</span>
          </span>
        )}
        {isAi && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-jumby-lime border border-jumby-lime/30">
            <Sparkles className="w-2.5 h-2.5 fill-jumby-lime" />
            <span className="hidden sm:inline">AI</span>
          </span>
        )}
      </div>

      {/* Center Mascot / Emoji Visual */}
      <div className="relative flex-1 flex items-center justify-center pt-2">
        <span className="text-3xl sm:text-4xl md:text-5xl group-hover:scale-125 transition-transform duration-200 drop-shadow-md">
          {emoji}
        </span>
      </div>

      {/* Bottom Title Scrim */}
      <div className="relative z-10 p-2 sm:p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end">
        <span className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight group-hover:text-jumby-lime transition-colors">
          {game.title}
        </span>
        <div className="flex items-center justify-between text-[10px] text-zinc-300/80 font-medium pt-0.5">
          <span className="truncate max-w-[80px]">@{game.creator.username}</span>
          <span className="hidden xs:inline font-mono text-[9px] text-zinc-400">
            {game.stats.plays > 1000
              ? `${Math.round(game.stats.plays / 1000)}k`
              : game.stats.plays}
          </span>
        </div>
      </div>
    </Link>
  );
}
