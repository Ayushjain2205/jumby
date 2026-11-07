'use client';

import React from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';

interface GameTileProps {
  game: Game;
  index: number;
}

// Preset playful color themes for tiles to recreate the iconic Friv mosaic vibe
const TILE_GRADIENTS = [
  'from-violet-600 via-purple-700 to-indigo-950',
  'from-emerald-500 via-teal-600 to-cyan-950',
  'from-rose-500 via-pink-600 to-purple-950',
  'from-amber-500 via-orange-600 to-red-950',
  'from-cyan-500 via-blue-600 to-slate-950',
  'from-fuchsia-600 via-pink-600 to-rose-950',
  'from-lime-500 via-emerald-600 to-teal-950',
  'from-sky-500 via-indigo-600 to-violet-950',
  'from-yellow-500 via-amber-600 to-orange-950',
  'from-red-600 via-rose-700 to-pink-950',
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
};

export function GameTile({ game, index }: GameTileProps) {
  const gradient = TILE_GRADIENTS[index % TILE_GRADIENTS.length];
  const emoji = GAME_EMOJIS[game.slug] || '🎮';

  return (
    <Link
      href={`/g/${game.slug}`}
      title={game.title}
      className="group relative flex aspect-square w-full rounded-2xl overflow-hidden border-2 border-white/10 hover:border-jumby-lime shadow-md hover:shadow-2xl hover:shadow-jumby-purple/30 transition-all duration-200 active:scale-95 hover:scale-105 select-none cursor-pointer bg-zinc-900"
    >
      {/* Background Thumbnail or Vibrant Dynamic Gradient */}
      {game.thumbnailUrl ? (
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95 group-hover:opacity-100 transition-opacity`} />
      )}

      {/* Grid Pattern Texture Overlay */}
      {!game.thumbnailUrl && (
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:10px_10px] opacity-40 group-hover:opacity-70 transition-opacity" />
      )}

      {/* Center Iconic Game Visual (Pure Friv Style) */}
      {!game.thumbnailUrl && (
        <div className="relative flex-1 flex items-center justify-center p-3">
          <span className="text-4xl sm:text-5xl md:text-6xl group-hover:scale-125 transition-transform duration-200 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {emoji}
          </span>
        </div>
      )}

      {/* Gloss / Sheen Highlight on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Link>
  );
}
