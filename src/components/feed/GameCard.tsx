'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { useWallet } from '@/context/WalletContext';
import {
  Heart,
  Share2,
  RotateCcw,
  Check,
  Gamepad2,
  ExternalLink,
} from 'lucide-react';

interface GameCardProps {
  game: Game;
  isActive: boolean;
}

export function GameCard({ game, isActive }: GameCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { coins, openShop, requestPayment, requestRewardedAd } = useWallet();

  const [likes, setLikes] = useState(game.stats.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gameOverScore, setGameOverScore] = useState<number | null>(null);

  // Listen to sandbox postMessages for game over, IAP, and rewarded ads
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'JUMBY_GAME') return;

      if (data.type === 'JUMBY_GAME_OVER') {
        setGameOverScore(data.score ?? 0);
      } else if (data.type === 'JUMBY_BUY_ITEM') {
        // Native In-Game Purchase request from game
        requestPayment({
          requestId: data.requestId,
          item: data.item || 'Mystery Item',
          priceCoins: Number(data.priceCoins) || 10,
          gameTitle: game.title,
          onSuccess: () => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'JUMBY_BUY_RESPONSE',
                requestId: data.requestId,
                success: true,
                item: data.item,
              },
              '*'
            );
          },
          onCancel: () => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'JUMBY_BUY_RESPONSE',
                requestId: data.requestId,
                success: false,
              },
              '*'
            );
          },
        });
      } else if (data.type === 'JUMBY_SHOW_REWARDED_AD') {
        // Native Rewarded Ad request from game
        requestRewardedAd({
          requestId: data.requestId,
          sponsorName: 'Jumby Ads',
          rewardType: 'Revive & Bonus',
          onReward: () => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'JUMBY_AD_RESPONSE',
                requestId: data.requestId,
                rewardGranted: true,
              },
              '*'
            );
          },
          onClose: () => {
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'JUMBY_AD_RESPONSE',
                requestId: data.requestId,
                rewardGranted: false,
              },
              '*'
            );
          },
        });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [game.title, requestPayment, requestRewardedAd]);

  // When card becomes active/inactive, notify iframe
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    if (isActive) {
      setGameOverScore(null);
      iframeRef.current.contentWindow.postMessage({ type: 'JUMBY_RESUME' }, '*');
    } else {
      iframeRef.current.contentWindow.postMessage({ type: 'JUMBY_PAUSE' }, '*');
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/g/${game.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: game.title,
          text: `Play ${game.title} on Jumby!`,
          url: url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestart = () => {
    setGameOverScore(null);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src; // Reload iframe cleanly
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden select-none">
      {/* Sleek, Minimal Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/85 via-black/50 to-transparent">
        {/* Left: Brand + Title + Creator */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Link
            href="/"
            aria-label="Home"
            className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-md shadow-fuchsia-500/20 active:scale-95 transition-transform"
          >
            <Gamepad2 className="w-4 h-4 text-white" />
          </Link>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-xs text-white truncate drop-shadow">
                {game.title}
              </span>
              {game.isSponsored && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Ad
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium truncate">
              {game.isSponsored ? `Promoted by ${game.sponsorName}` : `@${game.creator.username}`}
            </span>
          </div>
        </div>

        {/* Right: Actions (Coins Wallet, Like, Share) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Jumby Coins Pill */}
          <button
            onClick={openShop}
            title="Open Jumby Coin Shop"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-black text-amber-300 backdrop-blur-md active:scale-95 transition-all shadow-sm"
          >
            <span>🪙</span>
            <span>{coins}</span>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition-all active:scale-90 ${
              isLiked
                ? 'bg-rose-500/90 text-white shadow-md shadow-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 text-zinc-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            aria-label="Share game"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-200 backdrop-blur-md active:scale-90 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 100% Uncluttered Game Canvas */}
      <iframe
        ref={iframeRef}
        src={game.bundleUrl}
        title={game.title}
        sandbox="allow-scripts allow-pointer-lock"
        className="w-full h-full border-0 z-0 bg-[#070714]"
      />

      {/* In-Feed Sponsored Ad CTA Overlay (Only on sponsored cards) */}
      {game.isSponsored && game.sponsorCta && (
        <div className="absolute bottom-5 left-4 right-4 z-20">
          <a
            href={game.sponsorUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-black font-black text-xs shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{game.sponsorCta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Clean Game Over Modal */}
      {gameOverScore !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl bg-zinc-900 border border-white/10 p-6 text-center shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">GAME OVER</div>
            <div className="text-5xl font-black text-white mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
              {gameOverScore}
            </div>
            <div className="text-xs text-zinc-400 mb-6">
              Personal Best: {Math.max(gameOverScore, game.stats.highScore || 0)}
            </div>

            <button
              onClick={handleRestart}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-lg hover:bg-zinc-200 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
