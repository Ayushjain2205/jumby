'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import { Game } from '@/types/game';

interface DedicatedGamePlayerProps {
  game: Game;
}

export function DedicatedGamePlayer({ game }: DedicatedGamePlayerProps) {
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://jumby.app/g/${game.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game.title} on Jumby`,
          text: `Play ${game.title} on Jumby!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden select-none">
      {/* Minimal Top Bar: Back, Game Name & Creator, Share */}
      <header className="relative z-30 flex items-center justify-between px-3 py-2.5 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 shrink-0">
        {/* Back Icon */}
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
          aria-label="Back to Explore"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Game Title & Creator */}
        <div className="flex flex-col items-center text-center px-2 min-w-0">
          <span className="text-sm font-black text-white truncate max-w-[200px] tracking-tight">
            {game.title}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[180px]">
            by @{game.creator.username}
          </span>
        </div>

        {/* Share Icon */}
        <button
          onClick={handleShare}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
          aria-label="Share game"
        >
          {copied ? (
            <Check className="w-4 h-4 text-jumby-lime" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </header>

      {/* Share Toast */}
      {copied && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-jumby-ink border border-jumby-lime/40 text-jumby-lime text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          Link copied to clipboard!
        </div>
      )}

      {/* Game Canvas Container (Mobile Dimension) */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          src={game.bundleUrl}
          title={game.title}
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  );
}
