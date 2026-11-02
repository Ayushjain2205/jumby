/**
 * Jumby Smart Procedural Game Generator
 * Dynamically synthesizes custom HTML5 Canvas micro-games with full jumby-runtime.js integration
 * based on user prompt keywords, mechanics, visual themes, and archetypes.
 */

export interface GeneratorParams {
  prompt: string;
  archetype?: 'flappy' | 'orbit' | 'stack' | 'runner' | 'custom';
  baseCode?: string;
}

export function synthesizeProceduralGame(params: GeneratorParams): string {
  const { prompt, archetype = 'flappy' } = params;
  const p = prompt.toLowerCase();

  // 1. Analyze Title & Concept
  let title = 'Neon Pulse';
  if (p.includes('ninja') || p.includes('blade') || p.includes('slash')) title = 'Cyber Blade';
  else if (p.includes('space') || p.includes('galaxy') || p.includes('star')) title = 'Cosmic Drift';
  else if (p.includes('car') || p.includes('race') || p.includes('drift')) title = 'Turbo Racer';
  else if (p.includes('stack') || p.includes('tower')) title = 'Chroma Stack';
  else if (p.includes('laser') || p.includes('dodge')) title = 'Laser Matrix';
  else if (p.includes('chill') || p.includes('relax') || p.includes('cloud')) title = 'Zen Orbit';
  else if (p.includes('cyber') || p.includes('neon')) title = 'Neon Surge';

  // 2. Determine Archetype
  let chosenArchetype = archetype;
  if (chosenArchetype === 'custom') {
    if (p.includes('orbit') || p.includes('circle') || p.includes('planet')) chosenArchetype = 'orbit';
    else if (p.includes('stack') || p.includes('block') || p.includes('tower')) chosenArchetype = 'stack';
    else if (p.includes('run') || p.includes('lane') || p.includes('dodge') || p.includes('car')) chosenArchetype = 'runner';
    else chosenArchetype = 'flappy';
  }

  // 3. Theme Colors
  let themeColor = '#7160FF'; // Jumby Purple
  let accentColor = '#D8FF43'; // Jumby Lime
  let bgTop = '#0F0F0F';
  let bgBottom = '#1A153A';

  if (p.includes('coral') || p.includes('pink') || p.includes('sunset') || p.includes('red') || p.includes('fire')) {
    themeColor = '#FF7657'; // Jumby Coral
    accentColor = '#D8FF43';
    bgBottom = '#2B1218';
  } else if (p.includes('lime') || p.includes('green') || p.includes('matrix')) {
    themeColor = '#D8FF43'; // Jumby Lime
    accentColor = '#7160FF';
    bgBottom = '#13210C';
  } else if (p.includes('sky') || p.includes('blue') || p.includes('ice') || p.includes('water')) {
    themeColor = '#4DB8FF'; // Jumby Sky
    accentColor = '#FF7657';
    bgBottom = '#0B1C28';
  }

  // 4. Speed & Dynamics
  let speedMultiplier = 1.0;
  if (p.includes('faster') || p.includes('insane') || p.includes('hard') || p.includes('2x')) speedMultiplier = 1.6;
  if (p.includes('slower') || p.includes('easy') || p.includes('chill')) speedMultiplier = 0.7;

  // Synthesize according to chosen archetype
  switch (chosenArchetype) {
    case 'orbit':
      return generateOrbitGame({ title, themeColor, accentColor, bgTop, bgBottom, speedMultiplier });
    case 'stack':
      return generateStackGame({ title, themeColor, accentColor, bgTop, bgBottom, speedMultiplier });
    case 'runner':
      return generateRunnerGame({ title, themeColor, accentColor, bgTop, bgBottom, speedMultiplier });
    case 'flappy':
    default:
      return generateFlappyGame({ title, themeColor, accentColor, bgTop, bgBottom, speedMultiplier });
  }
}

