/**
 * Jumby Game SDK (v1.0.0)
 * Injected into all Jumby sandbox iframes to communicate with the parent app shell.
 */
(function () {
  'use strict';

  if (window.Jumby) return;

  const pendingRequests = new Map();
  const listeners = new Map();

  function sendToParent(type, payload = {}) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            source: 'JUMBY_GAME',
            type: type,
            ...payload,
          },
          '*'
        );
      }
    } catch (e) {}
  }

  window.addEventListener('message', function (event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    // Handle responses to pending async requests (storage, payments, ads)
    if (data.requestId && pendingRequests.has(data.requestId)) {
      const resolver = pendingRequests.get(data.requestId);
      pendingRequests.delete(data.requestId);
      resolver(data);
      return;
    }

    // Handle incoming events from parent (e.g. pause, resume)
    if (data.type && listeners.has(data.type)) {
      const callbacks = listeners.get(data.type);
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('[JumbySDK] Error in listener callback:', err);
        }
      });
    }
  });

  const Jumby = {
    /**
     * Notify parent shell that the game has loaded and initialized its canvas
     */
    ready: function () {
      sendToParent('JUMBY_READY');
    },

    /**
     * Update current live score
     */
    setScore: function (score) {
      sendToParent('JUMBY_SCORE_UPDATE', { score: Number(score) });
    },

    /**
     * Trigger Game Over state and report final score
     */
    gameOver: function (score, details = {}) {
      sendToParent('JUMBY_GAME_OVER', { score: Number(score), details });
    },

    /**
     * Persistent Game Memory / Cloud Save
     */
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

    /**
     * In-Game Purchases (Platform Coins)
     */
    payments: {
      buyItem: function ({ item, priceCoins }) {
        return new Promise((resolve) => {
          const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
          pendingRequests.set(requestId, (data) => resolve(data.success));
          sendToParent('JUMBY_BUY_ITEM', { item, priceCoins, requestId });
        });
      },
    },

    /**
     * In-Game Ads (Rewarded Ads)
     */
    ads: {
      showRewarded: function () {
        return new Promise((resolve) => {
          const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
          pendingRequests.set(requestId, (data) => resolve({ completed: !!data.rewardGranted }));
          sendToParent('JUMBY_SHOW_REWARDED_AD', { requestId });
        });
      },
    },

    /**
     * Event listeners (e.g. pause, resume)
     */
    on: function (eventType, callback) {
      const type = 'JUMBY_' + eventType.toUpperCase();
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(callback);
    },

    /**
     * Lightweight Web Audio Synthesizer (Instant 8-bit sound effects without loading audio files)
     */
    sound: {
      ctx: null,
      getCtx: function () {
        if (!this.ctx && typeof window !== 'undefined') {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        return this.ctx;
      },
      playTone: function (freq = 440, duration = 0.1, type = 'square', volume = 0.2) {
        const ctx = this.getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      },
      jump: function () {
        this.playTone(320, 0.12, 'sine', 0.25);
      },
      score: function () {
        this.playTone(587.33, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playTone(880, 0.2, 'triangle', 0.2), 80);
      },
      hit: function () {
        this.playTone(150, 0.2, 'sawtooth', 0.3);
      },
      powerup: function () {
        [440, 554, 659, 880].forEach((f, i) => {
          setTimeout(() => this.playTone(f, 0.1, 'sine', 0.2), i * 60);
        });
      },
    },
  };

  window.Jumby = Jumby;

  // Auto-report ready when DOM is loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => Jumby.ready(), 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => Jumby.ready());
  }
})();
