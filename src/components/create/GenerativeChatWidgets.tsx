'use client';

import React, { useState } from 'react';
import { Check, Zap, Swords, Sparkles } from 'lucide-react';

export type GenerativeWidgetType = 'difficulty' | 'boss' | 'powerups';

export interface DifficultyConfig {
  preset: 'chill' | 'balanced' | 'chaos';
  speedMultiplier: number;
  hazardDensity: 'relaxed' | 'moderate' | 'swarm';
  progressionMode: 'endless' | 'stages' | 'boss';
  customRule?: string;
}

interface DifficultyWidgetProps {
  initialConfig?: Partial<DifficultyConfig>;
  onApply: (config: DifficultyConfig) => void;
  isGenerating?: boolean;
}

const PRESETS = [
  { id: 'chill',    icon: '🌱', label: 'Chill',    speed: 0.75, hazard: 'relaxed'  as const, prog: 'endless' as const },
  { id: 'balanced', icon: '⚡', label: 'Balanced', speed: 1.2,  hazard: 'moderate' as const, prog: 'stages'  as const },
  { id: 'chaos',    icon: '💀', label: 'Chaos',    speed: 1.9,  hazard: 'swarm'    as const, prog: 'boss'    as const },
];

const PROGRESSIONS = [
  { id: 'endless', label: 'Endless Ramp' },
  { id: 'stages',  label: '3-Stage Run'  },
  { id: 'boss',    label: 'Boss Finale'  },
];

export function GenerativeDifficultyWidget({
  initialConfig,
  onApply,
  isGenerating = false,
}: DifficultyWidgetProps) {
  const [preset, setPreset]       = useState<'chill' | 'balanced' | 'chaos'>(initialConfig?.preset || 'balanced');
  const [speed, setSpeed]         = useState(initialConfig?.speedMultiplier || 1.2);
  const [progression, setProg]    = useState<'endless' | 'stages' | 'boss'>(initialConfig?.progressionMode || 'stages');
  const [customRule, setCustomRule] = useState('');
  const [applied, setApplied]     = useState(false);

  const pickPreset = (p: typeof PRESETS[number]) => {
    setPreset(p.id as any);
    setSpeed(p.speed);
    setProg(p.prog);
    setApplied(false);
  };

  const handleApply = () => {
    setApplied(true);
    onApply({
      preset,
      speedMultiplier: speed,
      hazardDensity: PRESETS.find(p => p.id === preset)?.hazard || 'moderate',
      progressionMode: progression,
      customRule: customRule.trim() || undefined,
    });
  };

  return (
    <div className="w-full mt-2 rounded-2xl bg-zinc-900 border border-white/10 p-3 space-y-3 font-sans">
      {/* Presets */}
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => pickPreset(p)}
            className={`flex flex-col items-center py-2.5 rounded-xl border text-center transition-all active:scale-95 ${
              preset === p.id
                ? 'bg-jumby-purple/20 border-jumby-purple text-white'
                : 'bg-zinc-800/60 border-transparent text-zinc-400 hover:text-white hover:border-white/15'
            }`}
          >
            <span className="text-lg leading-none mb-1">{p.icon}</span>
            <span className="text-[11px] font-heading font-black">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Speed Slider */}
      <div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-zinc-400">Speed</span>
          <span className="font-mono text-jumby-lime font-bold">{speed.toFixed(1)}x</span>
        </div>
        <input
          type="range" min="0.5" max="2.5" step="0.1"
          value={speed}
          onChange={e => { setSpeed(parseFloat(e.target.value)); setApplied(false); }}
          className="w-full accent-jumby-lime cursor-pointer"
        />
      </div>

      {/* Progression */}
      <div className="flex gap-1.5">
        {PROGRESSIONS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setProg(p.id as any); setApplied(false); }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-heading font-bold transition-all border ${
              progression === p.id
                ? 'bg-jumby-lime/15 border-jumby-lime/50 text-jumby-lime'
                : 'bg-zinc-800/50 border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Rule */}
      <input
        type="text"
        value={customRule}
        onChange={e => { setCustomRule(e.target.value); setApplied(false); }}
        placeholder="Custom rule, e.g. gravity flips every 10s..."
        className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/8 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-jumby-purple/50 transition-colors"
      />

      {/* Apply */}
      <button
        type="button"
        onClick={handleApply}
        disabled={isGenerating}
        className={`w-full py-2 rounded-xl font-heading font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 ${
          applied
            ? 'bg-zinc-800 text-jumby-lime border border-jumby-lime/30'
            : 'bg-jumby-purple text-white hover:brightness-110 shadow-sm shadow-jumby-purple/30'
        }`}
      >
        {applied ? (
          <><Check className="w-3.5 h-3.5 stroke-[3]" /><span>Applied</span></>
        ) : (
          <><Zap className="w-3.5 h-3.5 fill-current" /><span>Apply to Game</span></>
        )}
      </button>
    </div>
  );
}

/* ─── Boss Widget ─────────────────────────────────────────────────── */

interface BossWidgetProps {
  onApply: (prompt: string) => void;
  isGenerating?: boolean;
}

