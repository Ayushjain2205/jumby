/**
 * Jumby Dynamic Game Template Generator
 * Produces complete, runnable HTML5 Canvas games with window.Jumby SDK integration across 4 core game archetypes.
 */

import { injectOrReplaceFontInHtml, detectFontVibe } from '@/lib/fonts/game-fonts';

export type GameArchetype = 'flappy' | 'orbit' | 'stack' | 'runner';

export interface GameTemplateConfig {
  title: string;
  themeColor: string;
  accentColor: string;
  bgGradient: [string, string];
  gameType: GameArchetype;
  speedMultiplier: number;
  gravity: number;
  fontVibe?: string;
  customJsSnippet?: string;
}

export function generateGameHtml(config: GameTemplateConfig): string {
  let html = '';
  switch (config.gameType) {
    case 'orbit':
      html = generateOrbitHtml(config);
      break;
    case 'stack':
      html = generateStackHtml(config);
      break;
    case 'runner':
      html = generateRunnerHtml(config);
      break;
    case 'flappy':
    default:
      html = generateFlappyHtml(config);
      break;
  }
  const vibe = config.fontVibe || detectFontVibe(config.title, config.gameType).id;
  return injectOrReplaceFontInHtml(html, vibe);
}

// 1. FLAPPY JUMPER ARCHETYPE
function generateFlappyHtml(config: GameTemplateConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.title}</title>
  <script src="/jumby-sdk.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${config.bgGradient[0]}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 24px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 52px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${config.themeColor}; }
    #hint { position: absolute; bottom: 30%; left: 0; right: 0; text-align: center; color: ${config.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${config.accentColor}; pointer-events: none; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP OR SPACE TO START</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const hintEl = document.getElementById('hint');

    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let state = 'waiting';
    let score = 0;
    let frames = 0;

    const player = {
      x: 90,
      y: height * 0.5,
      radius: 16,
      vy: 0,
      gravity: ${config.gravity},
      jumpForce: -7.5,
      trail: [],
      reset() {
        this.y = height * 0.5;
        this.vy = 0;
        this.trail = [];
      }
    };

    let items = [];
    const itemSpeed = 3.2 * ${config.speedMultiplier};

    function spawnItem() {
      items.push({
        x: width + 20,
        y: Math.random() * (height - 180) + 90,
        radius: 14,
        type: Math.random() > 0.4 ? 'hazard' : 'coin'
      });
    }

    function handleAction() {
      if (state === 'waiting') {
        state = 'playing';
        hintEl.style.display = 'none';
        player.vy = player.jumpForce;
        if (window.Jumby) window.Jumby.sound.jump();
      } else if (state === 'playing') {
        player.vy = player.jumpForce;
        if (window.Jumby) window.Jumby.sound.jump();
      } else if (state === 'dead') {
        state = 'waiting';
        score = 0;
        items = [];
        player.reset();
        scoreEl.textContent = '0';
        hintEl.style.display = 'block';
        hintEl.textContent = 'TAP TO PLAY AGAIN';
        if (window.Jumby) window.Jumby.setScore(0);
      }
    }

    window.addEventListener('pointerdown', handleAction);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    });

    function die() {
      state = 'dead';
      hintEl.style.display = 'block';
      hintEl.textContent = 'TAP TO RETRY';
      if (window.Jumby) {
        window.Jumby.sound.hit();
        window.Jumby.gameOver(score);
      }
    }

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '${config.bgGradient[0]}');
      grad.addColorStop(1, '${config.bgGradient[1]}');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (state === 'playing') {
        player.vy += player.gravity;
        player.y += player.vy;

        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 10) player.trail.shift();

        if (frames % 45 === 0) spawnItem();

        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.x -= itemSpeed;

          const dist = Math.hypot(player.x - item.x, player.y - item.y);
          if (dist < player.radius + item.radius) {
            if (item.type === 'hazard') {
              die();
            } else {
              items.splice(i, 1);
              score += 2;
              scoreEl.textContent = score;
              if (window.Jumby) {
                window.Jumby.setScore(score);
                window.Jumby.sound.score();
              }
              continue;
            }
          }

          if (item.x < -30) {
            items.splice(i, 1);
            score++;
            scoreEl.textContent = score;
            if (window.Jumby) window.Jumby.setScore(score);
          }
        }

        if (player.y > height || player.y < 0) die();
      }

      for (const item of items) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.type === 'hazard' ? '${config.accentColor}' : '${config.themeColor}';
        ctx.fillStyle = item.type === 'hazard' ? '${config.accentColor}' : '${config.themeColor}';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < player.trail.length; i++) {
        const t = player.trail[i];
        const alpha = (i + 1) / player.trail.length * 0.4;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(t.x, t.y, player.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 20;
      ctx.shadowColor = '${config.themeColor}';
      ctx.fillStyle = '${config.themeColor}';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    loop();
  </script>
</body>
</html>`;
}

// 2. ORBITAL SURVIVAL ARCHETYPE
function generateOrbitHtml(config: GameTemplateConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.title}</title>
  <script src="/jumby-sdk.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${config.bgGradient[0]}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 24px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 52px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${config.themeColor}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${config.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${config.accentColor}; pointer-events: none; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP TO REVERSE ORBIT</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const hintEl = document.getElementById('hint');

    let width, height, cx, cy, orbitRadius;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      orbitRadius = Math.min(width, height) * 0.32;
    }
    window.addEventListener('resize', resize);
    resize();

    let state = 'waiting';
    let score = 0;
    let frames = 0;

    const player = {
      angle: 0,
      speed: 0.045 * ${config.speedMultiplier},
      direction: 1,
      radius: 14,
      particles: []
    };

    let hazards = [];
    let crystals = [];

    function spawnHazard() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.min(score * 0.05, 3.5);
      hazards.push({
        x: cx + Math.cos(angle) * (orbitRadius * 1.9),
        y: cy + Math.sin(angle) * (orbitRadius * 1.9),
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        radius: 12,
        color: '${config.accentColor}'
      });
    }

    function handleAction() {
      if (state === 'waiting') {
        state = 'playing';
        hintEl.style.display = 'none';
        player.direction *= -1;
        if (window.Jumby) window.Jumby.sound.jump();
      } else if (state === 'playing') {
        player.direction *= -1;
        if (window.Jumby) window.Jumby.sound.jump();
      } else if (state === 'dead') {
        state = 'waiting';
        score = 0;
        frames = 0;
        scoreEl.textContent = '0';
        hintEl.style.display = 'block';
        hintEl.textContent = 'TAP TO REVERSE ORBIT';
        hazards = [];
        player.angle = 0;
        if (window.Jumby) window.Jumby.setScore(0);
      }
    }

    window.addEventListener('pointerdown', handleAction);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    });

    function die() {
      state = 'dead';
      hintEl.style.display = 'block';
      hintEl.textContent = 'TAP TO RESTART';
      if (window.Jumby) {
        window.Jumby.sound.hit();
        window.Jumby.gameOver(score);
      }
    }

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      ctx.fillStyle = '${config.bgGradient[0]}';
      ctx.fillRect(0, 0, width, height);

      // Core
      ctx.shadowBlur = 25;
      ctx.shadowColor = '${config.themeColor}';
      ctx.fillStyle = '${config.themeColor}';
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();

      // Track
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (state === 'playing') {
        player.angle += player.speed * player.direction;
        const px = cx + Math.cos(player.angle) * orbitRadius;
        const py = cy + Math.sin(player.angle) * orbitRadius;

        player.particles.push({ x: px, y: py, alpha: 0.8 });
        if (player.particles.length > 12) player.particles.shift();

        if (frames % 40 === 0) spawnHazard();

        for (let i = hazards.length - 1; i >= 0; i--) {
          const h = hazards[i];
          h.x += h.vx;
          h.y += h.vy;

          const dist = Math.hypot(px - h.x, py - h.y);
          if (dist < player.radius + h.radius) {
            die();
          }

          const distCore = Math.hypot(cx - h.x, cy - h.y);
          if (distCore < 28) {
            hazards.splice(i, 1);
            score++;
            scoreEl.textContent = score;
            if (window.Jumby) window.Jumby.setScore(score);
          }
        }
      }

      for (const h of hazards) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = h.color;
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const px = cx + Math.cos(player.angle) * orbitRadius;
      const py = cy + Math.sin(player.angle) * orbitRadius;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '${config.themeColor}';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, player.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    loop();
  </script>
</body>
</html>`;
}

// 3. TRUE 3D ISOMETRIC STACK ARCHETYPE (Ketchapp Stack style)
function generateStackHtml(config: GameTemplateConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${config.title}</title>
  <script src="/jumby-sdk.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; -webkit-user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0F0D1C; font-family: 'Fredoka', cursive, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 32px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 64px; font-weight: 900; color: #ffffff; text-shadow: 0 4px 25px rgba(0,0,0,0.5); }
    .combo { font-size: 20px; font-weight: 800; color: #D8FF43; text-shadow: 0 2px 12px rgba(0,0,0,0.6); min-height: 28px; }
    #hint { position: absolute; bottom: 18%; left: 0; right: 0; text-align: center; color: #D8FF43; font-size: 15px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 12px rgba(0,0,0,0.6); pointer-events: none; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.97); } }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;900&display=swap" rel="stylesheet">
</head>
<body>
  <div id="ui">
    <div id="score" class="score">0</div>
    <div id="combo" class="combo"></div>
  </div>
  <div id="hint">TAP TO SLICE & STACK</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const hintEl = document.getElementById('hint');

    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Built-in Web Audio Synthesizer
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioCtor) audioCtx = new AudioCtor();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
    function playChime(comboIndex) {
      const actx = getAudioCtx();
      if (!actx) return;
      const freq = PENTATONIC[Math.min(comboIndex, PENTATONIC.length - 1)];
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, actx.currentTime);
      gain.gain.setValueAtTime(0.22, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.36);
    }

    function playSnap() {
      const actx = getAudioCtx();
      if (!actx) return;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, actx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.09);
    }

    function playHit() {
      const actx = getAudioCtx();
      if (!actx) return;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, actx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.26);
    }

    // Isometric 3D Projection (30 degree tilt)
    const ISO_ANGLE = Math.PI / 6;
    const COS_A = Math.cos(ISO_ANGLE);
    const SIN_A = Math.sin(ISO_ANGLE);

    function toScreen(x, y, z, originX, originY) {
      return {
        x: originX + (x - z) * COS_A,
        y: originY + (x + z) * SIN_A - y
      };
    }

    function shade(col, p) {
      let num = parseInt(col.slice(1), 16);
      let amt = Math.round(2.55 * p);
      let R = (num >> 16) + amt;
      let G = (num >> 8 & 0x00FF) + amt;
      let B = (num & 0x0000FF) + amt;
      return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }

    function hslToHex(h, s, l) {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return "#" + f(0) + f(8) + f(4);
    }

    const BLOCK_HEIGHT = 22;
    const INITIAL_SIZE = 140;
    const LIMIT = 180;

    let state = 'playing';
    let score = 0;
    let combo = 0;
    let stack = [];
    let activeBlock = null;
    let debris = [];
    let cameraY = 0;
    let targetCameraY = 0;

    function resetGame() {
      state = 'playing';
      score = 0;
      combo = 0;
      cameraY = 0;
      targetCameraY = 0;
      debris = [];
      lastActionTime = Date.now() + 250;
      scoreEl.textContent = '0';
      comboEl.textContent = '';
      hintEl.style.display = 'none';

      const baseHex = hslToHex(210, 80, 68);
      stack = [
        {
          x: 0,
          z: 0,
          y: 0,
          w: INITIAL_SIZE,
          d: INITIAL_SIZE,
          h: BLOCK_HEIGHT,
          color: baseHex
        }
      ];

      spawnNextBlock();
      if (window.Jumby) {
        window.Jumby.setScore(0);
        if (window.Jumby.sound) window.Jumby.sound.jump();
      }
    }

    function spawnNextBlock() {
      const top = stack[stack.length - 1];
      const axis = stack.length % 2 === 1 ? 'x' : 'z';
      const nextHex = hslToHex((210 + stack.length * 10) % 360, 80, 68);
      const speed = (3.6 + Math.min(score * 0.08, 3.2)) * ${config.speedMultiplier};

      activeBlock = {
        axis: axis,
        x: axis === 'x' ? -LIMIT : top.x,
        z: axis === 'z' ? -LIMIT : top.z,
        y: top.y + BLOCK_HEIGHT,
        w: top.w,
        d: top.d,
        h: BLOCK_HEIGHT,
        speed: speed,
        dir: 1,
        color: nextHex
      };
    }

    function drop() {
      if (!activeBlock || state !== 'playing') return;

      const top = stack[stack.length - 1];
      const axis = activeBlock.axis;

      if (axis === 'x') {
        const diff = activeBlock.x - top.x;
        const absDiff = Math.abs(diff);

        // 1. Total Miss
        if (absDiff >= top.w) {
          debris.push({
            ...activeBlock,
            vy: 0,
            rot: 0,
            rotDir: activeBlock.dir * 0.08,
            alpha: 1.0
          });
          activeBlock = null;
          die();
          return;
        }

        // 2. Perfect Placement (< 4px)
        if (absDiff < 4) {
          combo++;
          playChime(combo);
          activeBlock.x = top.x;

          if (combo >= 7) {
            activeBlock.w = Math.min(INITIAL_SIZE, activeBlock.w + 8);
          }

          stack.push({
            x: top.x,
            z: top.z,
            y: activeBlock.y,
            w: activeBlock.w,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });

          comboEl.textContent = combo > 1 ? 'PERFECT x' + combo + '!' : 'PERFECT!';
          if (window.Jumby) {
            if (window.Jumby.sound) window.Jumby.sound.coin();
            if (window.Jumby.fx) {
              const scr = toScreen(top.x, activeBlock.y + BLOCK_HEIGHT, top.z, width / 2, height * 0.65 + cameraY);
              window.Jumby.fx.particles(scr.x, scr.y, 22, '#D8FF43');
              window.Jumby.fx.addFloatingText('PERFECT! +50', scr.x, scr.y - 15, '#D8FF43', 24);
            }
          }
        } else {
          // Overhang Slice
          combo = 0;
          comboEl.textContent = '';
          playSnap();

          const newW = top.w - absDiff;
          const newX = top.x + diff / 2;
          const debrisW = absDiff;
          const debrisX = diff > 0 ? newX + (newW / 2) + (debrisW / 2) : newX - (newW / 2) - (debrisW / 2);

          stack.push({
            x: newX,
            z: top.z,
            y: activeBlock.y,
            w: newW,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });

          debris.push({
            x: debrisX,
            z: top.z,
            y: activeBlock.y,
            w: debrisW,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color,
            vy: 0,
            rot: 0,
            rotDir: diff > 0 ? 0.08 : -0.08,
            alpha: 1.0
          });

          if (window.Jumby && window.Jumby.sound) {
            window.Jumby.sound.score();
          }
        }
      } else {
        // Z Axis
        const diff = activeBlock.z - top.z;
        const absDiff = Math.abs(diff);

        // 1. Total Miss
        if (absDiff >= top.d) {
          debris.push({
            ...activeBlock,
            vy: 0,
            rot: 0,
            rotDir: activeBlock.dir * 0.08,
            alpha: 1.0
          });
          activeBlock = null;
          die();
          return;
        }

        // 2. Perfect Placement (< 4px)
        if (absDiff < 4) {
          combo++;
          playChime(combo);
          activeBlock.z = top.z;

          if (combo >= 7) {
            activeBlock.d = Math.min(INITIAL_SIZE, activeBlock.d + 8);
          }

          stack.push({
            x: top.x,
            z: top.z,
            y: activeBlock.y,
            w: top.w,
            d: activeBlock.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });

          comboEl.textContent = combo > 1 ? 'PERFECT x' + combo + '!' : 'PERFECT!';
          if (window.Jumby) {
            if (window.Jumby.sound) window.Jumby.sound.coin();
            if (window.Jumby.fx) {
              const scr = toScreen(top.x, activeBlock.y + BLOCK_HEIGHT, top.z, width / 2, height * 0.65 + cameraY);
              window.Jumby.fx.particles(scr.x, scr.y, 22, '#D8FF43');
              window.Jumby.fx.addFloatingText('PERFECT! +50', scr.x, scr.y - 15, '#D8FF43', 24);
            }
          }
        } else {
          // Overhang Slice
          combo = 0;
          comboEl.textContent = '';
          playSnap();

          const newD = top.d - absDiff;
          const newZ = top.z + diff / 2;
          const debrisD = absDiff;
          const debrisZ = diff > 0 ? newZ + (newD / 2) + (debrisD / 2) : newZ - (newD / 2) - (debrisD / 2);

          stack.push({
            x: top.x,
            z: newZ,
            y: activeBlock.y,
            w: top.w,
            d: newD,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });

          debris.push({
            x: top.x,
            z: debrisZ,
            y: activeBlock.y,
            w: top.w,
            d: debrisD,
            h: BLOCK_HEIGHT,
            color: activeBlock.color,
            vy: 0,
            rot: 0,
            rotDir: diff > 0 ? 0.08 : -0.08,
            alpha: 1.0
          });

          if (window.Jumby && window.Jumby.sound) {
            window.Jumby.sound.score();
          }
        }
      }

      score++;
      scoreEl.textContent = score;
      if (window.Jumby) window.Jumby.setScore(score);

      targetCameraY = (stack.length - 1) * BLOCK_HEIGHT;
      spawnNextBlock();
    }

    function die() {
      state = 'dead';
      playHit();
      hintEl.style.display = 'block';
      hintEl.textContent = 'MISSED! TAP TO RETRY';
      if (window.Jumby) {
        if (window.Jumby.sound) window.Jumby.sound.hit();
        if (window.Jumby.fx) window.Jumby.fx.shake(16);
        window.Jumby.gameOver(score);
      }
    }

    let lastActionTime = 0;
    function handleAction(e) {
      if (e && e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
      const now = Date.now();
      if (now - lastActionTime < 220) return;
      lastActionTime = now;

      getAudioCtx();
      if (state === 'dead') {
        resetGame();
      } else if (state === 'playing') {
        drop();
      }
    }

    window.addEventListener('pointerdown', handleAction);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction(e);
      }
    });

    function drawIsoBlock(b, originX, originY) {
      const x = b.x;
      const z = b.z;
      const y = b.y;
      const w = b.w;
      const d = b.d;
      const h = b.h;

      // 8 Isometric Vertices
      const pBack  = toScreen(x - w / 2, y + h, z - d / 2, originX, originY);
      const pRight = toScreen(x + w / 2, y + h, z - d / 2, originX, originY);
      const pFront = toScreen(x + w / 2, y + h, z + d / 2, originX, originY);
      const pLeft  = toScreen(x - w / 2, y + h, z + d / 2, originX, originY);

      const bLeft  = toScreen(x - w / 2, y, z + d / 2, originX, originY);
      const bFront = toScreen(x + w / 2, y, z + d / 2, originX, originY);
      const bRight = toScreen(x + w / 2, y, z - d / 2, originX, originY);

      // 1. Front-Left Face (medium shade)
      ctx.fillStyle = shade(b.color, -18);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pFront.x, pFront.y);
      ctx.lineTo(bFront.x, bFront.y);
      ctx.lineTo(bLeft.x, bLeft.y);
      ctx.closePath();
      ctx.fill();

      // 2. Front-Right Face (darker shadow)
      ctx.fillStyle = shade(b.color, -34);
      ctx.beginPath();
      ctx.moveTo(pFront.x, pFront.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(bRight.x, bRight.y);
      ctx.lineTo(bFront.x, bFront.y);
      ctx.closePath();
      ctx.fill();

      // 3. Top Face (bright pastel)
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(pBack.x, pBack.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pFront.x, pFront.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.closePath();
      ctx.fill();

      // Subtle top rim highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    resetGame();

    function loop() {
      requestAnimationFrame(loop);

      // Smooth Camera Lerp
      cameraY += (targetCameraY - cameraY) * 0.12;
      const originX = width / 2;
      const originY = height * 0.65 + cameraY;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1D173F');
      grad.addColorStop(1, '#0B0914');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Active Block Sweep
      if (state === 'playing' && activeBlock) {
        if (activeBlock.axis === 'x') {
          activeBlock.x += activeBlock.speed * activeBlock.dir;
          if (activeBlock.x >= LIMIT) {
            activeBlock.x = LIMIT;
            activeBlock.dir = -1;
          } else if (activeBlock.x <= -LIMIT) {
            activeBlock.x = -LIMIT;
            activeBlock.dir = 1;
          }
        } else {
          activeBlock.z += activeBlock.speed * activeBlock.dir;
          if (activeBlock.z >= LIMIT) {
            activeBlock.z = LIMIT;
            activeBlock.dir = -1;
          } else if (activeBlock.z <= -LIMIT) {
            activeBlock.z = -LIMIT;
            activeBlock.dir = 1;
          }
        }
      }

      // Draw Foundation Pedestal (Grounds the entire tower)
      drawIsoBlock({
        x: 0,
        z: 0,
        y: -300,
        w: INITIAL_SIZE,
        d: INITIAL_SIZE,
        h: 300,
        color: '#1A162B'
      }, originX, originY);

      // Draw Static Stacked Blocks
      for (let i = 0; i < stack.length; i++) {
        drawIsoBlock(stack[i], originX, originY);
      }

      // Draw Moving Active Block
      if (state === 'playing' && activeBlock) {
        drawIsoBlock(activeBlock, originX, originY);
      }

      // Render Falling Debris with Gravity Physics (Clean downward drop in isometric perspective)
      if (debris.length > 0) {
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i];
          d.vy += 0.85;
          d.y -= d.vy;
          d.alpha -= 0.02;

          if (d.alpha <= 0 || d.y < -350) {
            debris.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, d.alpha);
          drawIsoBlock(d, originX, originY);
          ctx.restore();
        }
      }

      // Jumby Platform Particle & Juice Overlay
      if (window.Jumby && window.Jumby.fx) {
        window.Jumby.fx.updateAndRender(ctx, width, height);
      }
    }

    loop();
  </script>
