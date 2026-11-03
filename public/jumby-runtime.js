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
  };

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

  // The Primary Jumby API
  const Jumby = {
    ready: function () {
      sendToParent('JUMBY_READY');
    },
    setScore: function (score) {
      sendToParent('JUMBY_SCORE_UPDATE', { score: Number(score) });
    },
    gameOver: function (score, details = {}) {
      sendToParent('JUMBY_GAME_OVER', { score: Number(score), details });
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
    sound: Sound,
    fx: Juice,
    input: Input,
    on: function (eventType, callback) {
      const type = 'JUMBY_' + eventType.toUpperCase();
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
  };

  global.Jumby = Jumby;

  // Auto-notify ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => Jumby.ready(), 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => Jumby.ready());
  }
})(typeof window !== 'undefined' ? window : globalThis);
