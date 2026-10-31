'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import {
  Heart,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  GitFork,
  Check,
} from 'lucide-react';

interface GameCardProps {
  game: Game;
  isActive: boolean;
  onRemix?: (game: Game) => void;
}

export function GameCard({ game, isActive, onRemix }: GameCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [likes, setLikes] = useState(game.stats.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [gameOverScore, setGameOverScore] = useState<number | null>(null);

  // Listen to sandbox postMessages for score and game over
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'JUMBY_GAME') return;

      if (data.type === 'JUMBY_SCORE_UPDATE') {
        setCurrentScore(data.score ?? 0);
      } else if (data.type === 'JUMBY_GAME_OVER') {
        setGameOverScore(data.score ?? 0);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // When card becomes active/inactive, notify iframe or restart if needed
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    if (isActive) {
      setGameOverScore(null);
      setCurrentScore(0);
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
          text: `Play ${game.title} on Jumby! Can you beat my score?`,
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
    setCurrentScore(0);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src; // Reload iframe
    }
  };

  const toggleFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      {/* Sandboxed Game Iframe Runner */}
      <iframe
        ref={iframeRef}
        src={game.bundleUrl}
        title={game.title}
        sandbox="allow-scripts allow-pointer-lock"
        className="w-full h-full border-0 z-0 bg-[#070714]"
      />

      {/* Top Left Live Score Badge */}
      {currentScore > 0 && gameOverScore === null && (
        <div className="absolute top-16 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono font-bold text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SCORE: {currentScore}</span>
        </div>
      )}

      {/* Right Action Rail (TikTok Style) */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
        {/* Creator Avatar with Follow Button */}
        <div className="relative mb-2">
          <div className="w-12 h-12 rounded-full border-2 border-white/80 overflow-hidden bg-zinc-800 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.creator.avatar} alt={game.creator.name} className="w-full h-full object-cover" />
          </div>
          <button className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform">
            +
          </button>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isLiked ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">{likes.toLocaleString()}</span>
        </button>

        {/* Remix Button */}
        <Link
          href={`/create?remix=${game.id}`}
          onClick={() => onRemix?.(game)}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-fuchsia-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 hover:brightness-110">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">Remix</span>
        </Link>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md">
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">{copied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform mt-2"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Metadata Overlay */}
      <div className="absolute left-0 bottom-0 right-16 p-4 pb-6 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
        {/* Creator Handle */}
        <div className="pointer-events-auto inline-flex items-center gap-2 mb-1">
          <span className="font-extrabold text-white text-base">@{game.creator.username}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
            {game.engine}
          </span>
        </div>

        {/* Game Title */}
        <h2 className="text-lg font-black text-white leading-tight mb-1 drop-shadow-md">
          {game.title}
        </h2>

        {/* Description / Controls */}
        <p className="text-xs text-zinc-300 line-clamp-2 max-w-sm drop-shadow mb-2.5">
          {game.description} • <span className="text-cyan-300 font-semibold">{game.controlsHint}</span>
        </p>

        {/* Remix Genealogy & Prompt Badge */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {game.parentGameTitle && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/40 text-[11px] font-bold text-fuchsia-300">
              <GitFork className="w-3 h-3" />
              <span>Remixed from {game.parentGameTitle}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300 max-w-xs truncate">
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{game.prompt}</span>
          </div>
        </div>
      </div>

      {/* Game Over HUD Modal (Overlay when game ends) */}
      {gameOverScore !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl bg-zinc-900/90 border border-white/10 p-6 text-center shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">GAME OVER</div>
            <div className="text-5xl font-black text-white mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
              {gameOverScore}
            </div>
            <div className="text-xs text-zinc-400 mb-6">
              Personal Best: {Math.max(gameOverScore, game.stats.highScore || 0)}
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-lg hover:bg-zinc-200 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>

              <Link
                href={`/create?remix=${game.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Remix This Game</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
