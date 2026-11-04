'use client';

import React from 'react';
import { Game } from '@/types/game';
import { SEED_GAMES } from '@/data/seed-games';
import { X } from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (game: Game) => void;
}

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
  'make-a-tik-cvfv': '✨',
};

export function TemplatePickerModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatePickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header: Title and Close button only */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-base font-heading font-black text-white">Inspired by</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail & Name Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 no-scrollbar">
          {SEED_GAMES.filter((g) => !g.isSponsored).map((game, idx) => {
            const gradient = TILE_GRADIENTS[idx % TILE_GRADIENTS.length];
            const emoji = GAME_EMOJIS[game.slug] || '🎮';

            return (
              <button
                key={game.id}
                onClick={() => {
                  onSelectTemplate(game);
                  onClose();
                }}
                className="group flex flex-col items-center gap-2 p-1.5 rounded-2xl hover:bg-white/5 transition-all text-center focus:outline-none"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-jumby-lime group-hover:scale-105 shadow-md group-hover:shadow-xl transition-all duration-200 bg-zinc-900 flex items-center justify-center">
                  {game.thumbnailUrl ? (
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow-md select-none group-hover:scale-115 transition-transform duration-200">
                        {emoji}
                      </span>
                    </div>
                  )}
                  {/* Sheen on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Game Name */}
                <span className="text-xs font-heading font-black text-white group-hover:text-jumby-lime truncate w-full transition-colors">
                  {game.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