// --------------------------------------------------------------------------
// 1. FLAPPY / TAP JUMPER
// --------------------------------------------------------------------------
function generateFlappyGame(opts: { title: string; themeColor: string; accentColor: string; bgTop: string; bgBottom: string; speedMultiplier: number }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP OR SPACE TO FLAP</div>
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

    Jumby.input.init(canvas);

    let state = 'waiting'; // 'waiting' | 'playing' | 'gameover'
    let score = 0;
    let frames = 0;

    const player = {
      x: 90,
      y: height * 0.5,
      radius: 18,
      vy: 0,
      gravity: 0.38,
      jumpForce: -7.6,
      trail: [],
      reset() {
        this.y = height * 0.5;
        this.vy = 0;
        this.trail = [];
      }
    };

    let items = [];
    const itemSpeed = 3.4 * ${opts.speedMultiplier};

    function spawnItem() {
      items.push({
        x: width + 25,
        y: Math.random() * (height - 200) + 100,
        radius: 15,
        type: Math.random() > 0.35 ? 'hazard' : 'coin'
      });
    }

    function startGame() {
      state = 'playing';
      score = 0;
      frames = 0;
      items = [];
      player.reset();
      scoreEl.innerText = '0';
      hintEl.style.display = 'none';
      Jumby.setScore(0);
      Jumby.sound.jump();
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.fx.shake(16);
      Jumby.fx.particles(player.x, player.y, 25, '${opts.themeColor}');
      hintEl.style.display = 'block';
      hintEl.innerText = 'GAME OVER - TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    Jumby.on('REVIVE_GRANTED', () => {
      state = 'playing';
      player.y = height * 0.5;
      player.vy = 0;
      items = items.filter(it => it.x > player.x + 120);
      hintEl.style.display = 'none';
      Jumby.sound.powerup();
      Jumby.fx.particles(player.x, player.y, 30, '${opts.accentColor}');
    });

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      ctx.save();

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '${opts.bgTop}');
      grad.addColorStop(1, '${opts.bgBottom}');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Handle Input
      if (Jumby.input.justPressed) {
        if (state === 'waiting' || state === 'gameover') {
          startGame();
        } else if (state === 'playing') {
          player.vy = player.jumpForce;
          Jumby.sound.jump();
          Jumby.fx.particles(player.x, player.y + player.radius, 6, '${opts.accentColor}');
        }
      }

      if (state === 'playing') {
        player.vy += player.gravity;
        player.y += player.vy;

        // Trail
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 10) player.trail.shift();

        // Bounds
        if (player.y - player.radius < 0) {
          player.y = player.radius;
          player.vy = 0;
        }
        if (player.y + player.radius > height) {
          die();
        }

        // Spawn obstacles
        if (frames % Math.floor(75 / ${opts.speedMultiplier}) === 0) {
          spawnItem();
        }

        // Update items
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.x -= itemSpeed;

          // Collision detection
          const dx = item.x - player.x;
          const dy = item.y - player.y;
          const dist = Math.hypot(dx, dy);

          if (dist < item.radius + player.radius) {
            if (item.type === 'hazard') {
              die();
              break;
            } else {
              score += 1;
              scoreEl.innerText = score;
              Jumby.setScore(score);
              Jumby.sound.score();
              Jumby.fx.particles(item.x, item.y, 16, '${opts.accentColor}');
              items.splice(i, 1);
              continue;
            }
          }

          if (item.x < -30) {
            items.splice(i, 1);
          }
        }
      }

      // Render player trail
      ctx.lineWidth = 4;
      ctx.strokeStyle = '${opts.accentColor}';
      ctx.beginPath();
      for (let i = 0; i < player.trail.length; i++) {
        const pt = player.trail[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Render Items
      items.forEach((item) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        if (item.type === 'hazard') {
          ctx.fillStyle = '${opts.themeColor}';
          ctx.shadowColor = '${opts.themeColor}';
          ctx.shadowBlur = 15;
        } else {
          ctx.fillStyle = '${opts.accentColor}';
          ctx.shadowColor = '${opts.accentColor}';
          ctx.shadowBlur = 18;
        }
        ctx.fill();
        ctx.restore();
      });

      // Render Player
      ctx.save();
      ctx.shadowColor = '${opts.accentColor}';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '${opts.accentColor}';
      ctx.stroke();
      ctx.restore();

      // Render Screen Shake & Juice
      Jumby.fx.updateAndRender(ctx, width, height);
      ctx.restore();

      Jumby.input.endFrame();
    }

    loop();
  </script>
