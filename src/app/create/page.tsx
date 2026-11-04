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
  MessageSquare,
  Palette,
  Type,
  Send,
  Share2,
  Play,
  Flame,
  ArrowRight,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { SEED_GAMES } from '@/data/seed-games';
import {
  generateGameHtml,
  GameTemplateConfig,
  GameArchetype,
} from '@/lib/templates/game-generator';
import { validateAndHealGameHtml } from '@/lib/ai/game-healer';
import { JumbyMascot } from '@/components/brand/JumbyMascot';
import {
  GAME_FONTS,
  detectFontVibe,
  extractFontFromHtml,
  injectOrReplaceFontInHtml,
} from '@/lib/fonts/game-fonts';

function extractPaletteFromHtml(html: string): {
  themeColor: string;
  accentColor: string;
  bgColor: string;
  colors: string[];
} {
  let themeColor = '#7160FF';
  let accentColor = '#D8FF43';
  let bgColor = '#0F0F0F';
  let colors: string[] = [];

  if (!html) return { themeColor, accentColor, bgColor, colors };

  // 1. Look for COLORS / bjpColors / PALETTE / colors / theme array or list of hex codes
  const paletteMatch = html.match(/(?:COLORS|bjpColors|PALETTE|colors|palette|THEME|themeColors)\s*=\s*\[([^\]]+)\]/i);
  if (paletteMatch) {
    const rawColors = paletteMatch[1].match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
    if (rawColors && rawColors.length > 0) {
      themeColor = rawColors[0];
      if (rawColors.length > 1) accentColor = rawColors[1];
      colors = Array.from(new Set(rawColors));
    }
  }

  // 2. Look for background color in CSS or canvas fill
  const bgMatch = html.match(/(?:background(?:-color)?:\s*|fillStyle\s*=\s*['"])(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/i);
  if (bgMatch && bgMatch[1]) {
    bgColor = bgMatch[1];
  }

  // 3. Fallback and merge all distinct hex colors found in the code
  const allHex = html.match(/#[0-9a-fA-F]{6}/gi) || [];
  const uniqueHex = Array.from(new Set(allHex.map((c) => c.toUpperCase())));
  const nonDarkHex = uniqueHex.filter((c) => {
    const l = c.toLowerCase();
    return l !== '#000000' && l !== '#0f0f0f' && l !== '#111111' && l !== '#1a1a1a';
  });

  if (colors.length === 0 && nonDarkHex.length > 0) {
    themeColor = nonDarkHex[0];
    accentColor = nonDarkHex[1] || nonDarkHex[0];
    colors = nonDarkHex.slice(0, 8);
  } else if (colors.length > 0) {
    for (const h of nonDarkHex) {
      if (!colors.map((c) => c.toUpperCase()).includes(h) && colors.length < 8) {
        colors.push(h);
      }
    }
  }

  return { themeColor, accentColor, bgColor, colors };
}

function replaceColorInHtml(html: string, oldColor: string, newColor: string): string {
  if (!html || !oldColor || !newColor || oldColor.toLowerCase() === newColor.toLowerCase()) {
    return html;
  }
  const escaped = oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return html.replace(regex, newColor);
}

function applyPhysicsToHtml(html: string, speedMult: number, grav: number): string {
  if (!html) return html;
  let updated = html;
  updated = updated.replace(/(speed\s*[:=]\s*)[\d.]+/gi, `$1${(3.8 * speedMult).toFixed(1)}`);
  updated = updated.replace(/(speedMultiplier\s*[:=]\s*)[\d.]+/gi, `$1${speedMult.toFixed(2)}`);
  updated = updated.replace(/(gravity\s*[:=]\s*)[\d.]+/gi, `$1${grav.toFixed(2)}`);
  return updated;
}

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

function AnimatedGeniusTitle() {
  const text = 'Waiting on your genius.';
  return (
    <h3 className="relative flex items-center justify-center flex-wrap select-none">
      {text.split('').map((char, i) => {
        const isGenius = i >= 16;
        return (
          <span
            key={i}
            className={`inline-block font-heading font-black text-2xl tracking-tight animate-bounce ${
              isGenius ? 'text-jumby-lime drop-shadow-[0_0_15px_rgba(216,255,67,0.45)]' : 'text-white'
            }`}
            style={{
              animationDelay: `${i * 65}ms`,
              animationDuration: '1.3s',
              marginRight: char === ' ' ? '6px' : '0px',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </h3>
  );
}

function CreateStudioContent() {
  const searchParams = useSearchParams();
  const remixId = searchParams.get('remix');
  const parentGame = remixId ? SEED_GAMES.find((g) => g.id === remixId) : null;

  // Active Game State - Blank scratch by default
  const [title, setTitle] = useState(
    parentGame ? `${parentGame.title} (Remix)` : 'Untitled Game'
  );
  const [archetype, setArchetype] = useState<GameArchetype>('flappy');
  const [themeColor, setThemeColor] = useState('#7160FF');
  const [accentColor, setAccentColor] = useState('#D8FF43');
  const [bgColor, setBgColor] = useState('#0F0F0F');
  const [paletteColors, setPaletteColors] = useState<string[]>(['#7160FF', '#D8FF43']);
  const [activeFontVibe, setActiveFontVibe] = useState<string>('cartoon');
  const [speedMultiplier, setSpeedMultiplier] = useState(1.2);
  const [gravity, setGravity] = useState(0.38);

  // Left Studio Panel Tabs: 'chat' | 'tune'
  const [panelTab, setPanelTab] = useState<'chat' | 'tune'>('chat');

  // Preview Workspace Tabs: 'preview' | 'code'
  const [workspaceTab, setWorkspaceTab] = useState<'preview' | 'code'>('preview');

  // Generation / Prompt State
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const [runtimeGlitch, setRuntimeGlitch] = useState<{ message: string; line?: number } | null>(null);

  // Runtime Error Shield Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'JUMBY_RUNTIME_ERROR') {
        console.warn('[Create Studio] Captured game runtime glitch:', data);
        setRuntimeGlitch({
          message: data.message || 'Script glitch detected during play',
          line: data.line,
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleAutoFixGlitch = () => {
    if (!gameHtml) return;
    const healed = validateAndHealGameHtml(gameHtml, {
      prompt: title,
      archetype,
    });
    setGameHtml(healed.html);
    setRuntimeGlitch(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_ai_fix_${Date.now()}`,
        sender: 'assistant',
        text: `🛡️ Applied self-healing patch to game scripts! Auto-fixed: ${healed.issuesFixed.join(', ') || 'runtime glitch'}. Reloaded preview.`,
        timestamp: 'Just now',
      },
    ]);
  };

  // Conversation History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'assistant',
      text: parentGame
        ? `Remixing **${parentGame.title}**. What would you like to modify? (e.g. "make it 2x faster", "change color to coral", "lower gravity")`
        : "Hey creator! What kind of game do you want to build from scratch today? Type an idea below or pick a starter template on the right.",
      timestamp: 'Just now',
    },
  ]);

  const buildHtml = (customConfig?: Partial<GameTemplateConfig>) => {
    return generateGameHtml({
      title: title === 'Untitled Game' ? 'Neon Dash' : title,
      themeColor: themeColor,
      accentColor: accentColor,
      bgGradient: [bgColor, bgColor],
      gameType: archetype,
      speedMultiplier,
      gravity,
      fontVibe: activeFontVibe,
      ...customConfig,
    });
  };

  const handleColorChange = (target: 'primary' | 'accent' | 'bg', newHex: string) => {
    if (!newHex || !newHex.startsWith('#')) return;
    let oldColor = themeColor;
    if (target === 'primary') {
      oldColor = themeColor;
      setThemeColor(newHex);
    } else if (target === 'accent') {
      oldColor = accentColor;
      setAccentColor(newHex);
    } else if (target === 'bg') {
      oldColor = bgColor;
      setBgColor(newHex);
    }

    if (gameHtml && (gameHtml.includes('<canvas') || gameHtml.includes('<script'))) {
      const updated = replaceColorInHtml(gameHtml, oldColor, newHex);
      setHistory((prev) => [...prev, gameHtml]);
      setGameHtml(updated);
    }
  };

  const handlePaletteSwatchChange = (index: number, newHex: string) => {
    if (!newHex || !newHex.startsWith('#')) return;
    const oldColor = paletteColors[index];
    const next = [...paletteColors];
    next[index] = newHex;
    setPaletteColors(next);

    if (gameHtml && oldColor) {
      const updated = replaceColorInHtml(gameHtml, oldColor, newHex);
      setHistory((prev) => [...prev, gameHtml]);
      setGameHtml(updated);
    }
  };

  const handleFontChange = (fontId: string) => {
    setActiveFontVibe(fontId);
    if (gameHtml && (gameHtml.includes('<canvas') || gameHtml.includes('<script'))) {
      const updated = injectOrReplaceFontInHtml(gameHtml, fontId);
      setHistory((prev) => [...prev, gameHtml]);
      setGameHtml(updated);
    } else {
      setGameHtml(buildHtml({ fontVibe: fontId }));
    }
  };

  // Game Code starts EMPTY unless remixing!
  const [gameHtml, setGameHtml] = useState<string>(() => {
    if (parentGame) {
      return generateGameHtml({
        title: `${parentGame.title} (Remix)`,
        themeColor: '#7160FF',
        accentColor: '#D8FF43',
        bgGradient: ['#0F0F0F', '#1D173F'],
        gameType: 'flappy',
        speedMultiplier: 1.2,
        gravity: 0.38,
      });
    }
    return ''; // Start from clean scratch!
  });
  const [history, setHistory] = useState<string[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMounted(true);
    if (gameHtml) {
      setHistory([gameHtml]);
    }
  }, []);

  // Live Streaming AI Generation Handler
  const handleApplyPrompt = async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);
    // Detect archetype and update title if untitled
    const lower = promptText.toLowerCase();
    let targetArchetype = archetype;
    if (lower.includes('stack') || lower.includes('tower') || lower.includes('block') || lower.includes('slice') || lower.includes('rhythm')) {
      targetArchetype = 'stack';
      setArchetype('stack');
      if (title === 'Untitled Game') setTitle('Rhythm Stack Tower');
    } else if (lower.includes('orbit') || lower.includes('circle') || lower.includes('planet') || lower.includes('pulse')) {
      targetArchetype = 'orbit';
      setArchetype('orbit');
      if (title === 'Untitled Game') setTitle('Orbital Pulse');
    } else if (lower.includes('runner') || lower.includes('lane') || lower.includes('dodge') || lower.includes('car') || lower.includes('dash')) {
      targetArchetype = 'runner';
      setArchetype('runner');
      if (title === 'Untitled Game') setTitle('Cyber Runner');
    } else if (lower.includes('flap') || lower.includes('bird') || lower.includes('jump')) {
      targetArchetype = 'flappy';
      setArchetype('flappy');
      if (title === 'Untitled Game') setTitle('Neon Jumper');
    } else if (title === 'Untitled Game') {
      const words = promptText.trim().replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 3).join(' ');
      if (words) setTitle(words.replace(/\b\w/g, (c) => c.toUpperCase()));
    }

    // Instantly detect speed and gravity from prompt
    if (lower.includes('fast') || lower.includes('turbo') || lower.includes('2x speed') || lower.includes('hard')) {
      setSpeedMultiplier((prev) => Math.min(2.5, Number((prev * 1.3).toFixed(1))));
    } else if (lower.includes('slow') || lower.includes('relax') || lower.includes('chill') || lower.includes('easy')) {
      setSpeedMultiplier((prev) => Math.max(0.6, Number((prev * 0.75).toFixed(1))));
    }
    if (lower.includes('low gravity') || lower.includes('floaty') || lower.includes('moon')) {
      setGravity((prev) => Math.max(0.18, Number((prev * 0.7).toFixed(2))));
    } else if (lower.includes('heavy gravity') || lower.includes('high gravity')) {
      setGravity((prev) => Math.min(0.70, Number((prev * 1.3).toFixed(2))));
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          archetype: targetArchetype,
          baseCode: gameHtml,
        }),
      });

      if (!res.ok) {
        throw new Error(`Generation failed (${res.status})`);
      }

      if (!res.body) {
        throw new Error('No response stream received');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';
      let receivedCompleteHtml = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.step) {
                setGenerationStep(data.step);
              }

              if (data.chunk) {
                accumulatedCode += data.chunk;
              }

              if (data.done && data.fullHtml) {
                receivedCompleteHtml = data.fullHtml;
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      let finalHtml = receivedCompleteHtml;
      if (!finalHtml && accumulatedCode) {
        finalHtml = accumulatedCode;
      }
      if (!finalHtml || finalHtml.trim().length < 50) {
        finalHtml = gameHtml;
      }

      // Self-Healing Code Validation & Logic Repair
      const healingResult = validateAndHealGameHtml(finalHtml, {
        prompt: promptText,
        archetype: targetArchetype,
      });
      finalHtml = healingResult.html;
      setRuntimeGlitch(null);

      // Ensure the game has an expressive typography font matching the prompt/archetype
      let fontEnrichedHtml = finalHtml;
      if (!finalHtml.includes('fonts.googleapis.com')) {
        const detectedVibe = detectFontVibe(promptText, targetArchetype);
        fontEnrichedHtml = injectOrReplaceFontInHtml(finalHtml, detectedVibe.id);
        setActiveFontVibe(detectedVibe.id);
      } else {
        const activeVibe = extractFontFromHtml(finalHtml);
        setActiveFontVibe(activeVibe.id);
      }

      setHistory((prev) => [...prev, gameHtml]);
      setGameHtml(fontEnrichedHtml);

      // Sync live game colors directly with the Fine-Tune controls
      const extracted = extractPaletteFromHtml(fontEnrichedHtml);
      if (extracted.themeColor) setThemeColor(extracted.themeColor);
      if (extracted.accentColor) setAccentColor(extracted.accentColor);
      if (extracted.bgColor) setBgColor(extracted.bgColor);
      if (extracted.colors.length > 0) setPaletteColors(extracted.colors);

      // Add Assistant completion response with healing summary
      const fixSummary =
        healingResult.issuesFixed.length > 0
          ? ` 🛡️ Auto-healed: ${healingResult.issuesFixed.slice(0, 2).join(', ')}.`
          : '';

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          text: `Game synthesized! Injected high-score tracking, 8-bit audio, and screen juice.${fixSummary} Try playing in the live preview on the right!`,
          timestamp: 'Just now',
        },
      ]);
    } catch (err: any) {
      console.error('[Create Studio] Generation error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_err_${Date.now()}`,
          sender: 'assistant',
          text: `Failed to generate game: ${err.message || 'Network error'}. Reverting to previous build.`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  const handleSelectArchetype = (arch: GameArchetype) => {
    setArchetype(arch);
    const archName = ARCHETYPES.find((a) => a.id === arch)?.name || arch;
    const effectiveTitle = title === 'Untitled Game' ? archName : title;
    if (title === 'Untitled Game') {
      setTitle(archName);
    }
    const targetFont = detectFontVibe('', arch).id;
    setActiveFontVibe(targetFont);
    const code = generateGameHtml({
      title: effectiveTitle,
      themeColor: themeColor,
      accentColor: accentColor,
      bgGradient: [bgColor, bgColor],
      gameType: arch,
      speedMultiplier,
      gravity,
      fontVibe: targetFont,
    });
    setHistory((prev) => (gameHtml ? [...prev, gameHtml] : []));
    setGameHtml(code);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const prev = history[history.length - 1];
      setGameHtml(prev);
      setHistory((h) => h.slice(0, -1));
    }
  };

  // Live Publishing Handler
  const handlePublish = async () => {
    if (isPublishing) return;
    setIsPublishing(true);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          html: gameHtml,
          archetype,
          prompt: messages[messages.length - 1]?.text || title,
        }),
      });

      const data = await res.json();
      if (data.success && data.slug) {
        setPublishedSlug(data.slug);
      } else {
        alert(data.error || 'Failed to publish game');
      }
    } catch (e: any) {
      console.error('[Publish] Error:', e);
      alert('Error publishing game. Please check your connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  const testAudioTone = (freq: number) => {
    if (typeof window === 'undefined') return;
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext })
        .webkitAudioContext;
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
              Jumby Studio • Rimsha Micro-Engine Runtime
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
            disabled={isPublishing || !gameHtml}
            title={!gameHtml ? 'Create or generate a game first' : 'Publish game to feed'}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-jumby-lime hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-jumby-ink font-heading font-black text-xs shadow-md shadow-jumby-lime/25 transition-all"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Creation Controls (Chat, Templates, Theme) */}
        <div className="w-full md:w-[460px] bg-zinc-950 border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
          {/* Sub Navigation Tabs */}
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
              onClick={() => setPanelTab('tune')}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-heading font-bold border-b-2 transition-all ${
                panelTab === 'tune'
                  ? 'border-jumby-purple text-jumby-purple'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fine-Tune & Audio</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {/* 1. CHAT TAB */}
            {panelTab === 'chat' && (
              <div className="flex flex-col h-full">
                {/* Chat Messages */}
                <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        m.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {m.sender === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-jumby-purple/30 border border-jumby-purple/50 flex items-center justify-center shrink-0">
                          <JumbyMascot className="w-5 h-5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl ${
                          m.sender === 'user'
                            ? 'bg-jumby-purple text-white font-medium rounded-tr-none'
                            : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-none font-sans'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {/* Generation Status Indicator */}
                  {isGenerating && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-jumby-lime/30 text-xs text-jumby-lime animate-pulse font-heading font-bold">
                      <Sparkles className="w-4 h-4 animate-spin text-jumby-lime" />
                      <span>{generationStep || 'Generating game...'}</span>
                    </div>
                  )}
                </div>

                {/* Prompt Quick Suggestion Pills */}
                <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-white/5 bg-zinc-950/40">
                  {[
                    '⚡ Cyber Runner 3-lane dodge',
                    '🪐 Orbital laser pulse survival',
                    '🧱 Rhythm block stack tower',
                    '🐦 Neon flappy jumper',
                    '🔥 2x insane speed trail',
                    '🌊 Low gravity floaty bounce',
                  ].map((s) => (
                    <button
                      key={s}
                      disabled={isGenerating}
                      onClick={() => handleApplyPrompt(s)}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-sans transition-all active:scale-95 disabled:opacity-40"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                {/* Prompt Input Form */}
                <div className="p-3 border-t border-white/10 bg-zinc-900/40">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleApplyPrompt(inputPrompt);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder={
                        isGenerating
                          ? 'Synthesizing micro-game...'
                          : 'Describe gameplay, speed, or theme...'
                      }
                      value={inputPrompt}
                      disabled={isGenerating}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-jumby-purple transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isGenerating || !inputPrompt.trim()}
                      className="w-9 h-9 rounded-full bg-jumby-purple hover:brightness-110 active:scale-95 disabled:opacity-40 flex items-center justify-center text-white transition-all shadow-md shadow-jumby-purple/30"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 2. FINE-TUNE & AUDIO TAB */}
            {panelTab === 'tune' && (
              <div className="p-4 space-y-5">
                {/* Live Game Colors (Synchronized to AI Generation) */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="font-heading font-bold text-xs text-white flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-jumby-coral" />
                      <span>Live Game Colors</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Syncs with AI Chat
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Primary Color */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/70 border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2.5">
                        <label className="relative cursor-pointer group">
                          <div
                            className="w-7 h-7 rounded-lg border border-white/20 shadow-inner transition-transform group-hover:scale-105"
                            style={{ backgroundColor: themeColor }}
                          />
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                        <div>
                          <div className="text-xs font-bold font-heading text-white">Primary Color</div>
                          <div className="text-[10px] text-zinc-400">Player & hero elements</div>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={themeColor}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-black/60 border border-white/10 text-xs font-mono text-center text-white focus:outline-none focus:border-jumby-lime"
                        maxLength={7}
                      />
                    </div>

                    {/* Accent Color */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/70 border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2.5">
                        <label className="relative cursor-pointer group">
                          <div
                            className="w-7 h-7 rounded-lg border border-white/20 shadow-inner transition-transform group-hover:scale-105"
                            style={{ backgroundColor: accentColor }}
                          />
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                        <div>
                          <div className="text-xs font-bold font-heading text-white">Accent Color</div>
                          <div className="text-[10px] text-zinc-400">Obstacles & particles</div>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-black/60 border border-white/10 text-xs font-mono text-center text-white focus:outline-none focus:border-jumby-lime"
                        maxLength={7}
                      />
                    </div>

                    {/* Background Color */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/70 border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-2.5">
                        <label className="relative cursor-pointer group">
                          <div
                            className="w-7 h-7 rounded-lg border border-white/20 shadow-inner transition-transform group-hover:scale-105"
                            style={{ backgroundColor: bgColor }}
                          />
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => handleColorChange('bg', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                        <div>
                          <div className="text-xs font-bold font-heading text-white">Background</div>
                          <div className="text-[10px] text-zinc-400">Canvas backdrop</div>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => handleColorChange('bg', e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-black/60 border border-white/10 text-xs font-mono text-center text-white focus:outline-none focus:border-jumby-lime"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Active Palette Swatches */}
                  {paletteColors.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-heading font-medium text-zinc-400 mb-2 flex items-center justify-between">
                        <span>Extracted Game Palette ({paletteColors.length} colors)</span>
                        <span className="text-[9px] text-zinc-500">Click swatch to edit</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {paletteColors.map((color, idx) => (
                          <label
                            key={`${color}-${idx}`}
                            className="relative cursor-pointer group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 hover:border-jumby-lime/50 transition-all"
                          >
                            <div
                              className="w-4 h-4 rounded-md border border-white/20 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[10px] font-mono text-zinc-300 uppercase">
                              {color}
                            </span>
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => handlePaletteSwatchChange(idx, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Game Typography & Font Vibe */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="font-heading font-bold text-xs text-white flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-jumby-sky" />
                      <span>Typography & Font Vibe</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Active: <span className="text-jumby-sky font-bold">{GAME_FONTS.find((f) => f.id === activeFontVibe)?.name || 'Custom'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {GAME_FONTS.map((font) => {
                      const isSelected = activeFontVibe === font.id;
                      return (
                        <button
                          key={font.id}
                          onClick={() => handleFontChange(font.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'border-jumby-sky bg-jumby-sky/15 ring-1 ring-jumby-sky/40 shadow-sm shadow-jumby-sky/10'
                              : 'border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-900/90'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base select-none">{font.icon}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold font-heading text-white flex items-center gap-1.5">
                                <span>{font.name}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">({font.fontFamily})</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                                {font.description}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-jumby-sky shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Physics Sliders */}
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div className="font-heading font-bold text-xs text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-jumby-lime" />
                    <span>Gameplay Physics Tuning</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1">
                      <span>Speed Multiplier</span>
                      <span className="font-mono text-jumby-lime">{speedMultiplier.toFixed(1)}x</span>
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
                        if (gameHtml && (gameHtml.includes('<canvas') || gameHtml.includes('<script'))) {
                          setGameHtml(applyPhysicsToHtml(gameHtml, val, gravity));
                        } else {
                          setGameHtml(buildHtml({ speedMultiplier: val }));
                        }
                      }}
                      className="w-full accent-jumby-lime"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-1">
                      <span>Gravity / Acceleration</span>
                      <span className="font-mono text-jumby-purple">{gravity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.15"
                      max="0.75"
                      step="0.02"
                      value={gravity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setGravity(val);
                        if (gameHtml && (gameHtml.includes('<canvas') || gameHtml.includes('<script'))) {
                          setGameHtml(applyPhysicsToHtml(gameHtml, speedMultiplier, val));
                        } else {
                          setGameHtml(buildHtml({ gravity: val }));
                        }
                      }}
                      className="w-full accent-jumby-purple"
                    />
                  </div>
                </div>

                {/* Web Audio Synthesizer Tester */}
                <div className="pt-2 border-t border-white/10">
                  <div className="font-heading font-bold text-xs text-white mb-2 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-jumby-sky" />
                    <span>Procedural 8-Bit Web Audio Tones</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Jump', freq: 320 },
                      { name: 'Score', freq: 587 },
                      { name: 'Powerup', freq: 880 },
                      { name: 'Hit', freq: 140 },
                      { name: 'Laser', freq: 440 },
                      { name: 'Coin', freq: 987 },
                    ].map((s) => (
                      <button
                        key={s.name}
                        onClick={() => testAudioTone(s.freq)}
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-jumby-sky text-[11px] font-heading font-bold text-zinc-300 hover:text-white transition-all active:scale-95"
                      >
                        🔊 {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live In-Memory Sandbox / Code Editor */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
          {workspaceTab === 'preview' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* Phone Frame Mockup for Realistic Portrait Feel */}
              <div className="relative w-full max-w-[390px] h-full max-h-[800px] rounded-[36px] overflow-hidden border-4 border-zinc-800 bg-black shadow-2xl flex flex-col">
                {/* Self-Healing Glitch Alert Banner */}
                {runtimeGlitch && (
                  <div className="absolute top-4 left-4 right-4 z-30 bg-zinc-900/95 border border-red-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-sm">🛡️</span>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-bold text-white leading-tight">Runtime Glitch Caught</span>
                        <span className="text-[10px] text-zinc-400 truncate leading-tight">{runtimeGlitch.message}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleAutoFixGlitch}
                      className="px-2.5 py-1 rounded-lg bg-jumby-purple hover:bg-jumby-purple/90 active:scale-95 text-white font-heading font-black text-[10px] shadow-lg shadow-jumby-purple/20 transition-all shrink-0"
                    >
                      Auto-Fix
                    </button>
                  </div>
                )}

                {mounted ? (
                  gameHtml ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={gameHtml}
                      title="Live Preview"
                      sandbox="allow-scripts allow-pointer-lock"
                      className="w-full h-full border-none bg-black flex-1"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-zinc-950 via-jumby-ink to-zinc-950 relative overflow-hidden select-none">
                      <div className="absolute inset-0 bg-[radial-gradient(#7160FF_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />

                      <div className="relative w-20 h-20 rounded-3xl bg-jumby-purple/15 border border-jumby-purple/30 flex items-center justify-center mb-5 text-jumby-purple shadow-2xl shadow-jumby-purple/20">
                        <JumbyMascot className="w-12 h-12 animate-bounce" />
                      </div>

                      <AnimatedGeniusTitle />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-xs">
                    Loading studio...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col bg-zinc-950 rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="font-mono text-xs text-zinc-400">
                  index.html • HTML5 Canvas + Jumby SDK
                </span>
                <button
                  onClick={() => setWorkspaceTab('preview')}
                  className="px-3 py-1 rounded-full bg-jumby-lime text-jumby-ink font-heading font-black text-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Changes</span>
                </button>
              </div>
              <textarea
                value={gameHtml}
                placeholder={`<!-- No game generated yet. -->\n<!-- Type an idea in the AI Assistant on the left or select a template archetype to generate game code! -->`}
                onChange={(e) => setGameHtml(e.target.value)}
                className="flex-1 w-full bg-transparent text-cyan-300 placeholder-zinc-600 font-mono text-xs resize-none focus:outline-none overflow-auto leading-relaxed"
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
