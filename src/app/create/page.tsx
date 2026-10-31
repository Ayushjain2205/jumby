'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Upload,
  Code,
  Eye,
  Check,
  Zap,
  Sliders,
  Share2,
} from 'lucide-react';
import { SEED_GAMES } from '@/data/seed-games';
import { generateGameHtml, GameTemplateConfig } from '@/lib/templates/game-generator';

const THEMES = [
  { name: 'Neon Cyber', themeColor: '#00f0ff', accentColor: '#ff0077', bg: ['#070714', '#170b28'] as [string, string] },
  { name: 'Solar Flare', themeColor: '#facc15', accentColor: '#ef4444', bg: ['#120804', '#2a0808'] as [string, string] },
  { name: 'Toxic Emerald', themeColor: '#10b981', accentColor: '#8b5cf6', bg: ['#04140b', '#0a1f18'] as [string, string] },
  { name: 'Hyper Violet', themeColor: '#c084fc', accentColor: '#38bdf8', bg: ['#0c061a', '#1e0a38'] as [string, string] },
];

function CreateStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const remixId = searchParams.get('remix');

  const parentGame = remixId ? SEED_GAMES.find((g) => g.id === remixId) : null;

  const [prompt, setPrompt] = useState(
    parentGame
      ? `Remix of ${parentGame.title}: ${parentGame.prompt}, but with faster speed and neon trail`
      : 'A neon space runner dodging laser hazards and collecting yellow energy crystals'
  );

  const [title, setTitle] = useState(
    parentGame ? `${parentGame.title} (Remix)` : 'Neon Dash Zero'
  );

  const [speedMultiplier, setSpeedMultiplier] = useState(1.2);
  const [gravity, setGravity] = useState(0.38);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Active game HTML in-memory
  const [gameHtml, setGameHtml] = useState<string>('');

  const buildHtml = (customConfig?: Partial<GameTemplateConfig>) => {
    const theme = THEMES[selectedThemeIndex];
    return generateGameHtml({
      title,
      themeColor: theme.themeColor,
      accentColor: theme.accentColor,
      bgGradient: theme.bg,
      gameType: 'flappy',
      speedMultiplier,
      gravity,
      ...customConfig,
    });
  };

  useEffect(() => {
    const initialCode = buildHtml();
    setGameHtml(initialCode);
    setHistory([initialCode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Instant in-memory generation
    setTimeout(() => {
      const nextCode = buildHtml();
      setHistory((prev) => [...prev, gameHtml]);
      setGameHtml(nextCode);
      setIsGenerating(false);
    }, 400);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setGameHtml(previous);
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const handlePublish = () => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setPublishedSlug(slug);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07080f] text-white overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-white/10 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-white">{title}</span>
              {parentGame && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 font-semibold">
                  Remix
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">Jumby Studio • In-Memory Fast Live Preview</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-300 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          <div className="flex bg-zinc-800 rounded-full p-0.5 border border-white/5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'preview' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === 'code' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Source</span>
            </button>
          </div>

          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:brightness-110 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Main Studio Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Control & Prompt Panel */}
        <div className="w-full md:w-[420px] bg-zinc-950 border-r border-white/10 flex flex-col p-4 overflow-y-auto shrink-0 no-scrollbar">
          {/* Prompt Box */}
          <div className="mb-4">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prompt / Remix Instruction</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-2xl bg-zinc-900 border border-white/10 p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all resize-none shadow-inner"
              placeholder="Describe your game idea, mechanics, or modifications..."
            />
          </div>

          {/* Quick Prompts */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Try Modifiers</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Make it 2x faster',
                'Lower gravity floaty',
                'Neon laser obstacles',
                'Rainbow trail',
                'Retro 8-bit sound',
              ].map((mod) => (
                <button
                  key={mod}
                  onClick={() => {
                    setPrompt((prev) => `${prev}, ${mod.toLowerCase()}`);
                    if (mod.includes('faster')) setSpeedMultiplier((s) => s * 1.4);
                    if (mod.includes('floaty')) setGravity((g) => g * 0.7);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-zinc-300 transition-all active:scale-95"
                >
                  + {mod}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Theme Picker */}
          <div className="mb-4">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Visual Palette</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme, i) => (
                <button
                  key={theme.name}
                  onClick={() => setSelectedThemeIndex(i)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    selectedThemeIndex === i
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: theme.themeColor }}
                  />
                  <span className="text-xs font-bold text-zinc-200 truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fine Tuning Sliders */}
          <div className="mb-6 space-y-3 p-3 rounded-2xl bg-zinc-900/40 border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-400 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Game Speed
              </span>
              <span className="font-mono text-cyan-400 font-bold">{speedMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-zinc-400 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Gravity Force
              </span>
              <span className="font-mono text-fuchsia-400 font-bold">{gravity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.8"
              step="0.05"
              value={gravity}
              onChange={(e) => setGravity(parseFloat(e.target.value))}
              className="w-full accent-fuchsia-400 cursor-pointer"
            />
          </div>

          {/* Generate / Apply Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:brightness-110 active:scale-98 transition-all font-black text-sm text-white shadow-xl shadow-fuchsia-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isGenerating ? 'Compiling in-memory...' : 'Update Live Preview'}</span>
          </button>
        </div>

        {/* Right Canvas / Code Workspace */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden p-2 md:p-6">
          {activeTab === 'preview' ? (
            <div className="relative w-full max-w-[420px] h-full max-h-[750px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 bg-[#070714]">
              {/* In-Memory Instant Preview Iframe */}
              <iframe
                title="Live Game Preview"
                srcDoc={gameHtml}
                sandbox="allow-scripts allow-pointer-lock"
                className="w-full h-full border-0"
              />

              {/* Status Pill */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>IN-MEMORY • 60 FPS</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full max-w-3xl rounded-2xl bg-zinc-950 border border-white/10 p-4 font-mono text-xs overflow-auto">
              <pre className="text-cyan-300 whitespace-pre-wrap">{gameHtml}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Publish Success Modal */}
      {publishedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/10 p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Game Published!</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Your game is now live in the Jumby recommendation feed and has its own shareable link.
            </p>

            <div className="p-3 rounded-2xl bg-black border border-white/10 font-mono text-xs text-cyan-400 mb-5 break-all select-all">
              jumby.app/g/{publishedSlug}
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/g/${publishedSlug}`}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 font-extrabold text-xs text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Play in Feed Now</span>
              </Link>
              <button
                onClick={() => setPublishedSlug(null)}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs text-zinc-300 transition-all"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateStudioPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black text-white flex items-center justify-center">Loading Studio...</div>}>
      <CreateStudioContent />
    </Suspense>
  );
}