</body>
</html>`;
}

// --------------------------------------------------------------------------
// 2. ORBITAL PULSE
// --------------------------------------------------------------------------
function generateOrbitGame(opts: { title: string; themeColor: string; accentColor: string; bgTop: string; bgBottom: string; speedMultiplier: number }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; }
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

    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    Jumby.input.init(canvas);

    let state = 'waiting';
    let score = 0;
    let frames = 0;
    let angle = 0;
    let dir = 1;
    let orbitRadius = 110;

    let lasers = [];

    function startGame() {
      state = 'playing';
      score = 0;
      frames = 0;
      lasers = [];
      angle = 0;
      dir = 1;
      scoreEl.innerText = '0';
      hintEl.style.display = 'none';
      Jumby.setScore(0);
      Jumby.sound.jump();
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.fx.shake(18);
      const px = width / 2 + Math.cos(angle) * orbitRadius;
      const py = height / 2 + Math.sin(angle) * orbitRadius;
      Jumby.fx.particles(px, py, 30, '${opts.themeColor}');
      hintEl.style.display = 'block';
      hintEl.innerText = 'CRASHED! TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    Jumby.on('REVIVE_GRANTED', () => {
      state = 'playing';
      lasers = [];
      hintEl.style.display = 'none';
      Jumby.sound.powerup();
    });

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      ctx.save();
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width);
      grad.addColorStop(0, '${opts.bgBottom}');
      grad.addColorStop(1, '${opts.bgTop}');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Handle Input
      if (Jumby.input.justPressed) {
        if (state === 'waiting' || state === 'gameover') {
          startGame();
        } else if (state === 'playing') {
          dir *= -1;
          Jumby.sound.laser();
          const px = cx + Math.cos(angle) * orbitRadius;
          const py = cy + Math.sin(angle) * orbitRadius;
          Jumby.fx.particles(px, py, 8, '${opts.accentColor}');
        }
      }

      if (state === 'playing') {
        angle += 0.042 * dir * ${opts.speedMultiplier};

        if (frames % Math.floor(80 / ${opts.speedMultiplier}) === 0) {
          const spawnAngle = Math.random() * Math.PI * 2;
          lasers.push({
            angle: spawnAngle,
            dist: width * 0.7,
            speed: 3.5 * ${opts.speedMultiplier},
            radius: 12
          });
        }

        // Update lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          l.dist -= l.speed;

          const lx = cx + Math.cos(l.angle) * l.dist;
          const ly = cy + Math.sin(l.angle) * l.dist;

          const px = cx + Math.cos(angle) * orbitRadius;
          const py = cy + Math.sin(angle) * orbitRadius;

          const dist = Math.hypot(lx - px, ly - py);
          if (dist < l.radius + 14) {
            die();
            break;
          }

          if (l.dist <= 15) {
            score++;
            scoreEl.innerText = score;
            Jumby.setScore(score);
            Jumby.sound.score();
            Jumby.fx.particles(cx, cy, 12, '${opts.accentColor}');
            lasers.splice(i, 1);
          }
        }
      }

      // Draw Orbit Track
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Center Core
      ctx.fillStyle = '${opts.themeColor}';
      ctx.shadowColor = '${opts.themeColor}';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      // Draw Lasers
      lasers.forEach(l => {
        const lx = cx + Math.cos(l.angle) * l.dist;
        const ly = cy + Math.sin(l.angle) * l.dist;
        ctx.fillStyle = '${opts.themeColor}';
        ctx.shadowColor = '${opts.themeColor}';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(lx, ly, l.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Orb
      const px = cx + Math.cos(angle) * orbitRadius;
      const py = cy + Math.sin(angle) * orbitRadius;
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '${opts.accentColor}';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '${opts.accentColor}';
      ctx.stroke();
      ctx.restore();

      Jumby.fx.updateAndRender(ctx, width, height);
      ctx.restore();

      Jumby.input.endFrame();
    }

    loop();
  </script>
</body>
</html>`;
}

