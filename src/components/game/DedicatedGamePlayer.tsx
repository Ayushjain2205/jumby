'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Check, RotateCcw, Trophy, Sparkles, X, Pencil, Volume2, VolumeX } from 'lucide-react';
import { Game } from '@/types/game';
import { JumbyCoin } from '@/components/brand/JumbyCoin';
import { useWallet } from '@/context/WalletContext';

interface DedicatedGamePlayerProps {
  game: Game;
}

interface RunSummary {
  finalScore: number;
  isNewBest: boolean;
  baseReward: number;
  milestoneReward: number;
  pickupReward: number;
  pickupItemName?: string;
  pickupItemIcon?: string;
  totalReward: number;
}

export function isImageUrl(val?: string): boolean {
  if (!val) return false;
  return (
    val.startsWith('/') ||
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('data:image/') ||
    val.endsWith('.svg') ||
    val.endsWith('.png') ||
    val.endsWith('.webp')
  );
}

export function ItemIcon({
  icon,
  className = 'w-3.5 h-3.5',
}: {
  icon?: string;
  className?: string;
}) {
  if (!icon) return null;
  if (isImageUrl(icon)) {
    return <img src={icon} alt="item" className={`${className} object-contain inline-block shrink-0`} />;
  }
  return <span className="inline-block leading-none">{icon}</span>;
}