</body>
</html>`;
}

// 4. 3-LANE CYBER RUNNER ARCHETYPE
function generateRunnerHtml(config: GameTemplateConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.title}</title>
  <script src="/jumby-sdk.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${config.bgGradient[0]}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 24px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 52px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${config.themeColor}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${config.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${config.accentColor}; pointer-events: none; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP LEFT / RIGHT TO DODGE</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const hintEl = document.getElementById('hint');

    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let state = 'waiting';
    let score = 0;
    let frames = 0;

    let lane = 1; // 0: Left, 1: Center, 2: Right
    const lanes = 3;

    function getLaneX(l) {
      const laneWidth = width / 3;
      return laneWidth * l + laneWidth / 2;
    }

    let obstacles = [];
    const speed = 4.2 * ${config.speedMultiplier};

    function spawnObstacle() {
      const l = Math.floor(Math.random() * 3);
      obstacles.push({
        lane: l,
        y: -40,
        radius: 18,
        color: '${config.accentColor}'
      });
    }

    function moveLeft() {
      if (state === 'waiting') {
        state = 'playing';
        hintEl.style.display = 'none';
      }
      if (lane > 0) {
        lane--;
        if (window.Jumby) window.Jumby.sound.jump();
      }
    }

    function moveRight() {
      if (state === 'waiting') {
        state = 'playing';
        hintEl.style.display = 'none';
      }
      if (lane < 2) {
        lane++;
        if (window.Jumby) window.Jumby.sound.jump();
      }
    }

    window.addEventListener('pointerdown', (e) => {
      if (state === 'dead') {
        resetGame();
        return;
      }
      if (e.clientX < width / 2) moveLeft();
      else moveRight();
    });

    window.addEventListener('keydown', (e) => {
      if (state === 'dead') {
        resetGame();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft();
      if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight();
    });

    function resetGame() {
      state = 'waiting';
      score = 0;
      frames = 0;
      lane = 1;
      obstacles = [];
      scoreEl.textContent = '0';
      hintEl.style.display = 'block';
      hintEl.textContent = 'TAP LEFT / RIGHT TO DODGE';
      if (window.Jumby) window.Jumby.setScore(0);
    }

    function die() {
      state = 'dead';
      hintEl.style.display = 'block';
      hintEl.textContent = 'TAP TO RESTART';
      if (window.Jumby) {
        window.Jumby.sound.hit();
        window.Jumby.gameOver(score);
      }
    }

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      ctx.fillStyle = '${config.bgGradient[0]}';
      ctx.fillRect(0, 0, width, height);

      // Lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 3, 0);
      ctx.lineTo(width / 3, height);
      ctx.moveTo(width * 2 / 3, 0);
      ctx.lineTo(width * 2 / 3, height);
      ctx.stroke();

      if (state === 'playing') {
        if (frames % 40 === 0) spawnObstacle();

        const py = height - 120;
        const px = getLaneX(lane);

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.y += speed;

          const ox = getLaneX(o.lane);
          const dist = Math.hypot(px - ox, py - o.y);

          if (dist < 32) {
            die();
          }

          if (o.y > height + 40) {
            obstacles.splice(i, 1);
            score++;
            scoreEl.textContent = score;
            if (window.Jumby) window.Jumby.setScore(score);
          }
        }
      }

      for (const o of obstacles) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = o.color;
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.arc(getLaneX(o.lane), o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player Car / Runner
      const px = getLaneX(lane);
      const py = height - 120;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '${config.themeColor}';
      ctx.fillStyle = '${config.themeColor}';
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    loop();
  </script>
</body>
</html>`;
}