// --------------------------------------------------------------------------
// 3. STACK SLICE TOWER
// --------------------------------------------------------------------------
function generateStackGame(opts: { title: string; themeColor: string; accentColor: string; bgTop: string; bgBottom: string; speedMultiplier: number }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; }
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

    Jumby.input.init(canvas);

    let state = 'waiting';
    let score = 0;
    const blockHeight = 36;
    let stack = [];
    let activeBlock = { x: 0, y: 0, w: 180, speed: 4.5 * ${opts.speedMultiplier}, dir: 1 };

    function startGame() {
      state = 'playing';
      score = 0;
      stack = [
        { x: (width - 200) / 2, y: height - 120, w: 200, color: '${opts.themeColor}' }
      ];
      activeBlock = {
        x: 0,
        y: height - 120 - blockHeight,
        w: 200,
        speed: 4.5 * ${opts.speedMultiplier},
        dir: 1
      };
      scoreEl.innerText = '0';
      hintEl.style.display = 'none';
      Jumby.setScore(0);
      Jumby.sound.jump();
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.fx.shake(16);
      hintEl.style.display = 'block';
      hintEl.innerText = 'MISSED! TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    function loop() {
      requestAnimationFrame(loop);

      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '${opts.bgTop}');
      grad.addColorStop(1, '${opts.bgBottom}');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Handle Input
      if (Jumby.input.justPressed) {
        if (state === 'waiting' || state === 'gameover') {
          startGame();
        } else if (state === 'playing') {
          const top = stack[stack.length - 1];
          const diff = activeBlock.x - top.x;

          if (Math.abs(diff) > activeBlock.w) {
            die();
          } else {
            // Cut block
            let newW = activeBlock.w - Math.abs(diff);
            let newX = diff > 0 ? activeBlock.x : top.x;

            if (Math.abs(diff) < 4) {
              // Perfect placement
              newW = activeBlock.w;
              newX = top.x;
              Jumby.sound.coin();
              Jumby.fx.particles(newX + newW / 2, activeBlock.y, 20, '${opts.accentColor}');
            } else {
              Jumby.sound.score();
              Jumby.fx.particles(diff > 0 ? newX + newW : newX, activeBlock.y, 10, '${opts.themeColor}');
            }

            stack.push({
              x: newX,
              y: activeBlock.y,
              w: newW,
              color: stack.length % 2 === 0 ? '${opts.themeColor}' : '${opts.accentColor}'
            });

            score++;
            scoreEl.innerText = score;
            Jumby.setScore(score);

            activeBlock.w = newW;
            activeBlock.x = 0;
            activeBlock.dir = 1;
            activeBlock.speed = Math.min(9, activeBlock.speed + 0.15);

            // Scroll stack down if tall
            if (activeBlock.y < height * 0.45) {
              stack.forEach(b => b.y += blockHeight);
            } else {
              activeBlock.y -= blockHeight;
            }
          }
        }
      }

      if (state === 'playing') {
        activeBlock.x += activeBlock.speed * activeBlock.dir;
        if (activeBlock.x + activeBlock.w > width) {
          activeBlock.x = width - activeBlock.w;
          activeBlock.dir = -1;
        } else if (activeBlock.x < 0) {
          activeBlock.x = 0;
          activeBlock.dir = 1;
        }
      }

      // Draw Stack
      stack.forEach(b => {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(b.x, b.y, b.w, blockHeight - 2);
        ctx.restore();
      });

      // Draw Active Block
      if (state === 'playing') {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '${opts.accentColor}';
        ctx.shadowBlur = 18;
        ctx.fillRect(activeBlock.x, activeBlock.y, activeBlock.w, blockHeight - 2);
        ctx.restore();
      }

      Jumby.fx.updateAndRender(ctx, width, height);
      ctx.restore();

      Jumby.input.endFrame();
    }

    loop();
  </script>