export function DedicatedGamePlayer({ game }: DedicatedGamePlayerProps) {
  const { coins, addCoins, openShop, requestPayment, requestRewardedAd } = useWallet();

  const [copied, setCopied] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`jumby_hs_${game.id}`);
      if (saved) return parseInt(saved, 10) || 0;
    }
    return game.stats.highScore || 0;
  });

  const [sessionPickups, setSessionPickups] = useState(0);
  const [customItem, setCustomItem] = useState<{ name: string; icon: string } | null>(null);
  const [floatingCoin, setFloatingCoin] = useState<{ amount: number; icon?: string; label?: string } | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'JUMBY_HOST', type: 'JUMBY_SET_MUTE', muted: next },
      '*'
    );
  };

  // Play audio chime on coin reward
  const playRewardSound = (isBest: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const notes = isBest
        ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 (Major arpeggio)
        : [587.33, 880]; // D5, A5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isBest ? 'triangle' : 'sine';
        const start = ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {}
  };

  // Message listener for game SDK events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object' || data.source !== 'JUMBY_GAME') return;

      const postToGame = (payload: Record<string, unknown>) => {
        iframeRef.current?.contentWindow?.postMessage(payload, '*');
      };

      // 0. Live Audio Mute State Sync
      if (data.type === 'JUMBY_MUTE_STATE' && typeof data.muted === 'boolean') {
        setIsMuted(data.muted);
      }

      // 1. Live Score Update
      if (data.type === 'JUMBY_SCORE_UPDATE' && typeof data.score === 'number') {
        setCurrentScore(data.score);
      }

      // 2. In-Game Collectible Coin/Item Pickups
      if (data.type === 'JUMBY_AWARD_COINS') {
        const amount = Math.max(1, Number(data.amount) || 1);
        const itemName = data.item || 'Item';
        const itemIcon = data.icon || '';
        setCustomItem({ name: itemName, icon: itemIcon });
        addCoins(amount);
        setSessionPickups((prev) => prev + amount);

        // Show floating toast with custom item icon or name
        setFloatingCoin({ amount, icon: itemIcon, label: itemName });
        setTimeout(() => setFloatingCoin(null), 1500);
        playRewardSound(false);
      }

      // 3. Game Over & Scoring Conversion
      if (data.type === 'JUMBY_GAME_OVER') {
        const score = typeof data.score === 'number' ? data.score : currentScore;
        setCurrentScore(score);

        // Conversion Rules:
        // Base participation: +3 Coins
        const base = 3;

        // High Score / Performance Milestones:
        let milestone = 0;
        let isBest = false;

        if (score > highScore) {
          isBest = true;
          milestone = 15; // +15 Coins for breaking personal high score!
          setHighScore(score);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`jumby_hs_${game.id}`, String(score));
          }
        } else if (score >= Math.round(highScore * 0.5) && score > 0) {
          milestone = 5; // +5 Coins for a solid run (>50% of best)
        }

        const totalEarned = base + milestone;
        addCoins(totalEarned);
        playRewardSound(isBest);

        setRunSummary({
          finalScore: score,
          isNewBest: isBest,
          baseReward: base,
          milestoneReward: milestone,
          pickupReward: sessionPickups,
          pickupItemName: customItem?.name || 'Pickups',
          pickupItemIcon: customItem?.icon || '',
          totalReward: totalEarned + sessionPickups,
        });
      }

      // 4. In-Game Purchase (IAP)
      if (data.type === 'JUMBY_BUY_ITEM') {
        requestPayment({
          requestId: data.requestId,
          item: data.item || 'Mystery Item',
          priceCoins: Number(data.priceCoins) || 10,
          gameTitle: game.title,
          onSuccess: () => {
            postToGame({ type: 'JUMBY_BUY_RESPONSE', requestId: data.requestId, success: true, item: data.item });
          },
          onCancel: () => {
            postToGame({ type: 'JUMBY_BUY_RESPONSE', requestId: data.requestId, success: false });
          },
        });
      }

      // 5. Rewarded Ad
      if (data.type === 'JUMBY_SHOW_REWARDED_AD') {
        requestRewardedAd({
          requestId: data.requestId,
          sponsorName: 'Jumby Ads',
          rewardType: 'Revive & Bonus',
          onReward: () => {
            postToGame({ type: 'JUMBY_AD_RESPONSE', requestId: data.requestId, rewardGranted: true });
          },
          onClose: () => {
            postToGame({ type: 'JUMBY_AD_RESPONSE', requestId: data.requestId, rewardGranted: false });
          },
        });
      }

      // 6. Persistent Game Memory (localStorage-backed, namespaced per game)
      if (data.type === 'JUMBY_STORAGE_GET' && data.key) {
        let value: unknown = null;
        try {
          const raw = localStorage.getItem(`jumby_save_${game.id}_${data.key}`);
          value = raw === null ? null : JSON.parse(raw);
        } catch {
          value = null;
        }
        postToGame({ type: 'JUMBY_STORAGE_RESPONSE', requestId: data.requestId, value });
      }

      if (data.type === 'JUMBY_STORAGE_SET' && data.key) {
        let success = false;
        try {
          localStorage.setItem(`jumby_save_${game.id}_${data.key}`, JSON.stringify(data.value ?? null));
          success = true;
        } catch {
          success = false;
        }
        postToGame({ type: 'JUMBY_STORAGE_RESPONSE', requestId: data.requestId, success });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addCoins, currentScore, highScore, game.id, game.title, sessionPickups, customItem, requestPayment, requestRewardedAd]);

  const handleRestart = () => {
    setRunSummary(null);
    setCurrentScore(0);
    setSessionPickups(0);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

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
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden select-none font-sans">
      {/* Top Bar: Back, Title + Live Score, Coins Counter & Share */}
      <header className="relative z-30 flex items-center justify-between px-3 py-2 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 shrink-0">
        {/* Left: Back */}
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all shrink-0"
          aria-label="Back to Play"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Center: Title & Live Score */}
        <div className="flex flex-col items-center text-center px-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] tracking-tight">
              {game.title}
            </span>
            {highScore > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-400">
                <Trophy className="w-2.5 h-2.5" />
                <span>{highScore}</span>
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            Score: <span className="text-white font-bold">{currentScore}</span>
          </div>
        </div>

        {/* Right: Coins Counter & Share */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Jumby Coins Pill */}
          <button
            onClick={openShop}
            className="relative flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-jumby-lime/10 hover:bg-jumby-lime/20 border border-jumby-lime/30 text-jumby-lime text-xs font-heading font-black transition-all active:scale-95"
            title="Your Jumby Coins"
          >
            <JumbyCoin size="md" className="h-5 w-auto" />
            {floatingCoin && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-jumby-lime text-zinc-950 text-[10px] font-black shadow-md animate-bounce flex items-center gap-1 whitespace-nowrap">
                <span>+{floatingCoin.amount}</span>
                <ItemIcon icon={floatingCoin.icon} className="w-3 h-3" />
                {!floatingCoin.icon && <JumbyCoin size="xs" className="w-3 h-3" />}
              </span>
            )}
          </button>

          {/* Audio Mute/Unmute in Game Header */}
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-jumby-lime" />
            )}
          </button>

          {/* Edit Game Button */}
          <Link
            href={`/create?edit=${game.slug}`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all text-xs font-heading font-bold"
            title="Edit this game in Jumby Studio"
          >
            <Pencil className="w-3.5 h-3.5 text-jumby-lime" />
            <span>Edit</span>
          </Link>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
            aria-label="Share game"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-jumby-lime" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Share Toast */}
      {copied && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-jumby-ink border border-jumby-lime/40 text-jumby-lime text-xs font-bold shadow-lg animate-in fade-in duration-150">
          Link copied!
        </div>
      )}

      {/* Game Canvas Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          src={game.bundleUrl}
          title={game.title}
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        />

        {/* Arcade Run Complete & Coin Reward Modal */}
        {runSummary && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-xs rounded-3xl bg-zinc-900 border border-white/10 p-5 flex flex-col items-center text-center shadow-2xl relative">
              {/* Dismiss Button */}
              <button
                onClick={() => setRunSummary(null)}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Celebration Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-jumby-purple to-jumby-lime p-0.5 mb-3 shadow-lg shadow-jumby-purple/30 flex items-center justify-center">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-2xl">{runSummary.isNewBest ? '👑' : '🏆'}</span>
                </div>
              </div>

              {/* Title & Badge */}
              <h3 className="text-base font-heading font-black text-white">
                {runSummary.isNewBest ? 'New Personal Record!' : 'Run Complete!'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Score: <span className="font-bold text-white">{runSummary.finalScore}</span>
              </p>

              {/* Total Coins Earned Banner */}
              <div className="my-3.5 w-full py-2.5 px-3 rounded-2xl bg-jumby-lime/10 border border-jumby-lime/30 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-jumby-lime" />
                <span className="text-base font-heading font-black text-jumby-lime">
                  +{runSummary.totalReward} Coins
                </span>
                <JumbyCoin size="sm" className="w-5 h-5" />
              </div>

              {/* Coin Conversion Breakdown */}
              <div className="w-full space-y-1.5 text-[11px] text-zinc-400 border-t border-white/10 pt-2.5 mb-4 text-left">
                <div className="flex justify-between items-center">
                  <span>Round Completion</span>
                  <span className="text-white font-mono font-bold flex items-center gap-1">
                    +{runSummary.baseReward} <JumbyCoin size="xs" className="w-3.5 h-3.5" />
                  </span>
                </div>
                {runSummary.milestoneReward > 0 && (
                  <div className="flex justify-between items-center text-jumby-lime">
                    <span>{runSummary.isNewBest ? 'High Score Bonus' : 'Solid Run Bonus'}</span>
                    <span className="font-mono font-bold flex items-center gap-1">
                      +{runSummary.milestoneReward} <JumbyCoin size="xs" className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
                {runSummary.pickupReward > 0 && (
                  <div className="flex justify-between items-center text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <ItemIcon icon={runSummary.pickupItemIcon} className="w-3.5 h-3.5" />
                      <span>
                        {runSummary.pickupItemName || 'Pickups'} (x{runSummary.pickupReward})
                      </span>
                    </span>
                    <span className="font-mono font-bold flex items-center gap-1">
                      +{runSummary.pickupReward} <JumbyCoin size="xs" className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>

              {/* Play Again Button */}
              <button
                onClick={handleRestart}
                className="w-full py-2.5 rounded-full bg-jumby-lime hover:bg-lime-300 text-zinc-950 font-heading font-black text-xs transition-all active:scale-95 shadow-md shadow-jumby-lime/20 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[3]" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
