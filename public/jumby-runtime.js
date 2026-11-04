/**
 * Jumby Unified Game Runtime & Micro-Engine (v2.0.0)
 * Pre-baked battle-tested runtime providing:
 * 1. Platform SDK (Scores, Cloud Saves, Jumby Coins, Rewarded Ads)
 * 2. AAA Game Juice (Screen Shake, Particle Emitters, Screen Flash)
 * 3. 8-Bit Web Audio Synthesizer (Zero asset downloads needed)
 * 4. Micro-Engine & Physics helpers (Collision, Unified Input, 60fps loop)
 */
(function (global) {
  'use strict';

  if (global.Jumby) return;

  const pendingRequests = new Map();
  const listeners = new Map();

  // 1. Platform postMessage Bridge
  function sendToParent(type, payload = {}) {
    try {
      if (global.parent && global.parent !== global) {
        global.parent.postMessage(
          {
            source: 'JUMBY_GAME',
            type: type,
            ...payload,
          },
          '*'
        );
      }
    } catch (e) {
      // Ignore cross-origin parent access restrictions
    }
  }

  global.addEventListener('message', function (event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.requestId && pendingRequests.has(data.requestId)) {
      const resolver = pendingRequests.get(data.requestId);
      pendingRequests.delete(data.requestId);
      resolver(data);
      return;
    }

    if (data.type && listeners.has(data.type)) {
      const callbacks = listeners.get(data.type);
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('[Jumby] Error in listener callback:', err);
        }
      });
    }
  });

  // 2. Web Audio Synthesizer
  const AudioContextClass = global.AudioContext || global.webkitAudioContext;
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const Sound = {
    playTone: function (freq = 440, duration = 0.1, type = 'sine', volume = 0.2) {
      const ctx = getAudioCtx();
      if (!ctx) return;
      // If duration is passed in milliseconds (e.g. 40, 100, 250), convert to seconds
      let dur = duration > 5 ? duration / 1000 : duration;
      dur = Math.min(Math.max(dur, 0.02), 1.5);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    jump: function () {
      this.playTone(320, 0.12, 'sine', 0.25);
    },
    score: function () {
      this.playTone(587.33, 0.12, 'triangle', 0.2);
      setTimeout(() => this.playTone(880, 0.18, 'triangle', 0.2), 80);
    },
    hit: function () {
      this.playTone(140, 0.22, 'sawtooth', 0.35);
    },
    coin: function () {
      this.playTone(987.77, 0.08, 'sine', 0.2);
      setTimeout(() => this.playTone(1318.51, 0.15, 'sine', 0.25), 60);
    },
    laser: function () {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    },
    powerup: function () {
      [440, 554, 659, 880].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 0.1, 'sine', 0.2), i * 60);
      });
    },
    fanfare: function () {
      // Ascending celebratory 5-note arpeggio with shimmer
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 0.16, 'triangle', 0.28);
        }, idx * 65);
      });
    },
  };

  // 2.5 Procedural 8-Bit BGM Synthesizer (Zero asset download, responsive Web Audio loop)
  const BGM_TRACKS = {
    arcade: {
      bpm: 132,
      bass: [130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.0, 196.0],
      lead: [
        523.25, 0, 392.0, 0, 329.63, 392.0, 440.0, 523.25,
        440.0, 0, 392.0, 0, 329.63, 0, 293.66, 261.63,
      ],
      leadType: 'square',
      bassType: 'triangle',
    },
    cyber: {
      bpm: 120,
      bass: [110.0, 110.0, 110.0, 110.0, 87.31, 87.31, 87.31, 87.31, 98.0, 98.0, 98.0, 98.0, 82.41, 82.41, 82.41, 82.41],
      lead: [
        440.0, 0, 440.0, 523.25, 0, 440.0, 392.0, 0,
        349.23, 0, 392.0, 440.0, 0, 329.63, 0, 0,
      ],
      leadType: 'sawtooth',
      bassType: 'sawtooth',
    },
    chill: {
      bpm: 88,
      bass: [130.81, 0, 130.81, 0, 110.0, 0, 110.0, 0, 87.31, 0, 87.31, 0, 98.0, 0, 98.0, 0],
      lead: [
        523.25, 0, 493.88, 0, 392.0, 0, 329.63, 0,
        440.0, 0, 392.0, 0, 329.63, 0, 293.66, 0,
      ],
      leadType: 'sine',
      bassType: 'sine',
    },
    action: {
      bpm: 144,
      bass: [73.42, 73.42, 87.31, 73.42, 98.0, 73.42, 103.83, 110.0],
      lead: [
        293.66, 349.23, 440.0, 587.33, 523.25, 440.0, 392.0, 349.23,
        293.66, 0, 349.23, 0, 440.0, 523.25, 587.33, 0,
      ],
      leadType: 'sawtooth',
      bassType: 'triangle',
    },
  };

  const Bgm = {
    isPlaying: false,
    currentVibe: 'arcade',
    volume: 0.12,
    muted: false,
    step: 0,
    timer: null,
    nextNoteTime: 0,
    autoStartPending: false,

    start: function (vibe = 'arcade') {
      this.currentVibe = BGM_TRACKS[vibe] ? vibe : 'arcade';
      this.isPlaying = true;
      const ctx = getAudioCtx();

      if (!ctx || ctx.state === 'suspended') {
        this.autoStartPending = true;
        this._createMuteButton();
        return;
      }
      this.autoStartPending = false;
      this.nextNoteTime = ctx.currentTime + 0.05;
      this.step = 0;

      if (!this.timer) {
        this.timer = setInterval(() => this._schedule(), 35);
      }
      this._createMuteButton();
    },

    stop: function () {
      this.isPlaying = false;
      this.autoStartPending = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    toggle: function () {
      this.muted = !this.muted;
      this._updateMuteButtonUi();
      return !this.muted;
    },

    setVolume: function (vol) {
      this.volume = Math.max(0, Math.min(1, vol));
    },

    _schedule: function () {
      const ctx = getAudioCtx();
      if (!ctx || !this.isPlaying) return;

      const track = BGM_TRACKS[this.currentVibe] || BGM_TRACKS.arcade;
      const secondsPerBeat = 60.0 / track.bpm;
      const stepDuration = secondsPerBeat / 4; // 16th note

      while (this.nextNoteTime < ctx.currentTime + 0.15) {
        if (!this.muted) {
          this._playStep(this.step, this.nextNoteTime, stepDuration, track);
        }
        this.nextNoteTime += stepDuration;
        this.step = (this.step + 1) % 16;
      }
    },

    _playStep: function (step, time, duration, track) {
      const ctx = getAudioCtx();
      if (!ctx) return;

      // 1. Drum Beat (Kick on 0, 4, 8, 12; Crisp Hi-hat click on 2, 6, 10, 14)
      if (step % 4 === 0) {
        // Kick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
        gain.gain.setValueAtTime(this.volume * 0.9, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
      } else if (step % 2 === 0) {
        // Crisp hi-hat click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, time);
        gain.gain.setValueAtTime(this.volume * 0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.03);
      }

      // 2. Bass (every 8th note)
      if (step % 2 === 0) {
        const bassIdx = Math.floor(step / 2) % track.bass.length;
        const bassFreq = track.bass[bassIdx];
        if (bassFreq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = track.bassType || 'triangle';
          osc.frequency.setValueAtTime(bassFreq, time);
          gain.gain.setValueAtTime(this.volume * 0.65, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + duration * 1.8);
        }
      }

      // 3. Lead / Arp (16th notes)
      const leadFreq = track.lead[step % track.lead.length];
      if (leadFreq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = track.leadType || 'square';
        osc.frequency.setValueAtTime(leadFreq, time);
        gain.gain.setValueAtTime(this.volume * 0.45, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration * 0.85);
      }
    },

    _createMuteButton: function () {
      if (document.getElementById('jumby-bgm-mute-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'jumby-bgm-mute-btn';
      btn.title = 'Toggle Music';
      btn.innerHTML = '🎵';
      btn.style.cssText =
        'position:fixed;top:14px;right:14px;width:34px;height:34px;border-radius:50%;background:rgba(20,20,30,0.65);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.18);color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99999;transition:all 0.2s ease;user-select:none;-webkit-tap-highlight-color:transparent;';
      btn.onclick = (e) => {
        e.stopPropagation();
        this.toggle();
      };
      document.body.appendChild(btn);
    },

    _updateMuteButtonUi: function () {
      const btn = document.getElementById('jumby-bgm-mute-btn');
      if (btn) {
        btn.innerHTML = this.muted ? '🔇' : '🎵';
        btn.style.opacity = this.muted ? '0.45' : '0.9';
      }
    },
  };

  Sound.bgm = Bgm;

  // Auto-unlock AudioContext on user interaction
  function unlockAudio() {
    try {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          if (Bgm.autoStartPending) {
            Bgm.start(Bgm.currentVibe);
          }
        }).catch(() => {});
      } else if (Bgm.autoStartPending) {
        Bgm.start(Bgm.currentVibe);
      }
    } catch (e) {}
  }
  global.addEventListener('pointerdown', unlockAudio, { passive: true });
  global.addEventListener('touchstart', unlockAudio, { passive: true });
  global.addEventListener('click', unlockAudio, { passive: true });

  // 3. Screen Shake & Visual Juice
  let shakeIntensity = 0;
  let shakeDecay = 0.9;
  let particlesList = [];

  const Juice = {
    shake: function (intensity = 10) {
      shakeIntensity = intensity;
    },
    particles: function (x, y, count = 15, color = '#D8FF43') {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        particlesList.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3.5 + 1.5,
          color,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
        });
      }
    },
    getShakeOffset: function () {
      if (shakeIntensity > 0.5) {
        return {
          x: (Math.random() - 0.5) * shakeIntensity * 2,
          y: (Math.random() - 0.5) * shakeIntensity * 2,
        };
      }
      return { x: 0, y: 0 };
    },
    applyShake: function (ctx) {
      if (shakeIntensity > 0.5) {
        const ox = (Math.random() - 0.5) * shakeIntensity * 2;
        const oy = (Math.random() - 0.5) * shakeIntensity * 2;
        ctx.translate(ox, oy);
        shakeIntensity *= shakeDecay;
      }
    },
    updateAndRender: function (ctx, width, height) {
      if (shakeIntensity > 0.5) {
        shakeIntensity *= shakeDecay;
      }

      // Update & render particles
      for (let i = particlesList.length - 1; i >= 0; i--) {
        const p = particlesList[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesList.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & render floating texts
      Graphics.updateFloatingTexts(ctx);

      // Render Level & Difficulty Banner if active
      if (typeof Level !== 'undefined' && Level.render) {
        Level.render(ctx, width, height);
      }
    },
  };

  // 4. Graphics & Sprite Sheet Engine (Sprite sheets, animations, emojis, floating text juice)
  const imageCache = new Map();
  const floatingTexts = [];

  const Graphics = {
    getImage: function (src) {
      if (!src) return null;
      if (imageCache.has(src)) return imageCache.get(src);
      const img = new Image();
      img.src = src;
      img.crossOrigin = 'anonymous';
      imageCache.set(src, img);
      return img;
    },

    /**
     * Draw an animated sprite frame from a sprite sheet with flipping and rotation.
     * options: {
     *   image: HTMLImageElement | string (URL),
     *   x: number, y: number,
     *   width?: number, height?: number,
     *   frame?: number (default 0),
     *   frameWidth: number, frameHeight: number,
     *   cols?: number,
     *   flipX?: boolean, flipY?: boolean,
     *   rotation?: number (radians),
     *   scale?: number,
     *   alpha?: number
     * }
     */
    drawSprite: function (ctx, opts) {
      if (!ctx || !opts) return;
      const img = typeof opts.image === 'string' ? this.getImage(opts.image) : opts.image;
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const frame = opts.frame || 0;
      const fw = opts.frameWidth || img.naturalWidth;
      const fh = opts.frameHeight || img.naturalHeight;
      const cols = opts.cols || Math.max(1, Math.floor(img.naturalWidth / fw));

      const col = frame % cols;
      const row = Math.floor(frame / cols);
      const sx = col * fw;
      const sy = row * fh;

      const dw = opts.width || fw;
      const dh = opts.height || fh;
      const scale = opts.scale || 1;

      ctx.save();
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

      ctx.translate(opts.x, opts.y);
      if (opts.rotation) ctx.rotate(opts.rotation);
      if (opts.flipX || opts.flipY) ctx.scale(opts.flipX ? -scale : scale, opts.flipY ? -scale : scale);
      else if (scale !== 1) ctx.scale(scale, scale);

      ctx.drawImage(img, sx, sy, fw, fh, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    },

    /**
     * Render a rich canvas emoji with glowing drop shadow, rotation, and squash/stretch!
     * options: { size?: number, rotation?: number, shadowColor?: string, shadowBlur?: number, scaleX?: number, scaleY?: number }
     */
    drawEmoji: function (ctx, emoji, x, y, size = 32, opts = {}) {
      if (!ctx || !emoji) return;
      ctx.save();
      ctx.translate(x, y);
      if (opts.rotation) ctx.rotate(opts.rotation);
      if (opts.scaleX || opts.scaleY) {
        ctx.scale(opts.scaleX || 1, opts.scaleY || 1);
      }
      if (opts.shadowColor) {
        ctx.shadowColor = opts.shadowColor;
        ctx.shadowBlur = opts.shadowBlur || 15;
      }
      ctx.font = `${Math.round(size)}px -apple-system, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, 0);
      ctx.restore();
    },

    /**
     * Add floating score / juice text popup (e.g. "+100", "PERFECT!", "COMBO x2")
     */
    addFloatingText: function (text, x, y, color = '#FFFFFF', size = 22) {
      floatingTexts.push({
        text,
        x,
        y,
        vy: -1.8,
        color,
        size,
        alpha: 1,
        scale: 1.3,
        decay: 0.024,
      });
    },

    updateFloatingTexts: function (ctx) {
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= ft.decay;
        ft.scale = Math.max(1, ft.scale - 0.015);

        if (ft.alpha <= 0) {
          floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = `900 ${Math.round(ft.size * ft.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    },
  };

  // 4. Unified Input Manager (Touch + Mouse + Keyboard with continuous drag & coordinate scaling)
  const Input = {
    isDown: false,
    justPressed: false,
    touchPos: { x: 0, y: 0 },
    keysDown: new Set(),
    keysJustPressed: new Set(),
    _autoResetTimer: null,
    init: function (canvasElement) {
      if (!canvasElement) return;

      const updatePos = (clientX, clientY) => {
        const rect = canvasElement.getBoundingClientRect();
        const scaleX = rect.width ? canvasElement.width / rect.width : 1;
        const scaleY = rect.height ? canvasElement.height / rect.height : 1;
        this.touchPos = {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
      };

      const handleDown = (x, y) => {
        this.isDown = true;
        this.justPressed = true;
        updatePos(x, y);

        // Safety auto-reset so justPressed never stays true forever if endFrame() is omitted
        if (this._autoResetTimer) clearTimeout(this._autoResetTimer);
        this._autoResetTimer = setTimeout(() => {
          this.justPressed = false;
        }, 50);
      };

      const handleMove = (x, y) => {
        updatePos(x, y);
      };

      const handleUp = () => {
        this.isDown = false;
      };

      canvasElement.addEventListener('pointerdown', (e) => {
        handleDown(e.clientX, e.clientY);
      });
      canvasElement.addEventListener('pointermove', (e) => {
        handleMove(e.clientX, e.clientY);
      });
      global.addEventListener('pointerup', handleUp);

      // Touch fallback
      canvasElement.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      global.addEventListener('keydown', (e) => {
        if (!this.keysDown.has(e.code)) {
          this.keysJustPressed.add(e.code);
        }
        this.keysDown.add(e.code);
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
          this.isDown = true;
          this.justPressed = true;
        }
      });

      global.addEventListener('keyup', (e) => {
        this.keysDown.delete(e.code);
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
          this.isDown = false;
        }
      });
    },
    endFrame: function () {
      this.justPressed = false;
      this.keysJustPressed.clear();
      if (this._autoResetTimer) clearTimeout(this._autoResetTimer);
    },
  };

  // 5. Level & Progressive Difficulty Engine
  const Level = {
    current: 1,
    score: 0,
    multiplier: 1.0,
    progress: 0.0,
    isBreather: false,
    _breatherUntil: 0,

    // Configuration
    enabled: true,
    autoBanner: true,
    pointsPerLevel: 10,
    maxMultiplier: 2.2,
    breatherDuration: 2500, // 2.5s safe breather window after leveling up
    curve: 'smooth', // 'smooth' | 'stepped' | 'waves'
    onLevelUp: null,

    // Active banner state for visual rendering
    activeBanner: null, // { title, subtitle, color, startTime, duration }

    init: function (opts = {}) {
      this.enabled = opts.enabled !== undefined ? !!opts.enabled : true;
      this.autoBanner = opts.autoBanner !== undefined ? !!opts.autoBanner : true;
      this.current = opts.startLevel || 1;
      this.pointsPerLevel = opts.pointsPerLevel || 10;
      this.maxMultiplier = opts.maxMultiplier || 2.2;
      this.breatherDuration = opts.breatherDuration !== undefined ? opts.breatherDuration : 2500;
      this.curve = opts.curve || 'smooth';
      this.onLevelUp = typeof opts.onLevelUp === 'function' ? opts.onLevelUp : null;
      this.multiplier = this._calcMultiplier(this.current);
      this.score = 0;
      this.progress = 0;
      this.isBreather = false;
      this._breatherUntil = 0;
      this.activeBanner = null;
    },

    reset: function () {
      this.current = 1;
      this.score = 0;
      this.multiplier = 1.0;
      this.progress = 0.0;
      this.isBreather = false;
      this._breatherUntil = 0;
      this.activeBanner = null;
    },

    _calcLevel: function (score) {
      if (typeof this.pointsPerLevel === 'function') {
        let lvl = 1;
        while (score >= this.pointsPerLevel(lvl)) {
          lvl++;
        }
        return lvl;
      }
      if (this.curve === 'smooth' || this.curve === 'exponential') {
        const base = this.pointsPerLevel;
        let threshold = 0;
        let lvl = 1;
        while (true) {
          const needed = base + (lvl - 1) * Math.floor(base * 0.4);
          if (score < threshold + needed) {
            this.progress = Math.max(0, Math.min(1, (score - threshold) / needed));
            break;
          }
          threshold += needed;
          lvl++;
        }
        return lvl;
      } else {
        const lvl = Math.floor(score / this.pointsPerLevel) + 1;
        this.progress = (score % this.pointsPerLevel) / this.pointsPerLevel;
        return lvl;
      }
    },

    _calcMultiplier: function (lvl) {
      if (lvl <= 1) return 1.0;
      const rate = 0.22;
      const m = 1.0 + (this.maxMultiplier - 1.0) * (1 - Math.exp(-rate * (lvl - 1)));
      return Math.round(m * 100) / 100;
    },

    check: function (score) {
      if (!this.enabled) return this.current;
      const s = Number(score) || 0;
      this.score = s;
      const newLvl = this._calcLevel(s);

      const now = Date.now();
      if (this.isBreather && now >= this._breatherUntil) {
        this.isBreather = false;
      }

      if (newLvl > this.current) {
        const prevLvl = this.current;
        this.current = newLvl;
        this.multiplier = this._calcMultiplier(this.current);

        if (this.breatherDuration > 0) {
          this.isBreather = true;
          this._breatherUntil = now + this.breatherDuration;
        }

        if (this.autoBanner) {
          this.banner(`LEVEL ${this.current}!`, `SPEED ${this.multiplier}x`, '#FFD700', 2200);
        }

        Sound.fanfare();
        Juice.shake(12);

        if (this.onLevelUp) {
          try {
            this.onLevelUp(this.current, prevLvl);
          } catch (e) {
            console.warn('[Jumby onLevelUp Error]', e);
          }
        }
      }

      return this.current;
    },

    banner: function (title, subtitle = '', color = '#FFD700', duration = 2200) {
      this.activeBanner = {
        title,
        subtitle,
        color,
        startTime: Date.now(),
        duration,
      };
    },

    getSpeed: function (baseSpeed, score) {
      if (score !== undefined) this.check(score);
      return baseSpeed * this.multiplier;
    },

    getSpawnInterval: function (baseInterval, score, minInterval = 25) {
      if (score !== undefined) this.check(score);
      return Math.max(minInterval, Math.floor(baseInterval / this.multiplier));
    },

    render: function (ctx, width, height) {
      if (this.isBreather && Date.now() >= this._breatherUntil) {
        this.isBreather = false;
      }

      if (!this.activeBanner || !ctx) return;

      const elapsed = Date.now() - this.activeBanner.startTime;
      if (elapsed > this.activeBanner.duration) {
        this.activeBanner = null;
        return;
      }

      const progress = elapsed / this.activeBanner.duration;
      let alpha = 1;
      if (progress < 0.15) {
        alpha = progress / 0.15;
      } else if (progress > 0.75) {
        alpha = (1 - progress) / 0.25;
      }

      let scale = 1.0;
      if (progress < 0.25) {
        const p = progress / 0.25;
        scale = 0.4 + Math.sin(p * Math.PI) * 0.75 + p * 0.6;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      const cx = width / 2;
      const cy = height * 0.28;

      const ribbonWidth = Math.min(width * 0.85, 340);
      const ribbonHeight = this.activeBanner.subtitle ? 76 : 54;
      const rx = cx - ribbonWidth / 2;
      const ry = cy - ribbonHeight / 2;

      ctx.shadowColor = this.activeBanner.color;
      ctx.shadowBlur = 25;
      ctx.fillStyle = 'rgba(15, 15, 24, 0.90)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(rx, ry, ribbonWidth, ribbonHeight, 16);
      } else {
        ctx.rect(rx, ry, ribbonWidth, ribbonHeight);
      }
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = this.activeBanner.color;
      ctx.stroke();

      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      ctx.font = '900 28px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = this.activeBanner.color;
      ctx.shadowBlur = 15;
      ctx.fillText(this.activeBanner.title, 0, this.activeBanner.subtitle ? -11 : 0);

      if (this.activeBanner.subtitle) {
        ctx.font = '800 13px -apple-system, sans-serif';
        ctx.fillStyle = this.activeBanner.color;
        ctx.shadowBlur = 8;
        ctx.fillText(this.activeBanner.subtitle.toUpperCase(), 0, 17);
      }

      ctx.restore();
    },
  };

  // The Primary Jumby API
  const Jumby = {
    ready: function () {
      sendToParent('JUMBY_READY');
    },
    setScore: function (score) {
      const num = Number(score) || 0;
      if (num === 0) {
        Level.reset();
      } else {
        Level.check(num);
      }
      sendToParent('JUMBY_SCORE_UPDATE', { score: num });
    },
    gameOver: function (score, details = {}) {
      Level.activeBanner = null;
      sendToParent('JUMBY_GAME_OVER', { score: Number(score), details });
    },
    awardCoins: function (amount = 1, details = {}) {
      const payload = typeof details === 'string' ? { reason: details } : (details || {});
      sendToParent('JUMBY_AWARD_COINS', {
        amount: Math.max(1, Number(amount) || 1),
        item: payload.item || payload.name || 'Collectible',
        icon: payload.icon || payload.emoji || '',
        ...payload,
      });
    },
    storage: {
      get: function (key) {
        return new Promise((resolve) => {
          const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
          pendingRequests.set(requestId, (data) => resolve(data.value));
          sendToParent('JUMBY_STORAGE_GET', { key, requestId });
        });
      },
      set: function (key, value) {
        return new Promise((resolve) => {
          const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
          pendingRequests.set(requestId, (data) => resolve(data.success));
          sendToParent('JUMBY_STORAGE_SET', { key, value, requestId });
        });
      },
    },
    payments: {
      buyItem: function ({ item, priceCoins }) {
        return new Promise((resolve) => {
          const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
          pendingRequests.set(requestId, (data) => resolve(data.success));
          sendToParent('JUMBY_BUY_ITEM', { item, priceCoins, requestId });
        });
      },
    },
    ads: {
      showRewarded: function () {
        return new Promise((resolve) => {
          const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
          pendingRequests.set(requestId, (data) => resolve({ completed: !!data.rewardGranted }));
          sendToParent('JUMBY_SHOW_REWARDED_AD', { requestId });
        });
      },
    },
    drawSprite: Graphics.drawSprite.bind(Graphics),
    drawEmoji: Graphics.drawEmoji.bind(Graphics),
    sound: Sound,
    level: Level,
    fx: Object.assign(Juice, {
      addFloatingText: Graphics.addFloatingText.bind(Graphics),
    }),
    graphics: Graphics,
    input: Input,
    on: function (eventType, callback) {
      const type = 'JUMBY_' + eventType.toUpperCase();
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    // Self-Healing Helper for user execution
    safeCall: function (fn) {
      try {
        if (typeof fn === 'function') fn();
      } catch (err) {
        console.warn('[Jumby SafeCall Caught]', err);
      }
    },
  };

  global.Jumby = Jumby;

  // 6. Runtime Error Shield & Self-Healing Interceptor
  global.addEventListener('error', function (e) {
    console.warn('[Jumby Runtime Shield] Caught unhandled script error:', e.message, 'at', (e.lineno || '?') + ':' + (e.colno || '?'));
    sendToParent('JUMBY_RUNTIME_ERROR', {
      message: e.message || 'Unknown runtime script error',
      line: e.lineno,
      col: e.colno,
      filename: e.filename,
    });
  });

  global.addEventListener('unhandledrejection', function (e) {
    const reason = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    console.warn('[Jumby Runtime Shield] Caught unhandled promise rejection:', reason);
    sendToParent('JUMBY_RUNTIME_ERROR', {
      message: reason,
    });
  });

  // 7. Auto-Bind Canvas & Fallback Resize
  global.addEventListener('load', function () {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      if (canvas.width === 300 && canvas.height === 150) {
        canvas.width = global.innerWidth;
        canvas.height = global.innerHeight;
      }
      if (!Input.boundCanvas) {
        Input.init(canvas);
      }
    }
  });

  // Auto-notify ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => Jumby.ready(), 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => Jumby.ready());
  }
})(typeof window !== 'undefined' ? window : globalThis);
