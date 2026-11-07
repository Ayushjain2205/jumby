'use client';

import React from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { getGameEmoji } from '@/lib/games/game-emojis';
import { playFrivTileHover, playFrivGameLaunch } from '@/lib/sound/friv-ui-sound';

interface GameTileProps {
  game: Game;
  index: number;
  isActive?: boolean;
  onHover?: (game: Game) => void;
  onLeave?: () => void;
}

// Iconic high-energy Friv mosaic color themes
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
  'from-indigo-600 via-purple-800 to-slate-950',
  'from-teal-500 via-emerald-700 to-emerald-950',
];

export function GameTile({ game, index, isActive = false, onHover, onLeave }: GameTileProps) {
  const gradient = TILE_GRADIENTS[index % TILE_GRADIENTS.length];
  const emoji = getGameEmoji(game.slug);

  const handleMouseEnter = () => {
    playFrivTileHover();
    if (onHover) onHover(game);
  };

  const handleMouseLeave = () => {
    if (onLeave) onLeave();
  };

  const handleClick = () => {
    playFrivGameLaunch();
  };

  return (
    <Link
      href={`/g/${game.slug}`}
      title={game.title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`group relative flex aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 transition-all duration-200 select-none cursor-pointer bg-zinc-900 ${
        isActive
          ? 'border-jumby-lime ring-4 ring-jumby-lime/40 scale-110 z-20 shadow-2xl shadow-jumby-lime/40'
          : 'border-white/10 hover:border-jumby-lime hover:ring-2 hover:ring-jumby-lime/40 hover:scale-115 hover:z-20 hover:shadow-xl hover:shadow-jumby-purple/40 active:scale-95'
      }`}
    >
      {/* Background Thumbnail or Vibrant Dynamic Gradient */}
      {game.thumbnailUrl ? (
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95 group-hover:opacity-100 transition-opacity`}
        />
      )}

      {/* Retro Arcade Subtle Dotted Texture Overlay */}
      {!game.thumbnailUrl && (
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff25_1px,transparent_1px)] [background-size:8px_8px] opacity-40 group-hover:opacity-75 transition-opacity" />
      )}

      {/* Center Iconic Game Visual (Classic Friv Style) */}
      {!game.thumbnailUrl && (
        <div className="relative flex-1 flex items-center justify-center p-2">
          <span className="text-3xl sm:text-4xl md:text-5xl group-hover:scale-125 transition-transform duration-200 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            {emoji}
          </span>
        </div>
      )}

      {/* Classic Friv Gloss / Resin Bulb Sheen (Arcade Button Reflection) */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none rounded-t-2xl" />

      {/* Floating Micro-Title on Hover */}
      <div className="absolute inset-x-1 bottom-1 px-1.5 py-0.5 rounded-lg bg-zinc-950/85 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
        <p className="text-[10px] font-black text-white truncate leading-tight">
          {game.title}
        </p>
      </div>
    </Link>
  );
}
