'use client';

import React from 'react';
import { Game } from '@/types/game';
import { SEED_GAMES } from '@/data/seed-games';
import { X, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (game: Game) => void;
}

export function TemplatePickerModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatePickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-jumby-purple/20 border border-jumby-purple/40 flex items-center justify-center text-jumby-purple">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-heading font-black text-white">Inspired by Template</h3>
              <p className="text-xs text-zinc-400">Choose a game archetype or mechanic to start from</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 no-scrollbar">
          {SEED_GAMES.filter((g) => !g.isSponsored).map((game) => (
            <div
              key={game.id}
              onClick={() => {
                onSelectTemplate(game);
                onClose();
              }}
              className="group p-4 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-white/5 hover:border-jumby-lime/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-jumby-purple/40 to-jumby-lime/30 border border-white/10 flex items-center justify-center text-xl shrink-0">
                    <Gamepad2 className="w-5 h-5 text-jumby-lime" />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-black text-white group-hover:text-jumby-lime transition-colors">
                      {game.title}
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {game.tags.slice(0, 2).join(' • ')}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-jumby-lime group-hover:translate-x-0.5 transition-all" />
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {game.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-white/5 font-mono">
                <span>{game.controlsHint}</span>
                <span className="text-jumby-lime font-bold">Remix ⚡</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Don&apos;t want a template?</span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-jumby-lime hover:underline"
          >
            Start with Blank Slate
          </button>
        </div>
      </div>
    </div>
  );
}
