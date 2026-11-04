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
    html, body { width: 100%; height: 100%; overflow: hidden; background: #12101F; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 28px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 64px; font-weight: 900; color: #ffffff; text-shadow: 0 4px 25px rgba(0,0,0,0.5); }
    #hint { position: absolute; bottom: 22%; left: 0; right: 0; text-align: center; color: #D8FF43; font-size: 15px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 12px rgba(0,0,0,0.6); pointer-events: none; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.97); } }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP TO SLICE & STACK</div>
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

    // Isometric 3D Projection Constants (30 degree tilt)
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

    function getPastelColor(index) {
      const hue = (210 + index * 14) % 360;
      return "hsl(" + hue + ", 78%, 68%)";
    }

    // Convert hsl to hex for shading helper
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

    let state = 'playing'; // 'playing' | 'dead'
    let score = 0;
    let stack = [];
    let activeBlock = null;
    let fallingDebris = [];
    let cameraY = 0;
    let targetCameraY = 0;

    function resetGame() {
      state = 'playing';
      score = 0;
      cameraY = 0;
      targetCameraY = 0;
      fallingDebris = [];
      scoreEl.textContent = '0';
      hintEl.style.display = 'none';

      const baseHex = hslToHex(210, 78, 68);
      stack = [
        {
          x: -INITIAL_SIZE / 2,
          y: 0,
          z: -INITIAL_SIZE / 2,
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
      const axis = stack.length % 2 === 1 ? 'x' : 'z'; // Alternate X and Z
      const nextHex = hslToHex((210 + stack.length * 14) % 360, 78, 68);
      const limit = INITIAL_SIZE * 1.8;
      const speed = (3.8 + Math.min(score * 0.08, 3.2)) * ${config.speedMultiplier};

      activeBlock = {
        axis: axis,
        x: axis === 'x' ? -limit : top.x,
        y: top.y + BLOCK_HEIGHT,
        z: axis === 'z' ? -limit : top.z,
        w: top.w,
        d: top.d,
        h: BLOCK_HEIGHT,
        speed: speed,
        dir: 1,
        limit: limit,
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
        if (absDiff >= activeBlock.w) {
          fallingDebris.push({
            ...activeBlock,
            vy: 0,
            rotX: 0,
            rotZ: activeBlock.dir * 0.06,
            alpha: 1.0
          });
          activeBlock = null;
          die();
          return;
        }

        // 2. Perfect Placement (< 5px)
        if (absDiff < 5) {
          activeBlock.x = top.x;
          stack.push({
            x: top.x,
            y: activeBlock.y,
            z: top.z,
            w: top.w,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });
          if (window.Jumby) {
            if (window.Jumby.sound) window.Jumby.sound.coin();
            if (window.Jumby.fx) {
              const scr = toScreen(top.x + top.w / 2, activeBlock.y + BLOCK_HEIGHT, top.z + top.d / 2, width / 2, height * 0.68 + cameraY);
              window.Jumby.fx.particles(scr.x, scr.y, 22, '#D8FF43');
              window.Jumby.fx.addFloatingText('PERFECT! +50', scr.x, scr.y - 15, '#D8FF43', 24);
            }
          }
        } else {
          // Slice overhang
          const newW = activeBlock.w - absDiff;
          const newX = diff > 0 ? activeBlock.x : top.x;
          const debrisW = absDiff;
          const debrisX = diff > 0 ? top.x + newW : activeBlock.x;

          stack.push({
            x: newX,
            y: activeBlock.y,
            z: top.z,
            w: newW,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });

          fallingDebris.push({
            x: debrisX,
            y: activeBlock.y,
            z: top.z,
            w: debrisW,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color,
            vy: 0,
            rotX: 0,
            rotZ: diff > 0 ? 0.07 : -0.07,
            alpha: 1.0
          });

          if (window.Jumby) {
            if (window.Jumby.sound) window.Jumby.sound.score();
          }
        }
      } else {
        // Z Axis Slicing
        const diff = activeBlock.z - top.z;
        const absDiff = Math.abs(diff);

        // 1. Total Miss
        if (absDiff >= activeBlock.d) {
          fallingDebris.push({
            ...activeBlock,
            vy: 0,
            rotX: activeBlock.dir * 0.06,
            rotZ: 0,
            alpha: 1.0
          });
          activeBlock = null;
          die();
          return;
        }

        // 2. Perfect Placement (< 5px)
        if (absDiff < 5) {
          activeBlock.z = top.z;
          stack.push({
            x: top.x,
            y: activeBlock.y,
            z: top.z,
            w: top.w,
            d: top.d,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });
          if (window.Jumby) {
            if (window.Jumby.sound) window.Jumby.sound.coin();
            if (window.Jumby.fx) {
              const scr = toScreen(top.x + top.w / 2, activeBlock.y + BLOCK_HEIGHT, top.z + top.d / 2, width / 2, height * 0.68 + cameraY);
              window.Jumby.fx.particles(scr.x, scr.y, 22, '#D8FF43');
              window.Jumby.fx.addFloatingText('PERFECT! +50', scr.x, scr.y - 15, '#D8FF43', 24);
            }
          }
        } else {
          // Slice overhang along Z
          const newD = activeBlock.d - absDiff;
          const newZ = diff > 0 ? activeBlock.z : top.z;
          const debrisD = absDiff;
          const debrisZ = diff > 0 ? top.z + newD : activeBlock.z;

          stack.push({
            x: top.x,
            y: activeBlock.y,
            z: newZ,
            w: top.w,
            d: newD,
            h: BLOCK_HEIGHT,
            color: activeBlock.color
          });

          fallingDebris.push({
            x: top.x,
            y: activeBlock.y,
            z: debrisZ,
            w: top.w,
            d: debrisD,
            h: BLOCK_HEIGHT,
            color: activeBlock.color,
            vy: 0,
            rotX: diff > 0 ? 0.07 : -0.07,
            rotZ: 0,
            alpha: 1.0
          });

          if (window.Jumby) {
            if (window.Jumby.sound) window.Jumby.sound.score();
          }
        }
      }

      score++;
      scoreEl.textContent = score;
      if (window.Jumby) window.Jumby.setScore(score);

      targetCameraY += BLOCK_HEIGHT;
      spawnNextBlock();
    }

    function die() {
      state = 'dead';
      hintEl.style.display = 'block';
      hintEl.textContent = 'MISSED! TAP TO RETRY';
      if (window.Jumby) {
        if (window.Jumby.sound) window.Jumby.sound.hit();
        if (window.Jumby.fx) window.Jumby.fx.shake(16);
        window.Jumby.gameOver(score);
      }
    }

    function handleAction() {
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
        handleAction();
      }
    });

    function drawIsoBlock(b, originX, originY) {
      const x = b.x;
      const y = b.y;
      const z = b.z;
      const w = b.w;
      const d = b.d;
      const h = b.h;

      // 8 Isometric Vertices
      const p1 = toScreen(x, y + h, z, originX, originY);
      const p2 = toScreen(x + w, y + h, z, originX, originY);
      const p3 = toScreen(x + w, y + h, z + d, originX, originY);
      const p4 = toScreen(x, y + h, z + d, originX, originY);

      const p5 = toScreen(x, y, z + d, originX, originY);
      const p6 = toScreen(x + w, y, z + d, originX, originY);
      const p7 = toScreen(x + w, y, z, originX, originY);

      // 1. Front-Left Face (medium shade)
      ctx.fillStyle = shade(b.color, -16);
      ctx.beginPath();
      ctx.moveTo(p4.x, p4.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p6.x, p6.y);
      ctx.lineTo(p5.x, p5.y);
      ctx.closePath();
      ctx.fill();

      // 2. Front-Right Face (darker shadow)
      ctx.fillStyle = shade(b.color, -32);
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p6.x, p6.y);
      ctx.lineTo(p7.x, p7.y);
      ctx.closePath();
      ctx.fill();

      // 3. Top Face (bright pastel)
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();

      // Subtle top rim highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    resetGame();

    function loop() {
      requestAnimationFrame(loop);

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1E1A34');
      grad.addColorStop(1, '#0F0D1B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Smooth Camera Lerp
      cameraY += (targetCameraY - cameraY) * 0.1;
      const originX = width / 2;
      const originY = height * 0.68 + cameraY;

      // Update Moving Active Block
      if (state === 'playing' && activeBlock) {
        if (activeBlock.axis === 'x') {
          activeBlock.x += activeBlock.speed * activeBlock.dir;
          if (activeBlock.x > activeBlock.limit) {
            activeBlock.x = activeBlock.limit;
            activeBlock.dir = -1;
          } else if (activeBlock.x < -activeBlock.limit) {
            activeBlock.x = -activeBlock.limit;
            activeBlock.dir = 1;
          }
        } else {
          activeBlock.z += activeBlock.speed * activeBlock.dir;
          if (activeBlock.z > activeBlock.limit) {
            activeBlock.z = activeBlock.limit;
            activeBlock.dir = -1;
          } else if (activeBlock.z < -activeBlock.limit) {
            activeBlock.z = -activeBlock.limit;
            activeBlock.dir = 1;
          }
        }
      }

      // 1. Draw Static Stacked Blocks (rendered from base up)
      for (let i = 0; i < stack.length; i++) {
        drawIsoBlock(stack[i], originX, originY);
      }

      // 2. Draw Moving Active Block
      if (state === 'playing' && activeBlock) {
        drawIsoBlock(activeBlock, originX, originY);
      }

      // 3. Render Falling Debris with Gravity Physics
      for (let i = fallingDebris.length - 1; i >= 0; i--) {
        const d = fallingDebris[i];
        d.y -= d.vy;
        d.vy += 0.8; // gravity
        d.alpha -= 0.02;

        if (d.alpha <= 0 || d.y < -300) {
          fallingDebris.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, d.alpha);
        drawIsoBlock(d, originX, originY);
        ctx.restore();
      }

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