</body>
</html>`;
}

// --------------------------------------------------------------------------
// 4. CYBER RUNNER
// --------------------------------------------------------------------------
function generateRunnerGame(opts: { title: string; themeColor: string; accentColor: string; bgTop: string; bgBottom: string; speedMultiplier: number }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP LEFT/RIGHT TO SWITCH LANES</div>
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

    Jumby.input.init(canvas);

    let state = 'waiting';
    let score = 0;
    let frames = 0;
    let lane = 1; // 0: Left, 1: Center, 2: Right
    let obstacles = [];

    function getLaneX(l) {
      const laneWidth = width / 3;
      return laneWidth * l + laneWidth / 2;
    }

    function startGame() {
      state = 'playing';
      score = 0;
      frames = 0;
      lane = 1;
      obstacles = [];
      scoreEl.innerText = '0';
      hintEl.style.display = 'none';
      Jumby.setScore(0);
      Jumby.sound.jump();
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.fx.shake(18);
      Jumby.fx.particles(getLaneX(lane), height - 120, 30, '${opts.themeColor}');
      hintEl.style.display = 'block';
      hintEl.innerText = 'WRECKED! TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '${opts.bgTop}');
      grad.addColorStop(1, '${opts.bgBottom}');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw Lanes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(width / 3, 0);
      ctx.lineTo(width / 3, height);
      ctx.moveTo((width / 3) * 2, 0);
      ctx.lineTo((width / 3) * 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Input
      if (Jumby.input.justPressed) {
        if (state === 'waiting' || state === 'gameover') {
          startGame();
        } else if (state === 'playing') {
          if (Jumby.input.touchPos.x < width / 2) {
            lane = Math.max(0, lane - 1);
          } else {
            lane = Math.min(2, lane + 1);
          }
          Jumby.sound.laser();
        }
      }

      if (state === 'playing') {
        if (frames % Math.floor(55 / ${opts.speedMultiplier}) === 0) {
          obstacles.push({
            lane: Math.floor(Math.random() * 3),
            y: -50,
            speed: 5.5 * ${opts.speedMultiplier},
            radius: 20
          });
        }

        // Update obstacles
        const playerY = height - 120;
        const playerX = getLaneX(lane);

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const ob = obstacles[i];
          ob.y += ob.speed;

          const obX = getLaneX(ob.lane);
          if (ob.lane === lane && Math.abs(ob.y - playerY) < 36) {
            die();
            break;
          }

          if (ob.y > height + 50) {
            score++;
            scoreEl.innerText = score;
            Jumby.setScore(score);
            Jumby.sound.score();
            obstacles.splice(i, 1);
          }
        }
      }

      // Draw Obstacles
      obstacles.forEach(ob => {
        const ox = getLaneX(ob.lane);
        ctx.save();
        ctx.fillStyle = '${opts.themeColor}';
        ctx.shadowColor = '${opts.themeColor}';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(ox, ob.y, ob.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player
      const px = getLaneX(lane);
      const py = height - 120;
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '${opts.accentColor}';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '${opts.accentColor}';
      ctx.stroke();
      ctx.restore();

      Jumby.fx.updateAndRender(ctx, width, height);
      ctx.restore();

      Jumby.input.endFrame();
    }

    loop();
  </script>
</body>
</html>`;
}
