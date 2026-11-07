'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { useWallet } from '@/context/WalletContext';
import { JumbyAppIcon } from '@/components/brand/JumbyAppIcon';
import { JumbyCoin } from '@/components/brand/JumbyCoin';
import {
  Heart,
  Share2,
  RotateCcw,
  Check,
  ExternalLink,
  ArrowRight,
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
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-jumby-ink overflow-hidden select-none">
      {/* Dedicated Top Bar Header (Not an overlay - can be modified later) */}
      <header className="w-full shrink-0 z-20 flex items-center justify-between px-3.5 py-2.5 bg-zinc-950 border-b border-white/10">
        {/* Left: Brand Icon + Title + Creator */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <Link href="/" aria-label="Jumby Home" className="active:scale-95 transition-transform shrink-0">
            <JumbyAppIcon size={32} />
          </Link>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-heading font-black text-xs text-white truncate drop-shadow">
                {game.title}
              </span>
              {game.isSponsored && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-jumby-lime/20 text-jumby-lime border border-jumby-lime/30 font-heading">
                  Ad
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium truncate font-sans">
              {game.isSponsored ? `Promoted by ${game.sponsorName}` : `@${game.creator.username}`}
            </span>
          </div>
        </div>

        {/* Right: Actions (Jumby Coins Pill, Coral Heart, Share) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Jumby Coins Pill with Lime Highlight */}
          <button
            onClick={openShop}
            title="Open Jumby Coin Shop"
            className="flex items-center gap-1.5 pl-2 pr-2.5 py-0.5 rounded-full bg-jumby-lime/15 hover:bg-jumby-lime/25 border border-jumby-lime/30 text-[11px] font-black text-jumby-lime backdrop-blur-md active:scale-95 transition-all shadow-sm font-heading"
          >
            <JumbyCoin size="sm" className="h-4 w-auto" />
            <span>{coins}</span>
          </button>

          {/* Like Button with Jumby Coral Accent (#FF7657) */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition-all active:scale-90 font-sans ${
              isLiked
                ? 'bg-jumby-coral text-white shadow-md shadow-jumby-coral/40'
                : 'bg-white/10 hover:bg-white/20 text-zinc-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-white' : 'text-jumby-coral'}`} />
            <span>{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share game"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-200 backdrop-blur-md active:scale-90 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-jumby-lime stroke-[3]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* 100% Uncluttered Game Canvas Area */}
      <div className="relative flex-1 w-full min-h-0 bg-[#070714] overflow-hidden">
        <iframe
          ref={iframeRef}
          src={game.bundleUrl}
          title={game.title}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          className="w-full h-full border-0 block"
        />

        {/* In-Feed Sponsored Ad CTA Overlay (Brand Lime Button) */}
        {game.isSponsored && game.sponsorCta && (
          <div className="absolute bottom-5 left-4 right-4 z-20">
            <a
              href={game.sponsorUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-full bg-jumby-lime hover:brightness-105 active:scale-98 text-jumby-ink font-heading font-black text-xs shadow-xl shadow-jumby-lime/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{game.sponsorCta}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        )}

        {/* Game Over Modal Styled with Jumby Swatch */}
        {gameOverScore !== null && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-jumby-ink/85 backdrop-blur-md p-6 animate-fade-in font-sans">
            <div className="w-full max-w-xs rounded-3xl bg-zinc-900 border border-jumby-lavender/15 p-6 text-center shadow-2xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-heading">
                GAME OVER
              </div>
              <div className="text-5xl font-heading font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-jumby-purple via-jumby-sky to-jumby-lime">
                {gameOverScore}
              </div>
              <div className="text-xs text-zinc-400 mb-6 font-sans">
                Personal Best: {Math.max(gameOverScore, game.stats.highScore || 0)}
              </div>

              {/* Primary Brand Button: Jumby Lime (#D8FF43) with Black text as per Swatch Spec */}
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-jumby-lime text-jumby-ink font-heading font-black text-xs shadow-lg shadow-jumby-lime/25 hover:brightness-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Play Again</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
