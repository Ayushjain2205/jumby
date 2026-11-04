'use client';

import React, { useState } from 'react';
import {
  Zap,
  Sliders,
  Sparkles,
  Check,
  Swords,
  Plus,
} from 'lucide-react';

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

export function GenerativeDifficultyWidget({
  initialConfig,
  onApply,
  isGenerating = false,
}: DifficultyWidgetProps) {
  const [preset, setPreset] = useState<'chill' | 'balanced' | 'chaos'>(
    initialConfig?.preset || 'balanced'
  );
  const [speedMultiplier, setSpeedMultiplier] = useState(
    initialConfig?.speedMultiplier || 1.2
  );
  const [hazardDensity, setHazardDensity] = useState<'relaxed' | 'moderate' | 'swarm'>(
    initialConfig?.hazardDensity || 'moderate'
  );
  const [progressionMode, setProgressionMode] = useState<'endless' | 'stages' | 'boss'>(
    initialConfig?.progressionMode || 'stages'
  );
  const [customRule, setCustomRule] = useState('');
  const [applied, setApplied] = useState(false);

  const handleSelectPreset = (p: 'chill' | 'balanced' | 'chaos') => {
    setPreset(p);
    setApplied(false);
    if (p === 'chill') {
      setSpeedMultiplier(0.85);
      setHazardDensity('relaxed');
      setProgressionMode('endless');
    } else if (p === 'balanced') {
      setSpeedMultiplier(1.2);
      setHazardDensity('moderate');
      setProgressionMode('stages');
    } else {
      setSpeedMultiplier(1.8);
      setHazardDensity('swarm');
      setProgressionMode('boss');
    }
  };

  const handleApply = () => {
    setApplied(true);
    onApply({
      preset,
      speedMultiplier,
      hazardDensity,
      progressionMode,
      customRule: customRule.trim() || undefined,
    });
  };

  return (
    <div className="w-full mt-2.5 rounded-2xl bg-[#161426] border border-jumby-purple/30 p-3.5 text-white shadow-xl shadow-jumby-purple/10 space-y-3 font-sans">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-heading font-black text-xs text-jumby-lime">
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Pacing & Difficulty</span>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
          Pacing Presets
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'chill', icon: '🌱', label: 'Chill', desc: 'Relaxed & easy' },
            { id: 'balanced', icon: '⚡', label: 'Balanced', desc: 'Classic arcade' },
            { id: 'chaos', icon: '💀', label: 'Chaos', desc: 'Hardcore bullet-hell' },
          ].map((item) => {
            const isSelected = preset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPreset(item.id as any)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-jumby-purple/20 border-jumby-purple text-white shadow-sm shadow-jumby-purple/30 ring-1 ring-jumby-purple/50'
                    : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <span className="text-sm mb-0.5">{item.icon}</span>
                <span className="text-xs font-heading font-bold">{item.label}</span>
                <span className="text-[9px] text-zinc-400 hidden sm:inline">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-2.5 pt-1">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-300 font-medium">Game Speed</span>
            <span className="font-mono text-jumby-lime font-bold">{speedMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="2.4"
            step="0.1"
            value={speedMultiplier}
            onChange={(e) => {
              setSpeedMultiplier(parseFloat(e.target.value));
              setApplied(false);
            }}
            className="w-full accent-jumby-lime h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-300 font-medium">Hazard Spawn Rate</span>
            <span className="font-mono text-jumby-sky font-bold capitalize">{hazardDensity}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['relaxed', 'moderate', 'swarm'] as const).map((density) => (
              <button
                key={density}
                type="button"
                onClick={() => {
                  setHazardDensity(density);
                  setApplied(false);
                }}
                className={`py-1 text-[10px] font-heading font-bold rounded-lg border capitalize transition-all ${
                  hazardDensity === density
                    ? 'bg-jumby-sky/20 border-jumby-sky text-jumby-sky'
                    : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {density}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progression Mode */}
      <div className="pt-1">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
          Progression Style
        </label>
        <div className="space-y-1">
          {[
            { id: 'endless', label: '♾️ Endless Score Ramp', desc: 'Speed ramps higher as you score' },
            { id: 'stages', label: '🏆 3-Stage World Tour', desc: 'Level 1 → Level 2 → Level 3 transitions' },
            { id: 'boss', label: '👹 Climax Boss Encounter', desc: 'Boss battle showdown at 50 points' },
          ].map((mode) => {
            const isSelected = progressionMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setProgressionMode(mode.id as any);
                  setApplied(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-jumby-lime/10 border-jumby-lime/60 text-white'
                    : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                }`}
              >
                <div>
                  <div className="text-xs font-heading font-bold text-white">{mode.label}</div>
                  <div className="text-[9px] text-zinc-400">{mode.desc}</div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-jumby-lime shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Rule Input */}
      <div className="pt-1">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
          Or Type Custom Rule / Mechanics
        </label>
        <input
          type="text"
          value={customRule}
          onChange={(e) => {
            setCustomRule(e.target.value);
            setApplied(false);
          }}
          placeholder="e.g. Gravity flips every 10 seconds, double jump on tap..."
          className="w-full px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-jumby-lime font-sans"
        />
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={isGenerating}
        className={`w-full py-2 px-3 rounded-xl font-heading font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
          applied
            ? 'bg-zinc-800 text-jumby-lime border border-jumby-lime/30'
            : 'bg-gradient-to-r from-jumby-purple to-[#8a7bff] text-white hover:brightness-110 shadow-jumby-purple/30'
        }`}
      >
        {applied ? (
          <>
            <Check className="w-3.5 h-3.5 text-jumby-lime stroke-[3]" />
            <span>Pacing Applied & Live Reloaded</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Apply to Game Canvas</span>
          </>
        )}
      </button>
    </div>
  );
}

interface BossWidgetProps {
  onApply: (bossPrompt: string) => void;
  isGenerating?: boolean;
}

export function GenerativeBossWidget({ onApply, isGenerating = false }: BossWidgetProps) {
  const [bossType, setBossType] = useState('🛸 Laser Mothership');
  const [customBoss, setCustomBoss] = useState('');
  const [triggerScore, setTriggerScore] = useState(30);

  const bosses = [
    { name: '🛸 Laser Mothership', desc: 'Fires sweeping laser beams and spawns mini drones' },
    { name: '👾 Giant Cosmic Slime', desc: 'Bounces aggressively and splits into smaller blobs' },
    { name: '🤖 Robo-Core Guardian', desc: 'Rotating shields that deflect shots until exposed' },
  ];

  const handleApply = () => {
    const effectiveBoss = customBoss.trim() || bossType;
    onApply(`Add a ${effectiveBoss} boss battle after reaching ${triggerScore} points with a health bar and warning alarm siren!`);
  };

  return (
    <div className="w-full mt-2.5 rounded-2xl bg-[#161426] border border-jumby-purple/30 p-3.5 text-white shadow-xl shadow-jumby-purple/10 space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-heading font-black text-xs text-jumby-purple">
          <Swords className="w-3.5 h-3.5" />
          <span>Boss Encounter Designer</span>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
          Select Boss Archetype
        </label>
        <div className="space-y-1.5">
          {bosses.map((b) => {
            const isSelected = !customBoss.trim() && bossType === b.name;
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => {
                  setBossType(b.name);
                  setCustomBoss('');
                }}
                className={`w-full p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-jumby-purple/20 border-jumby-purple text-white shadow-sm'
                    : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-heading font-bold text-white flex items-center justify-between">
                  <span>{b.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-jumby-purple" />}
                </div>
                <div className="text-[9px] text-zinc-400">{b.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Boss Input */}
      <div>
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
          Or Describe Your Own Boss
        </label>
        <input
          type="text"
          value={customBoss}
          onChange={(e) => setCustomBoss(e.target.value)}
          placeholder="e.g. Giant fire-breathing pixel dragon that swoops down..."
          className="w-full px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-jumby-purple font-sans"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
          Spawn Trigger (Score Milestone)
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[20, 35, 50].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setTriggerScore(score)}
              className={`py-1.5 rounded-lg border text-xs font-heading font-bold transition-all ${
                triggerScore === score
                  ? 'bg-jumby-lime/20 border-jumby-lime text-jumby-lime'
                  : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {score} Points
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleApply}
        disabled={isGenerating}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-jumby-purple to-[#8a7bff] text-white font-heading font-black text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-jumby-purple/30 cursor-pointer disabled:opacity-50"
      >
        <Swords className="w-3.5 h-3.5" />
        <span>Inject Boss into Game</span>
      </button>
    </div>
  );
}

interface PowerupsWidgetProps {
  onApply: (powerupPrompt: string) => void;
  isGenerating?: boolean;
}

export function GenerativePowerupsWidget({ onApply, isGenerating = false }: PowerupsWidgetProps) {
  const [selected, setSelected] = useState<string[]>(['shield', 'magnet']);
  const [customPowerup, setCustomPowerup] = useState('');

  const perks = [
    { id: 'shield', icon: '🛡️', name: 'Energy Shield', desc: 'Absorbs 1 collision before breaking' },
    { id: 'magnet', icon: '🧲', name: 'Gem Magnet', desc: 'Draws nearby score items automatically' },
    { id: 'slowmo', icon: '⏱️', name: 'Bullet Time', desc: 'Slows down obstacles for 4 seconds' },
    { id: 'blaster', icon: '💥', name: 'Laser Blaster', desc: 'Fires projectiles to clear hazards' },
  ];

  const togglePerk = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const names = perks.filter((p) => selected.includes(p.id)).map((p) => p.name);
    if (customPowerup.trim()) {
      names.push(customPowerup.trim());
    }
    onApply(`Inject collectible power-up drops into the game: ${names.join(', ')} with visual floating bubbles!`);
  };

  const totalCount = selected.length + (customPowerup.trim() ? 1 : 0);

  return (
    <div className="w-full mt-2.5 rounded-2xl bg-[#161426] border border-jumby-purple/30 p-3.5 text-white shadow-xl shadow-jumby-purple/10 space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-heading font-black text-xs text-jumby-sky">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Collectible Power-ups</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {perks.map((p) => {
          const isChecked = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePerk(p.id)}
              className={`p-2 rounded-xl border text-left transition-all ${
                isChecked
                  ? 'bg-jumby-sky/15 border-jumby-sky/80 text-white shadow-sm ring-1 ring-jumby-sky/30'
                  : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{p.icon}</span>
                <div
                  className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center ${
                    isChecked
                      ? 'bg-jumby-sky border-jumby-sky text-black'
                      : 'border-white/20'
                  }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
              <div className="text-xs font-heading font-bold text-white">{p.name}</div>
              <div className="text-[9px] text-zinc-400 line-clamp-1">{p.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Custom Power-up Input */}
      <div>
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
          Or Type Your Own Custom Perk
        </label>
        <input
          type="text"
          value={customPowerup}
          onChange={(e) => setCustomPowerup(e.target.value)}
          placeholder="e.g. Double jump, Freeze enemies, Coin magnet..."
          className="w-full px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-jumby-sky font-sans"
        />
      </div>

      <button
        type="button"
        onClick={handleApply}
        disabled={isGenerating || totalCount === 0}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-jumby-purple to-[#8a7bff] text-white font-heading font-black text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-jumby-purple/30 cursor-pointer disabled:opacity-50"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Add ({totalCount}) Power-ups to Game</span>
      </button>
    </div>
  );
}
