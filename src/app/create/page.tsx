'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Upload,
  Code,
  Eye,
  Check,
  Sliders,
  Volume2,
  FolderKanban,
  MessageSquare,
  Palette,
  Send,
  Share2,
  Play,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { SEED_GAMES } from '@/data/seed-games';
import {
  generateGameHtml,
  GameTemplateConfig,
  GameArchetype,
} from '@/lib/templates/game-generator';
import { JumbyMascot } from '@/components/brand/JumbyMascot';

const THEMES = [
  { name: 'Jumby Purple & Lime', themeColor: '#7160FF', accentColor: '#D8FF43', bg: ['#0F0F0F', '#1D173F'] as [string, string] },
  { name: 'Jumby Coral & Sky', themeColor: '#FF7657', accentColor: '#4DB8FF', bg: ['#0F0F0F', '#261218'] as [string, string] },
  { name: 'Jumby Lime Glow', themeColor: '#D8FF43', accentColor: '#7160FF', bg: ['#0F0F0F', '#1A2408'] as [string, string] },
  { name: 'Jumby Sky Chill', themeColor: '#4DB8FF', accentColor: '#FF7657', bg: ['#0F0F0F', '#0C1E2B'] as [string, string] },
];

const ARCHETYPES: { id: GameArchetype; name: string; icon: string; desc: string }[] = [
  { id: 'flappy', name: 'Flappy Jumper', icon: '🐦', desc: 'Tap to flap through vertical obstacles' },
  { id: 'orbit', name: 'Orbital Pulse', icon: '🪐', desc: 'Reverse orbit direction to dodge lasers' },
  { id: 'stack', name: 'Stack Slice', icon: '🧱', desc: 'Precision rhythm block slicing tower' },
  { id: 'runner', name: 'Cyber Runner', icon: '🏎️', desc: '3-lane obstacle dodging at high speed' },
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

function CreateStudioContent() {
  const searchParams = useSearchParams();
  const remixId = searchParams.get('remix');
  const parentGame = remixId ? SEED_GAMES.find((g) => g.id === remixId) : null;

  // Active Game State
  const [title, setTitle] = useState(
    parentGame ? `${parentGame.title} (Remix)` : 'Neon Dash 2099'
  );
  const [archetype, setArchetype] = useState<GameArchetype>('flappy');
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.2);
  const [gravity, setGravity] = useState(0.38);

  // Left Studio Panel Tabs: 'chat' | 'templates' | 'theme'
  const [panelTab, setPanelTab] = useState<'chat' | 'templates' | 'theme'>('chat');

  // Preview Workspace Tabs: 'preview' | 'code'
  const [workspaceTab, setWorkspaceTab] = useState<'preview' | 'code'>('preview');

  // Generation / Prompt State
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);

  // Conversation History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'assistant',
      text: parentGame
        ? `Remixing **${parentGame.title}**. What would you like to modify? (e.g. "make it 2x faster", "change color to coral", "lower gravity")`
        : "Hey creator! What kind of game do you want to build today? Type a prompt or pick a starter template below.",
      timestamp: 'Just now',
    },
  ]);

  // Game Code & Undo History
  const [gameHtml, setGameHtml] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildHtml = (customConfig?: Partial<GameTemplateConfig>) => {
    const theme = THEMES[selectedThemeIndex];
    return generateGameHtml({
      title,
      themeColor: theme.themeColor,
      accentColor: theme.accentColor,
      bgGradient: theme.bg,
      gameType: archetype,
      speedMultiplier,
      gravity,
      ...customConfig,
    });
  };

  useEffect(() => {
    const code = buildHtml();
    setGameHtml(code);
    setHistory([code]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    // Multi-step agentic generation simulation
    setGenerationStep('🧠 Analyzing game mechanics...');
    setTimeout(() => {
      setGenerationStep('🎨 Synthesizing shaders & assets...');
    }, 400);

    setTimeout(() => {
      setGenerationStep('🔊 Synthesizing 8-bit sound effects...');
    }, 800);

    setTimeout(() => {
      // Parse prompt modifiers
      let newSpeed = speedMultiplier;
      let newGravity = gravity;
      let newTheme = selectedThemeIndex;
      let newArch = archetype;

      const lower = promptText.toLowerCase();
      if (lower.includes('faster') || lower.includes('speed')) newSpeed = Math.min(2.5, newSpeed * 1.3);
      if (lower.includes('slower')) newSpeed = Math.max(0.5, newSpeed * 0.7);
      if (lower.includes('floaty') || lower.includes('low gravity')) newGravity = Math.max(0.18, newGravity * 0.7);
      if (lower.includes('heavy') || lower.includes('high gravity')) newGravity = Math.min(0.65, newGravity * 1.4);
      if (lower.includes('coral') || lower.includes('pink') || lower.includes('warm')) newTheme = 1;
      if (lower.includes('lime') || lower.includes('green')) newTheme = 2;
      if (lower.includes('sky') || lower.includes('blue') || lower.includes('chill')) newTheme = 3;

      if (lower.includes('orbit')) newArch = 'orbit';
      else if (lower.includes('stack') || lower.includes('tower')) newArch = 'stack';
      else if (lower.includes('runner') || lower.includes('dodge') || lower.includes('lane')) newArch = 'runner';

      setSpeedMultiplier(newSpeed);
      setGravity(newGravity);
      setSelectedThemeIndex(newTheme);
      setArchetype(newArch);

      const nextCode = generateGameHtml({
        title,
        themeColor: THEMES[newTheme].themeColor,
        accentColor: THEMES[newTheme].accentColor,
        bgGradient: THEMES[newTheme].bg,
        gameType: newArch,
        speedMultiplier: newSpeed,
        gravity: newGravity,
      });

      setHistory((prev) => [...prev, gameHtml]);
      setGameHtml(nextCode);
      setIsGenerating(false);
      setGenerationStep(null);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          text: `Applied! Updated ${newArch} mechanics with ${newSpeed.toFixed(1)}x speed and refreshed visual effects. Try playing on the right!`,
          timestamp: 'Just now',
        },
      ]);
    }, 1200);
  };

  const handleSelectArchetype = (arch: GameArchetype) => {
    setArchetype(arch);
    const code = generateGameHtml({
      title,
      themeColor: THEMES[selectedThemeIndex].themeColor,
      accentColor: THEMES[selectedThemeIndex].accentColor,
      bgGradient: THEMES[selectedThemeIndex].bg,
      gameType: arch,
      speedMultiplier,
      gravity,
    });
    setHistory((prev) => [...prev, gameHtml]);
    setGameHtml(code);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const prev = history[history.length - 1];
      setGameHtml(prev);
      setHistory((h) => h.slice(0, -1));
    }
  };

  const handlePublish = () => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setPublishedSlug(slug);
  };

  const testAudioTone = (freq: number) => {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-jumby-ink text-white overflow-hidden font-sans">
      {/* Top Studio Navbar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-white/10 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to feed"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-heading font-black text-sm tracking-tight text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-jumby-purple focus:outline-none transition-colors max-w-[200px]"
              />
              {parentGame && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-jumby-purple/30 border border-jumby-purple/50 text-jumby-purple font-heading font-black">
                  Remix
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400 font-sans">
              Jumby Studio • Instant In-Memory Live Preview
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-300 transition-all active:scale-95 font-sans"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          {/* Preview / Code Tab */}
          <div className="flex bg-zinc-900 rounded-full p-0.5 border border-white/10">
            <button
              onClick={() => setWorkspaceTab('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-heading font-bold transition-all ${
                workspaceTab === 'preview'
                  ? 'bg-jumby-purple text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setWorkspaceTab('code')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-heading font-bold transition-all ${
                workspaceTab === 'code'
                  ? 'bg-jumby-purple text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Primary Publish Button: Jumby Lime (#D8FF43) */}
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-jumby-lime hover:brightness-105 active:scale-95 text-jumby-ink font-heading font-black text-xs shadow-md shadow-jumby-lime/25 transition-all"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Creation Controls (Chat, Templates, Theme) */}
        <div className="w-full md:w-[460px] bg-zinc-950 border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
          {/* Sub Navigation Tabs (From Swatch Spec) */}
          <div className="flex border-b border-white/10 px-3 bg-zinc-900/60 shrink-0">
            <button
              onClick={() => setPanelTab('chat')}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-heading font-bold border-b-2 transition-all ${
                panelTab === 'chat'
                  ? 'border-jumby-lime text-jumby-lime'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setPanelTab('templates')}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-heading font-bold border-b-2 transition-all ${
                panelTab === 'templates'
                  ? 'border-jumby-lime text-jumby-lime'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setPanelTab('theme')}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-heading font-bold border-b-2 transition-all ${
                panelTab === 'theme'
                  ? 'border-jumby-lime text-jumby-lime'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme & Physics</span>
            </button>
          </div>

          {/* TAB 1: AI Prompt Chat Assistant */}
          {panelTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Mascot Welcome Header */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-jumby-purple/10 border border-jumby-purple/20 mb-3 shrink-0">
                <JumbyMascot size={46} />
                <div>
                  <div className="font-heading font-black text-xs text-white">
                    Turn your ideas into games.
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Type changes in natural language to update your game live.
                  </div>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar mb-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-jumby-purple text-white shadow-md'
                          : 'bg-zinc-900 border border-white/10 text-zinc-200'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 px-1">
                      {m.sender === 'user' ? 'You' : 'Jumby AI'}
                    </span>
                  </div>
                ))}

                {isGenerating && generationStep && (
                  <div className="p-3 rounded-2xl bg-zinc-900/90 border border-jumby-lime/30 text-xs text-jumby-lime flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin-slow shrink-0" />
                    <span>{generationStep}</span>
                  </div>
                )}
              </div>

              {/* Quick Modifier Pills */}
              <div className="mb-2 shrink-0">
                <div className="text-[10px] font-heading font-black text-zinc-500 uppercase tracking-wider mb-1.5">
                  Quick Modifiers
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Make it 2x faster',
                    'Lower gravity floaty',
                    'Neon laser obstacles',
                    'Switch to orbital dodge',
                    'Switch to block stacker',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleApplyPrompt(chip)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-sans transition-all active:scale-95"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Box */}
              <div className="relative shrink-0">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyPrompt(inputPrompt);
                  }}
                  placeholder="Describe mechanics, speed, or game idea..."
                  className="w-full rounded-full bg-zinc-900 border border-white/15 px-4 py-3 pr-12 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-jumby-lime transition-all"
                />
                <button
                  onClick={() => handleApplyPrompt(inputPrompt)}
                  disabled={!inputPrompt.trim() || isGenerating}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-jumby-lime hover:brightness-105 active:scale-95 disabled:opacity-40 flex items-center justify-center text-jumby-ink transition-all shadow-md shadow-jumby-lime/20"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Templates & Archetypes */}
          {panelTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              <div className="text-xs text-zinc-400 mb-1">
                Pick a core game archetype to load its foundation:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    onClick={() => handleSelectArchetype(arch.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      archetype === arch.id
                        ? 'border-jumby-lime bg-jumby-lime/10 shadow-md shadow-jumby-lime/10'
                        : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl p-1 bg-black/40 rounded-xl shrink-0">
                      {arch.icon}
                    </span>
                    <div>
                      <div className="text-xs font-heading font-black text-white flex items-center gap-1.5">
                        <span>{arch.name}</span>
                        {archetype === arch.id && (
                          <span className="text-[9px] px-2 py-0.2 rounded-full bg-jumby-lime text-jumby-ink font-heading font-black uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {arch.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Theme, Sound & Physics Tuning */}
          {panelTab === 'theme' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
              {/* Palette Selection */}
              <div>
                <label className="text-xs font-heading font-black text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-jumby-coral" />
                  <span>Color Swatch Palette</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((theme, i) => (
                    <button
                      key={theme.name}
                      onClick={() => {
                        setSelectedThemeIndex(i);
                        setGameHtml(buildHtml({ themeColor: theme.themeColor, accentColor: theme.accentColor, bgGradient: theme.bg }));
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        selectedThemeIndex === i
                          ? 'border-jumby-lime bg-jumby-lime/10'
                          : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: theme.themeColor }}
                      />
                      <span className="text-xs font-heading font-bold text-zinc-200 truncate">
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physics Tuning Sliders */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-zinc-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3" /> Game Speed
                  </span>
                  <span className="font-mono text-jumby-lime font-bold">
                    {speedMultiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSpeedMultiplier(val);
                    setGameHtml(buildHtml({ speedMultiplier: val }));
                  }}
                  className="w-full accent-jumby-lime cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-heading font-bold text-zinc-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3" /> Gravity Force
                  </span>
                  <span className="font-mono text-jumby-purple font-bold">
                    {gravity.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.8"
                  step="0.05"
                  value={gravity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setGravity(val);
                    setGameHtml(buildHtml({ gravity: val }));
                  }}
                  className="w-full accent-jumby-purple cursor-pointer"
                />
              </div>

              {/* 8-Bit Web Audio Sound Tester */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5">
                <div className="text-xs font-heading font-bold text-zinc-300 flex items-center gap-1.5 mb-2.5">
                  <Volume2 className="w-3.5 h-3.5 text-jumby-sky" />
                  <span>Synthesizer Audio Tester</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Jump', freq: 320 },
                    { label: 'Score', freq: 587 },
                    { label: 'Hit', freq: 150 },
                    { label: 'Power', freq: 880 },
                  ].map((sfx) => (
                    <button
                      key={sfx.label}
                      onClick={() => testAudioTone(sfx.freq)}
                      className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-heading font-bold text-zinc-200 active:scale-95 transition-all text-center"
                    >
                      {sfx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Game Workspace (Preview / Code) */}
        <div className="flex-1 relative flex items-center justify-center bg-jumby-ink overflow-hidden p-3 md:p-6">
          {workspaceTab === 'preview' ? (
            <div className="relative w-full max-w-[390px] h-full max-h-[720px] rounded-[38px] overflow-hidden shadow-2xl border-[4px] border-zinc-800 bg-[#070714]">
              {/* In-Memory Instant Preview Iframe */}
              <iframe
                ref={iframeRef}
                title="Live Game Preview"
                srcDoc={gameHtml}
                sandbox="allow-scripts allow-pointer-lock"
                className="w-full h-full border-0"
              />

              {/* Live Status Pill */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-jumby-lime flex items-center gap-1.5 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-jumby-lime animate-pulse" />
                <span>IN-MEMORY • 60 FPS</span>
              </div>
            </div>
          ) : (
            /* Live Code Inspector / Editor */
            <div className="w-full h-full max-w-3xl rounded-2xl bg-zinc-950 border border-white/10 p-4 font-mono text-xs overflow-hidden flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                <span className="font-heading font-bold text-xs text-zinc-300">
                  Game Source (Standalone HTML5 + Jumby SDK)
                </span>
                <button
                  onClick={() => {
                    if (iframeRef.current) iframeRef.current.srcdoc = gameHtml;
                    setWorkspaceTab('preview');
                  }}
                  className="px-3 py-1 rounded-full bg-jumby-lime text-jumby-ink font-heading font-black text-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Changes</span>
                </button>
              </div>
              <textarea
                value={gameHtml}
                onChange={(e) => setGameHtml(e.target.value)}
                className="flex-1 w-full bg-transparent text-cyan-300 font-mono text-xs resize-none focus:outline-none overflow-auto leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Publish Success Modal */}
      {publishedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-jumby-ink/85 backdrop-blur-md p-4 animate-fade-in font-sans">
          <div className="w-full max-w-sm rounded-[32px] bg-zinc-900 border border-jumby-lavender/15 p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-jumby-lime/20 text-jumby-lime flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-xl font-heading font-black text-white mb-1">
              Game Published!
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-sans">
              Your game is now live in the Jumby recommendation feed and has its own permanent link.
            </p>

            <div className="p-3 rounded-2xl bg-jumby-ink border border-white/10 font-mono text-xs text-jumby-lime mb-5 break-all select-all">
              jumby.app/g/{publishedSlug}
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/g/${publishedSlug}`}
                className="w-full py-3.5 rounded-full bg-jumby-lime font-heading font-black text-xs text-jumby-ink shadow-lg shadow-jumby-lime/20 hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Play in Feed Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setPublishedSlug(null)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 font-bold text-xs text-zinc-400 hover:text-white transition-all"
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
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-jumby-ink text-white flex items-center justify-center font-heading font-bold">
          Loading Jumby Studio...
        </div>
      }
    >
      <CreateStudioContent />
    </Suspense>
  );
}
