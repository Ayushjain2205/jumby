'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Paperclip,
  X,
  Smartphone,
  Monitor,
  Repeat,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Game } from '@/types/game';
import { JumbyLogo } from '@/components/brand/JumbyLogo';

export type TargetDevice = 'mobile' | 'desktop' | 'responsive';

export interface AttachedImage {
  id: string;
  name: string;
  dataUrl: string;
}

interface LovableHeroCreatorProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  selectedTemplate: Game | null;
  onOpenTemplatePicker: () => void;
  onClearTemplate: () => void;
  targetDevice: TargetDevice;
  onTargetDeviceChange: (device: TargetDevice) => void;
  attachedImages: AttachedImage[];
  onAddImages: (images: AttachedImage[]) => void;
  onRemoveImage: (id: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
}

const INSPIRATION_PILLS = [
  '⚡ High-speed 3-lane cyber dodger',
  '🐦 Cyberpunk neon flappy bird',
  '🧱 Satisfying pastel block slice stacker',
  '🪐 Orbital laser reverse pulse survival',
  '🍕 Falling taco catcher with combo streaks',
  '🚀 Retro vector asteroid blaster',
];

export function LovableHeroCreator({
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
  selectedTemplate,
  onOpenTemplatePicker,
  onClearTemplate,
  targetDevice,
  onTargetDeviceChange,
  attachedImages,
  onAddImages,
  onRemoveImage,
  onSelectSuggestion,
}: LovableHeroCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: AttachedImage[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            dataUrl: event.target.result as string,
          });
          if (newImages.length === files.length) {
            onAddImages(newImages);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) {
        onSubmit();
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-jumby-ink text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-jumby-purple/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-jumby-lime/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold font-sans">Explore Games</span>
        </Link>
        <JumbyLogo size="sm" />
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 max-w-3xl mx-auto w-full">
        {/* Title */}
        <div className="text-center space-y-2.5 mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-jumby-purple/20 border border-jumby-purple/40 text-jumby-lavender text-xs font-heading font-black tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-jumby-lime" />
            <span>AI Micro-Game Studio</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
            What game do you want to build?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Describe any gameplay idea, attach sketch references, or pick a starter template.
          </p>
        </div>

        {/* Central Lovable-Style Creation Box */}
        <div className="w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl focus-within:border-jumby-purple/70 transition-all flex flex-col gap-3">
          {/* Active Template Badge (if selected) */}
          {selectedTemplate && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-jumby-purple/20 border border-jumby-purple/40 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-jumby-lime" />
                <span className="text-zinc-300">Inspired by:</span>
                <span className="font-black text-white">{selectedTemplate.title}</span>
              </div>
              <button
                onClick={onClearTemplate}
                className="text-zinc-400 hover:text-white p-0.5"
                title="Remove template"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reference Image Previews */}
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {attachedImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-zinc-950"
                >
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="E.g., A neon cyberpunk bird dodging laser pipes, tapping reverses gravity, collect glowing plasma cores..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed font-sans"
          />

          {/* Bottom Action Bar inside the Box */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Controls: Attach + Inspired By + Device */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Attach Reference Image */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="hero-file-upload"
              />
              <label
                htmlFor="hero-file-upload"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-all active:scale-95"
                title="Attach reference images or sketch"
              >
                <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Attach</span>
              </label>

              {/* Inspired By Template Button */}
              <button
                type="button"
                onClick={onOpenTemplatePicker}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-95"
              >
                <Layers className="w-3.5 h-3.5 text-jumby-purple" />
                <span>Inspired by...</span>
              </button>

              {/* Target Device Selector */}
              <div className="flex items-center p-0.5 rounded-full bg-zinc-950 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => onTargetDeviceChange('mobile')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    targetDevice === 'mobile'
                      ? 'bg-jumby-purple text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Mobile Portrait (9:16)"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTargetDeviceChange('desktop')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    targetDevice === 'desktop'
                      ? 'bg-jumby-purple text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Desktop Landscape (16:9)"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTargetDeviceChange('responsive')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    targetDevice === 'responsive'
                      ? 'bg-jumby-purple text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Both / Responsive Canvas"
                >
                  <Repeat className="w-3 h-3" />
                  <span className="hidden md:inline">Both</span>
                </button>
              </div>
            </div>

            {/* Right: Generate Button */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-jumby-lime hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-heading font-black text-xs sm:text-sm shadow-lg shadow-jumby-lime/25 transition-all active:scale-95 ml-auto"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Generate Game</span>
            </button>
          </div>
        </div>

        {/* Quick Inspiration Pills */}
        <div className="w-full mt-6">
          <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider text-center mb-3">
            Or start from an idea
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {INSPIRATION_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => onSelectSuggestion(pill)}
                className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-jumby-purple/50 text-xs text-zinc-300 hover:text-white transition-all active:scale-95"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
