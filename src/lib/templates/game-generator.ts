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

// 3. STACK SLICE ARCHETYPE
function generateStackHtml(config: GameTemplateConfig): string {
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
    #hint { position: absolute; bottom: 20%; left: 0; right: 0; text-align: center; color: ${config.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${config.accentColor}; pointer-events: none; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP TO PLACE BLOCK</div>
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
    let cameraY = 0;
    const blockHeight = 24;

    const colors = ['${config.themeColor}', '${config.accentColor}', '#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fb923c'];
    let stack = [];
    let currentBlock = null;
    let debris = [];
    let targetCameraY = 0;

    function initGame() {
      score = 0;
      cameraY = 0;
      targetCameraY = 0;
      debris = [];
      scoreEl.textContent = '0';
      hintEl.style.display = 'none';

      const baseWidth = Math.min(width * 0.6, 220);
      stack = [{ x: (width - baseWidth) / 2, y: height - 140, w: baseWidth, color: colors[0] }];
      spawnNext();
      if (window.Jumby) window.Jumby.setScore(0);
    }

    function spawnNext() {
      const prev = stack[stack.length - 1];
      const color = colors[stack.length % colors.length];
      const dir = stack.length % 2 === 0 ? 1 : -1;
      currentBlock = {
        x: dir > 0 ? 0 : width - prev.w,
        y: prev.y - blockHeight,
        w: prev.w,
        vx: (3.8 + Math.min(score * 0.12, 3.5)) * ${config.speedMultiplier} * dir,
        color: color
      };
    }

    function handleAction() {
      if (state === 'waiting') {
        state = 'playing';
        hintEl.style.display = 'none';
        if (window.Jumby) window.Jumby.sound.jump();
      } else if (state === 'playing') {
        drop();
      } else if (state === 'dead') {
        initGame();
        state = 'playing';
        hintEl.style.display = 'none';
        if (window.Jumby) window.Jumby.sound.jump();
      }
    }

    function drop() {
      if (!currentBlock || state !== 'playing') return;
      const prev = stack[stack.length - 1];
      const diff = currentBlock.x - prev.x;
      const absDiff = Math.abs(diff);

      if (absDiff < 6) {
        // Perfect placement snap
        currentBlock.x = prev.x;
        stack.push({ ...currentBlock });
        score += 2;
        scoreEl.textContent = score;
        if (window.Jumby) {
          window.Jumby.setScore(score);
          window.Jumby.sound.coin();
        }
      } else if (absDiff >= currentBlock.w) {
        // Complete miss!
        debris.push({
          x: currentBlock.x,
          y: currentBlock.y,
          w: currentBlock.w,
          color: currentBlock.color,
          vx: currentBlock.vx > 0 ? 3 : -3,
          vy: 1,
          rot: 0,
          vRot: currentBlock.vx > 0 ? 0.08 : -0.08,
          alpha: 1.0
        });
        currentBlock = null;
        die();
        return;
      } else {
        // Slice overhang
        const newW = currentBlock.w - absDiff;
        const newX = diff > 0 ? currentBlock.x : prev.x;
        const debX = diff > 0 ? prev.x + newW : currentBlock.x;

        debris.push({
          x: debX,
          y: currentBlock.y,
          w: absDiff,
          color: currentBlock.color,
          vx: diff > 0 ? 3 : -3,
          vy: -2,
          rot: 0,
          vRot: diff > 0 ? 0.08 : -0.08,
          alpha: 1.0
        });

        stack.push({ x: newX, y: currentBlock.y, w: newW, color: currentBlock.color });
        score++;
        scoreEl.textContent = score;
        if (window.Jumby) {
          window.Jumby.setScore(score);
          window.Jumby.sound.score();
        }
      }

      targetCameraY += blockHeight;
      spawnNext();
    }

    function die() {
      state = 'dead';
      hintEl.style.display = 'block';
      hintEl.textContent = 'MISSED! TAP TO RETRY';
      if (window.Jumby) {
        window.Jumby.sound.hit();
        window.Jumby.gameOver(score);
      }
    }

    window.addEventListener('pointerdown', handleAction);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    });

    initGame();
    state = 'playing';

    function loop() {
      requestAnimationFrame(loop);

      ctx.fillStyle = '${config.bgGradient[0]}';
      ctx.fillRect(0, 0, width, height);

      cameraY += (targetCameraY - cameraY) * 0.12;

      ctx.save();
      ctx.translate(0, cameraY);

      // Render Debris
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.55;
        d.rot += d.vRot;
        d.alpha -= 0.025;
        if (d.alpha <= 0 || d.y > height + 200) {
          debris.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, d.alpha);
        ctx.translate(d.x + d.w / 2, d.y + blockHeight / 2);
        ctx.rotate(d.rot);
        ctx.fillStyle = d.color;
        ctx.fillRect(-d.w / 2, -blockHeight / 2, d.w, blockHeight - 2);
        ctx.restore();
      }

      if (state === 'playing' && currentBlock) {
        currentBlock.x += currentBlock.vx;
        if (currentBlock.x + currentBlock.w > width + 20 || currentBlock.x < -20) {
          currentBlock.vx *= -1;
        }
      }

      for (const b of stack) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, blockHeight - 2);

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(b.x, b.y, b.w, 4);
      }

      if (currentBlock && state === 'playing') {
        ctx.shadowBlur = 18;
        ctx.shadowColor = currentBlock.color;
        ctx.fillStyle = currentBlock.color;
        ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.w, blockHeight - 2);

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.w, 4);
      }

      ctx.restore();
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
