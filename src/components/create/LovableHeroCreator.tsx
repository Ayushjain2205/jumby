'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  Paperclip,
  X,
  Smartphone,
  Monitor,
  Repeat,
  Layers,
  ArrowRight,
  Gamepad2,
  Compass,
  Users,
  Bell,
  Plus,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { Game } from '@/types/game';
import { JumbyLogo } from '@/components/brand/JumbyLogo';
import { useWallet } from '@/context/WalletContext';

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

const EXAMPLE_SUGGESTIONS_ROW1 = [
  { icon: '⚡', label: 'Neon cyber dodger', prompt: 'A fast 3-lane neon cyber dodger with glowing obstacles' },
  { icon: '🎮', label: 'Flappy bird in space', prompt: 'Flappy bird flying through cosmic space laser pipes' },
  { icon: '🧱', label: 'Block stacker', prompt: 'Satisfying 3D pastel block stacker with precision slicing' },
  { icon: '🌮', label: 'Taco catcher', prompt: 'Catch falling spicy tacos in a sombrero basket with combo streak' },
];

const EXAMPLE_SUGGESTIONS_ROW2 = [
  { icon: '🪐', label: 'Orbit survival', prompt: 'Dual orbital pulse rhythm survival game, tap to switch orbit direction' },
  { icon: '🚀', label: 'Asteroid blaster', prompt: 'Classic arcade vector ship blasting pixel asteroids and invaders' },
  { icon: '🚗', label: 'Gravity racer', prompt: 'High speed cyber car racer flipping gravity between ceiling and floor' },
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
  const { coins = 2450, openShop } = useWallet() || {};

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
    <div className="min-h-screen w-full bg-gradient-to-b from-[#141227] via-[#191636] to-[#110f24] text-white flex flex-col font-sans relative overflow-hidden select-none">
      {/* Background Stylized Puffy Clouds */}
      <div className="absolute top-16 -left-12 w-64 h-40 bg-[#42367d]/35 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-28 -right-12 w-72 h-44 bg-[#4a3a8e]/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[550px] bg-[#7160FF]/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/5 bg-[#141227]/70 backdrop-blur-md">
        {/* Left: Brand + Nav Links */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="shrink-0 flex items-center">
            <JumbyLogo size="sm" />
          </Link>

          <div className="h-5 w-px bg-white/15 hidden sm:block" />

          <nav className="flex items-center gap-1 sm:gap-1.5">
            {/* Active Create Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-jumby-purple to-[#8374ff] text-white font-heading font-black text-xs shadow-md shadow-jumby-purple/30 cursor-default">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Create</span>
            </div>

            {/* Explore */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 font-sans font-bold text-xs transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Explore</span>
            </Link>

            {/* My Games */}
            <button
              type="button"
              onClick={onOpenTemplatePicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 font-sans font-bold text-xs transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">My Games</span>
            </button>

            {/* Community */}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 font-sans font-bold text-xs transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden lg:inline">Community</span>
            </button>
          </nav>
        </div>

        {/* Right: Notifications, Coins & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Bell Notification */}
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Coins Pill with Plus */}
          <button
            type="button"
            onClick={openShop}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b1935] hover:bg-[#25224a] border border-white/10 text-white font-heading font-black text-xs shadow-inner transition-all active:scale-95 cursor-pointer"
            title="Jumby Coins"
          >
            <span className="text-sm">🪙</span>
            <span>{coins ? coins.toLocaleString() : '2,450'}</span>
            <Plus className="w-3 h-3 text-zinc-400 stroke-[3]" />
          </button>

          {/* User Avatar with Crown */}
          <div className="flex items-center gap-1 pl-1 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-jumby-purple to-jumby-lime p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                <span className="text-sm">👑</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
        {/* Title Headline with Stylized Yellow Build Accent */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>What game do you want to</span>
            <span className="text-jumby-lime relative inline-flex items-center">
              build?
              {/* 3 Yellow Accent Sparks next to build? */}
              <span className="ml-1.5 inline-flex flex-col gap-0.5 select-none text-yellow-300 transform translate-y-0.5">
                <span className="w-2.5 h-[3px] bg-yellow-300 rounded-full transform rotate-20" />
                <span className="w-3.5 h-[3px] bg-yellow-300 rounded-full my-0.5" />
                <span className="w-2.5 h-[3px] bg-yellow-300 rounded-full transform -rotate-20" />
              </span>
            </span>
          </h1>
          <p className="text-zinc-300/80 text-xs sm:text-sm md:text-base font-sans font-medium mt-2.5">
            Turn your idea into a playable game in seconds.
          </p>
        </div>

        {/* Central Creation Prompt Card */}
        <div className="w-full max-w-2xl bg-[#191637]/95 border-2 border-jumby-purple/90 rounded-[28px] sm:rounded-[32px] p-3 sm:p-4 shadow-[0_0_50px_rgba(113,96,255,0.35)] backdrop-blur-2xl flex flex-col gap-3 relative transition-all">
          {/* Active Template Badge (if selected) */}
          {selectedTemplate && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-jumby-purple/20 border border-jumby-purple/40 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-jumby-lime" />
                <span className="text-zinc-300">Inspired by:</span>
                <span className="font-black text-white">{selectedTemplate.title}</span>
              </div>
              <button
                type="button"
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
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inner Recessed Textarea Container */}
          <div className="bg-[#121025] rounded-[20px] sm:rounded-[22px] border border-white/5 p-4 sm:p-5 relative flex flex-col justify-between min-h-[110px]">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Describe your game idea..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed font-sans pr-8"
            />

            {/* Gallery Image Attachment Shortcut in Corner */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Attach reference image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 px-1">
            {/* Left Controls: Attach + Device Switcher */}
            <div className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="hero-file-upload-action"
              />

              {/* Attach Pill */}
              <label
                htmlFor="hero-file-upload-action"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-all active:scale-95"
                title="Attach reference images or sketch"
              >
                <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                <span>Attach</span>
              </label>

              {/* Device Selector Pill Container */}
              <div className="flex items-center p-0.5 rounded-full bg-black/40 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => onTargetDeviceChange('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    targetDevice === 'mobile'
                      ? 'bg-jumby-purple text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTargetDeviceChange('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    targetDevice === 'desktop'
                      ? 'bg-jumby-purple text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTargetDeviceChange('responsive')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    targetDevice === 'responsive'
                      ? 'bg-jumby-purple text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Both / Responsive"
                >
                  <Repeat className="w-3 h-3" />
                  <span>Both</span>
                </button>
              </div>

              {/* Vertical divider */}
              <div className="h-5 w-px bg-white/10 hidden sm:block mx-0.5" />
            </div>

            {/* Right: Primary Create Game CTA Button */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-jumby-lime hover:bg-[#cbf425] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-heading font-black text-xs sm:text-sm shadow-lg shadow-jumby-lime/25 transition-all active:scale-95 ml-auto cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 stroke-[2.5]" />
              <span>Create Game</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* OR TRY AN EXAMPLE Section */}
        <div className="w-full max-w-xl mx-auto mt-7">
          <div className="flex items-center gap-4 text-[11px] tracking-[0.2em] uppercase font-bold text-zinc-400 select-none mb-3.5">
            <div className="h-px bg-white/10 flex-1" />
            <span>OR TRY AN EXAMPLE</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Row 1 Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-2.5">
            {EXAMPLE_SUGGESTIONS_ROW1.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectSuggestion(item.prompt)}
                className="px-3.5 py-1.5 rounded-full bg-[#1b1838]/90 hover:bg-[#25204d] border border-white/10 hover:border-jumby-purple/50 text-xs font-bold text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Row 2 Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {EXAMPLE_SUGGESTIONS_ROW2.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectSuggestion(item.prompt)}
                className="px-3.5 py-1.5 rounded-full bg-[#1b1838]/90 hover:bg-[#25204d] border border-white/10 hover:border-jumby-purple/50 text-xs font-bold text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Left Character Illustration Slot (Sitting on grass voxel with crown & controller) */}
      <div className="hidden lg:block absolute bottom-0 left-2 w-64 h-64 pointer-events-none select-none z-10">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
          {/* Green Voxel Grass Island */}
          <path d="M10 160 L140 160 L140 190 L10 190 Z" fill="#65A30D" />
          <path d="M10 150 L140 150 L140 160 L10 160 Z" fill="#84CC16" />
          <path d="M20 190 L130 190 L130 200 L20 200 Z" fill="#4D7C0F" />

          {/* Purple Monster Mascot Body */}
          <rect x="35" y="85" width="80" height="70" rx="28" fill="#7160FF" />
          <rect x="42" y="92" width="66" height="56" rx="20" fill="#6050EE" />

          {/* Golden Crown with sparkle */}
          <path d="M52 85 L60 62 L75 75 L90 62 L98 85 Z" fill="#FACC15" />
          <path d="M54 85 L60 65 L75 77 L90 65 L96 85 Z" fill="#EAB308" />

          {/* Sparkles around crown */}
          <circle cx="112" cy="72" r="3" fill="#FEF08A" />
          <circle cx="120" cy="84" r="2" fill="#FEF08A" />

          {/* Mascot Happy Face */}
          <circle cx="60" cy="112" r="5" fill="#0F0F0F" />
          <circle cx="90" cy="112" r="5" fill="#0F0F0F" />
          <path d="M68 120 Q75 128 82 120" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" fill="#DC2626" />

          {/* Hands holding White Controller */}
          <rect x="52" y="130" width="46" height="24" rx="8" fill="#FFFFFF" />
          <circle cx="62" cy="142" r="3" fill="#7160FF" />
          <circle cx="88" cy="142" r="3" fill="#D8FF43" />
          <rect x="71" y="139" width="8" height="6" rx="2" fill="#D1D5DB" />
        </svg>
      </div>

      {/* Right Castle Illustration Slot (Voxel purple fairytale castle with pink flag) */}
      <div className="hidden lg:block absolute bottom-0 right-2 w-64 h-64 pointer-events-none select-none z-10">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
          {/* Green Voxel Island */}
          <path d="M60 160 L190 160 L190 190 L60 190 Z" fill="#65A30D" />
          <path d="M60 150 L190 150 L190 160 L60 160 Z" fill="#84CC16" />
          <path d="M70 190 L180 190 L180 200 L70 200 Z" fill="#4D7C0F" />

          {/* Castle Wall Base */}
          <rect x="90" y="105" width="80" height="50" rx="4" fill="#9384FF" />
          {/* Castle Battlement Crenellations */}
          <rect x="90" y="95" width="16" height="12" fill="#7E6EF7" />
          <rect x="122" y="95" width="16" height="12" fill="#7E6EF7" />
          <rect x="154" y="95" width="16" height="12" fill="#7E6EF7" />

          {/* Castle Tower Turret */}
          <rect x="110" y="65" width="40" height="40" rx="4" fill="#8374FF" />
          <rect x="110" y="58" width="10" height="8" fill="#6C5CE7" />
          <rect x="125" y="58" width="10" height="8" fill="#6C5CE7" />
          <rect x="140" y="58" width="10" height="8" fill="#6C5CE7" />

          {/* Castle Golden Door */}
          <path d="M120 155 L120 130 Q130 120 140 130 L140 155 Z" fill="#FACC15" />

          {/* Castle Pink Flag */}
          <line x1="130" y1="58" x2="130" y2="35" stroke="#E5E7EB" strokeWidth="2.5" />
          <path d="M130 36 L155 44 L130 52 Z" fill="#EC4899" />
        </svg>
      </div>
    </div>
  );
}