const BOSSES = [
  { id: 'mothership', icon: '🛸', label: 'Laser Mothership' },
  { id: 'slime',      icon: '👾', label: 'Cosmic Slime'      },
  { id: 'robo',       icon: '🤖', label: 'Robo Guardian'     },
];

export function GenerativeBossWidget({ onApply, isGenerating = false }: BossWidgetProps) {
  const [boss, setBoss]             = useState('mothership');
  const [customBoss, setCustomBoss] = useState('');
  const [score, setScore]           = useState(30);

  const handleApply = () => {
    const name = customBoss.trim() || BOSSES.find(b => b.id === boss)?.label || '';
    onApply(`Add a ${name} boss battle at ${score} points with a health bar and warning alarm!`);
  };

  return (
    <div className="w-full mt-2 rounded-2xl bg-zinc-900 border border-white/10 p-3 space-y-3 font-sans">
      {/* Boss Selector */}
      <div className="space-y-1">
        {BOSSES.map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => { setBoss(b.id); setCustomBoss(''); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
              !customBoss.trim() && boss === b.id
                ? 'bg-jumby-purple/15 border-jumby-purple/60 text-white'
                : 'bg-zinc-800/50 border-transparent text-zinc-400 hover:text-white hover:border-white/10'
            }`}
          >
            <span className="text-base">{b.icon}</span>
            <span className="text-xs font-heading font-bold flex-1">{b.label}</span>
            {!customBoss.trim() && boss === b.id && (
              <Check className="w-3.5 h-3.5 text-jumby-purple shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Custom Boss */}
      <input
        type="text"
        value={customBoss}
        onChange={e => setCustomBoss(e.target.value)}
        placeholder="Or describe your own boss..."
        className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/8 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-jumby-purple/50 transition-colors"
      />

      {/* Score trigger */}
      <div>
        <div className="text-[10px] text-zinc-500 mb-1.5">Triggers at score</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[20, 35, 50].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(s)}
              className={`py-1.5 rounded-lg text-[11px] font-heading font-bold transition-all border ${
                score === s
                  ? 'bg-jumby-lime/15 border-jumby-lime/50 text-jumby-lime'
                  : 'bg-zinc-800/50 border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s}pts
            </button>
          ))}
        </div>
      </div>

      {/* Apply */}
      <button
        type="button"
        onClick={handleApply}
        disabled={isGenerating}
        className="w-full py-2 rounded-xl bg-jumby-purple text-white font-heading font-black text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-jumby-purple/30 disabled:opacity-40"
      >
        <Swords className="w-3.5 h-3.5" />
        <span>Add Boss</span>
      </button>
    </div>
  );
}

/* ─── Power-ups Widget ────────────────────────────────────────────── */

interface PowerupsWidgetProps {
  onApply: (prompt: string) => void;
  isGenerating?: boolean;
}

const PERKS = [
  { id: 'shield',  icon: '🛡️', label: 'Shield'      },
  { id: 'magnet',  icon: '🧲', label: 'Magnet'      },
  { id: 'slowmo',  icon: '⏱️', label: 'Slow-Mo'     },
  { id: 'blaster', icon: '💥', label: 'Blaster'     },
];

export function GenerativePowerupsWidget({ onApply, isGenerating = false }: PowerupsWidgetProps) {
  const [selected, setSelected]       = useState<string[]>(['shield', 'magnet']);
  const [customPerk, setCustomPerk]   = useState('');

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleApply = () => {
    const names = PERKS.filter(p => selected.includes(p.id)).map(p => p.label);
    if (customPerk.trim()) names.push(customPerk.trim());
    onApply(`Add collectible power-up drops: ${names.join(', ')} with floating pickup bubbles!`);
  };

  const count = selected.length + (customPerk.trim() ? 1 : 0);

  return (
    <div className="w-full mt-2 rounded-2xl bg-zinc-900 border border-white/10 p-3 space-y-3 font-sans">
      {/* Perk Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {PERKS.map(p => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                on
                  ? 'bg-jumby-sky/15 border-jumby-sky/60 text-white'
                  : 'bg-zinc-800/50 border-transparent text-zinc-400 hover:text-white hover:border-white/10'
              }`}
            >
              <span className="text-base">{p.icon}</span>
              <span className="text-xs font-heading font-bold flex-1">{p.label}</span>
              {on && <Check className="w-3 h-3 text-jumby-sky shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Custom Perk */}
      <input
        type="text"
        value={customPerk}
        onChange={e => setCustomPerk(e.target.value)}
        placeholder="Or type your own perk..."
        className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/8 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-jumby-sky/50 transition-colors"
      />

      {/* Apply */}
      <button
        type="button"
        onClick={handleApply}
        disabled={isGenerating || count === 0}
        className="w-full py-2 rounded-xl bg-jumby-purple text-white font-heading font-black text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-jumby-purple/30 disabled:opacity-40"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Add {count > 0 ? `${count} ` : ''}Power-up{count !== 1 ? 's' : ''}</span>
      </button>
    </div>
  );
}
