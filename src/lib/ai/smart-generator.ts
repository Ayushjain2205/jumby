/**
 * Jumby Smart Procedural Game Generator
 * Dynamically synthesizes custom HTML5 Canvas micro-games with full jumby-runtime.js integration
 * based on user prompt keywords, mechanics, visual themes, and archetypes.
 */

export interface GeneratorParams {
  prompt: string;
  archetype?: 'flappy' | 'orbit' | 'stack' | 'runner' | 'catcher' | 'shooter' | 'custom';
  baseCode?: string;
}

export function synthesizeProceduralGame(params: GeneratorParams): string {
  const { prompt, archetype } = params;
  const p = prompt.toLowerCase();

  // 1. Analyze Title & Concept
  let title = 'Neon Pulse';
  if (p.includes('taco') || p.includes('sombrero')) title = 'Taco Sombrero Drop';
  else if (p.includes('catch') || p.includes('basket') || p.includes('fruit')) title = 'Fruit Collector';
  else if (p.includes('shoot') || p.includes('invader') || p.includes('alien')) title = 'Cosmic Blaster';
  else if (p.includes('ninja') || p.includes('blade') || p.includes('slash')) title = 'Cyber Blade';
  else if (p.includes('space') || p.includes('galaxy') || p.includes('star')) title = 'Cosmic Drift';
  else if (p.includes('car') || p.includes('race') || p.includes('drift')) title = 'Turbo Racer';
  else if (p.includes('stack') || p.includes('tower')) title = 'Chroma Stack';
  else if (p.includes('laser') || p.includes('dodge')) title = 'Laser Matrix';
  else if (p.includes('chill') || p.includes('relax') || p.includes('cloud')) title = 'Zen Orbit';
  else if (p.includes('cyber') || p.includes('neon')) title = 'Neon Surge';

  // 2. Determine Archetype (Prompt keywords always take priority!)
  let chosenArchetype: 'flappy' | 'orbit' | 'stack' | 'runner' | 'catcher' | 'shooter' = 'catcher';

  if (p.includes('catch') || p.includes('basket') || p.includes('taco') || p.includes('collector') || p.includes('falling') || p.includes('sombrero') || p.includes('fruit') || p.includes('apple') || p.includes('drop')) {
    chosenArchetype = 'catcher';
  } else if (p.includes('shoot') || p.includes('blaster') || p.includes('laser') || p.includes('invader') || p.includes('cannon') || p.includes('alien') || p.includes('bullet') || p.includes('zombie') || p.includes('blast')) {
    chosenArchetype = 'shooter';
  } else if (p.includes('stack') || p.includes('block') || p.includes('tower') || p.includes('slice') || p.includes('rhythm')) {
    chosenArchetype = 'stack';
    if (title === 'Neon Pulse') title = 'Stack Slice Tower';
  } else if (p.includes('orbit') || p.includes('circle') || p.includes('planet') || p.includes('pulse')) {
    chosenArchetype = 'orbit';
    if (title === 'Neon Pulse') title = 'Orbital Pulse';
  } else if (p.includes('run') || p.includes('lane') || p.includes('dodge') || p.includes('car') || p.includes('race') || p.includes('dash')) {
    chosenArchetype = 'runner';
    if (title === 'Neon Pulse') title = 'Cyber Runner';
  } else if (p.includes('flap') || p.includes('bird') || p.includes('jump') || p.includes('fly')) {
    chosenArchetype = 'flappy';
    if (title === 'Neon Pulse') title = 'Neon Jumper';
  } else if (archetype && archetype !== 'custom') {
    chosenArchetype = archetype;
  }

  // 3. Theme-Driven Colors (Never default to generic purple & lime!)
  let themeColor = '#F59E0B'; // Saffron Gold
  let accentColor = '#EF4444'; // Red
  let bgTop = '#18181B';
  let bgBottom = '#27272A';

  if (p.includes('taco') || p.includes('food') || p.includes('pizza') || p.includes('burger') || p.includes('sombrero')) {
    themeColor = '#F59E0B'; // Saffron Gold
    accentColor = '#EF4444'; // Salsa Red
    bgTop = '#1C1510';
    bgBottom = '#2E1E14';
  } else if (p.includes('bjp') || p.includes('saffron') || p.includes('india')) {
    themeColor = '#FF9933'; // Saffron
    accentColor = '#138808'; // Green
    bgTop = '#0F0F0F';
    bgBottom = '#1F1B14';
  } else if (p.includes('space') || p.includes('galaxy') || p.includes('star') || p.includes('cosmos') || p.includes('invader')) {
    themeColor = '#00F0FF'; // Electric Cyan
    accentColor = '#FF007F'; // Neon Pink
    bgTop = '#080816';
    bgBottom = '#130F2A';
  } else if (p.includes('ocean') || p.includes('water') || p.includes('sea') || p.includes('aqua') || p.includes('fish')) {
    themeColor = '#06B6D4'; // Aqua
    accentColor = '#F43F5E'; // Coral
    bgTop = '#061626';
    bgBottom = '#0C2E4A';
  } else if (p.includes('forest') || p.includes('jungle') || p.includes('leaf') || p.includes('tree') || p.includes('plant') || p.includes('green')) {
    themeColor = '#10B981'; // Emerald
    accentColor = '#A3E635'; // Lime
    bgTop = '#061B12';
    bgBottom = '#0A2D1E';
  } else if (p.includes('fire') || p.includes('race') || p.includes('car') || p.includes('turbo') || p.includes('action') || p.includes('war') || p.includes('red')) {
    themeColor = '#EF4444'; // Crimson
    accentColor = '#F59E0B'; // Amber Fire
    bgTop = '#180B0B';
    bgBottom = '#2D1111';
  } else if (p.includes('gold') || p.includes('treasure') || p.includes('royale') || p.includes('rich') || p.includes('coin')) {
    themeColor = '#FACC15'; // Gold
    accentColor = '#FB923C'; // Amber
    bgTop = '#141108';
    bgBottom = '#2B200A';
  } else if (p.includes('candy') || p.includes('pink') || p.includes('cute') || p.includes('bubble')) {
    themeColor = '#EC4899'; // Bubblegum Pink
    accentColor = '#FBBF24'; // Sunshine Yellow
    bgTop = '#1F101A';
    bgBottom = '#2E1528';
  } else if (p.includes('cyber') || p.includes('neon') || p.includes('synthwave')) {
    themeColor = '#7160FF'; // Cyber Purple
    accentColor = '#D8FF43'; // Neon Lime
    bgTop = '#0F0F0F';
    bgBottom = '#1A153A';
  }

  // 4. Game Typography / Font Vibe
  let fontUrl = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;900&display=swap';
  let fontFamily = "'Fredoka', cursive, sans-serif";

  if (p.includes('retro') || p.includes('pixel') || p.includes('8bit') || p.includes('arcade') || p.includes('classic')) {
    fontUrl = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontFamily = "'Press Start 2P', monospace";
  } else if (p.includes('space') || p.includes('cyber') || p.includes('neon') || p.includes('laser') || p.includes('sci-fi') || p.includes('matrix')) {
    fontUrl = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap';
    fontFamily = "'Orbitron', sans-serif";
  } else if (p.includes('race') || p.includes('action') || p.includes('battle') || p.includes('hard') || p.includes('fire') || p.includes('speed') || p.includes('turbo')) {
    fontUrl = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
    fontFamily = "'Russo One', sans-serif";
  } else if (p.includes('orbit') || p.includes('zen') || p.includes('minimal') || p.includes('chill') || p.includes('clean')) {
    fontUrl = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap';
    fontFamily = "'Space Grotesk', sans-serif";
  }

  // 5. Dynamic Emoji Visual Characters & Items
  let playerEmoji = '⭐';
  let targetEmoji = '💎';
  let hazardEmoji = '💣';

  if (p.includes('taco') || p.includes('sombrero') || p.includes('mexic')) {
    playerEmoji = '👒';
    targetEmoji = '🌮';
    hazardEmoji = '🌶️';
  } else if (p.includes('fruit') || p.includes('apple') || p.includes('berry') || p.includes('banana')) {
    playerEmoji = '🧺';
    targetEmoji = '🍎';
    hazardEmoji = '🐛';
  } else if (p.includes('burger') || p.includes('pizza') || p.includes('food')) {
    playerEmoji = '😋';
    targetEmoji = '🍕';
    hazardEmoji = '🥦';
  } else if (p.includes('space') || p.includes('galaxy') || p.includes('star') || p.includes('invader')) {
    playerEmoji = '🚀';
    targetEmoji = '⭐';
    hazardEmoji = '👾';
  } else if (p.includes('alien') || p.includes('ufo')) {
    playerEmoji = '🛸';
    targetEmoji = '🪐';
    hazardEmoji = '☄️';
  } else if (p.includes('car') || p.includes('race') || p.includes('turbo') || p.includes('drift')) {
    playerEmoji = '🏎️';
    targetEmoji = '⚡';
    hazardEmoji = '🚧';
  } else if (p.includes('coin') || p.includes('gold') || p.includes('rich') || p.includes('treasure')) {
    playerEmoji = '💰';
    targetEmoji = '🪙';
    hazardEmoji = '💸';
  } else if (p.includes('cat') || p.includes('kitten')) {
    playerEmoji = '🐱';
    targetEmoji = '🐟';
    hazardEmoji = '🧶';
  } else if (p.includes('dog') || p.includes('puppy')) {
    playerEmoji = '🐶';
    targetEmoji = '🦴';
    hazardEmoji = '🪨';
  } else if (p.includes('ocean') || p.includes('fish') || p.includes('sea') || p.includes('water')) {
    playerEmoji = '🐠';
    targetEmoji = '🐚';
    hazardEmoji = '🦈';
  } else if (p.includes('bird') || p.includes('fly') || p.includes('flap')) {
    playerEmoji = '🐤';
    targetEmoji = '🪱';
    hazardEmoji = '🦅';
  } else if (p.includes('ninja') || p.includes('blade') || p.includes('slash')) {
    playerEmoji = '🥷';
    targetEmoji = '🗡️';
    hazardEmoji = '💣';
  } else if (p.includes('bjp') || p.includes('saffron') || p.includes('india')) {
    playerEmoji = '🪷';
    targetEmoji = '☀️';
    hazardEmoji = '⚡';
  }

  // 6. Speed & Dynamics
  let speedMultiplier = 1.0;
  if (p.includes('faster') || p.includes('insane') || p.includes('hard') || p.includes('2x')) speedMultiplier = 1.5;
  if (p.includes('slower') || p.includes('easy') || p.includes('chill')) speedMultiplier = 0.75;

  // 7. BGM Rhythm / Vibe Selection
  let bgmVibe: 'arcade' | 'cyber' | 'chill' | 'action' = 'arcade';
  if (p.includes('space') || p.includes('cyber') || p.includes('neon') || p.includes('laser') || p.includes('sci-fi') || p.includes('synth')) {
    bgmVibe = 'cyber';
  } else if (p.includes('race') || p.includes('action') || p.includes('battle') || p.includes('ninja') || p.includes('war') || p.includes('fire') || p.includes('speed')) {
    bgmVibe = 'action';
  } else if (p.includes('chill') || p.includes('zen') || p.includes('relax') || p.includes('orbit') || p.includes('cloud')) {
    bgmVibe = 'chill';
  }

  const genOpts: GameGenOptions = {
    title,
    themeColor,
    accentColor,
    bgTop,
    bgBottom,
    speedMultiplier,
    fontUrl,
    fontFamily,
    playerEmoji,
    targetEmoji,
    hazardEmoji,
    bgmVibe,
  };

  // Synthesize according to chosen archetype
  switch (chosenArchetype) {
    case 'catcher':
      return generateCatcherGame(genOpts);
    case 'shooter':
      return generateShooterGame(genOpts);
    case 'orbit':
      return generateOrbitGame(genOpts);
    case 'stack':
      return generateStackGame(genOpts);
    case 'runner':
      return generateRunnerGame(genOpts);
    case 'flappy':
    default:
      return generateFlappyGame(genOpts);
  }
}

export interface GameGenOptions {
  title: string;
  themeColor: string;
  accentColor: string;
  bgTop: string;
  bgBottom: string;
  speedMultiplier: number;
  fontUrl: string;
  fontFamily: string;
  playerEmoji: string;
  targetEmoji: string;
  hazardEmoji: string;
  bgmVibe: 'arcade' | 'cyber' | 'chill' | 'action';
}

// --------------------------------------------------------------------------
// 1. FLAPPY / TAP JUMPER
// --------------------------------------------------------------------------
function generateFlappyGame(opts: GameGenOptions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${opts.fontUrl}" rel="stylesheet">
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: ${opts.fontFamily}; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; font-family: ${opts.fontFamily}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; font-family: ${opts.fontFamily}; }
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
      Jumby.sound.bgm.start('${opts.bgmVibe}');
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.sound.bgm.stop();
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
      Jumby.sound.bgm.start('${opts.bgmVibe}');
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

        // Spawn obstacles with level scaling and breather
        const spawnInterval = Jumby.level.getSpawnInterval(75 / ${opts.speedMultiplier}, score, 35);
        if (frames % spawnInterval === 0) {
          if (!Jumby.level.isBreather) {
            spawnItem();
          } else {
            // Breather reward: spawn collectible target instead of hazard
            items.push({
              x: width + 20,
              y: Math.random() * (height - 180) + 90,
              type: 'target',
              radius: 16
            });
          }
        }

        // Update items with scaled speed
        const currentSpeed = itemSpeed * Jumby.level.multiplier;
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.x -= currentSpeed;

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
              Jumby.fx.addFloatingText('+1', item.x, item.y, '${opts.accentColor}', 22);
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

      // Render Items with Emojis
      items.forEach((item) => {
        if (item.type === 'hazard') {
          Jumby.drawEmoji(ctx, '${opts.hazardEmoji}', item.x, item.y, 32);
        } else {
          Jumby.drawEmoji(ctx, '${opts.targetEmoji}', item.x, item.y, 30);
        }
      });

      // Render Player with Expressive Tilt
      const tilt = Math.max(-0.5, Math.min(0.5, player.vy * 0.05));
      Jumby.drawEmoji(ctx, '${opts.playerEmoji}', player.x, player.y, 38, {
        rotation: tilt,
        shadowColor: '${opts.accentColor}',
        shadowBlur: 16
      });

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
function generateOrbitGame(opts: GameGenOptions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${opts.fontUrl}" rel="stylesheet">
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: ${opts.fontFamily}; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; font-family: ${opts.fontFamily}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; font-family: ${opts.fontFamily}; }
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
      Jumby.sound.bgm.start('${opts.bgmVibe}');
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.sound.bgm.stop();
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
      Jumby.sound.bgm.start('${opts.bgmVibe}');
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
        const currentSpeedMult = ${opts.speedMultiplier} * Jumby.level.multiplier;
        angle += 0.042 * dir * currentSpeedMult;

        const spawnInterval = Jumby.level.getSpawnInterval(80 / ${opts.speedMultiplier}, score, 38);
        if (frames % spawnInterval === 0 && !Jumby.level.isBreather) {
          const spawnAngle = Math.random() * Math.PI * 2;
          lasers.push({
            angle: spawnAngle,
            dist: width * 0.7,
            speed: 3.5 * currentSpeedMult,
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
            Jumby.fx.addFloatingText('+1', cx, cy - 35, '${opts.accentColor}', 20);
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

      // Draw Center Core / Target
      Jumby.drawEmoji(ctx, '${opts.targetEmoji}', cx, cy, 38, { shadowColor: '${opts.themeColor}', shadowBlur: 20 });

      // Draw Lasers / Incoming Hazards
      lasers.forEach(l => {
        const lx = cx + Math.cos(l.angle) * l.dist;
        const ly = cy + Math.sin(l.angle) * l.dist;
        Jumby.drawEmoji(ctx, '${opts.hazardEmoji}', lx, ly, 26);
      });

      // Draw Player
      const px = cx + Math.cos(angle) * orbitRadius;
      const py = cy + Math.sin(angle) * orbitRadius;
      Jumby.drawEmoji(ctx, '${opts.playerEmoji}', px, py, 34, {
        rotation: angle + Math.PI / 2,
        shadowColor: '${opts.accentColor}',
        shadowBlur: 18
      });

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
function generateStackGame(opts: GameGenOptions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${opts.fontUrl}" rel="stylesheet">
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; -webkit-user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: ${opts.fontFamily}, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 32px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 64px; font-weight: 900; color: #fff; text-shadow: 0 4px 25px rgba(0,0,0,0.5); font-family: ${opts.fontFamily}; }
    .combo { font-size: 20px; font-weight: 800; color: ${opts.accentColor}; text-shadow: 0 2px 12px rgba(0,0,0,0.6); min-height: 28px; font-family: ${opts.fontFamily}; }
    #hint { position: absolute; bottom: 18%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 15px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 12px rgba(0,0,0,0.6); pointer-events: none; font-family: ${opts.fontFamily}; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.97); } }
  </style>
</head>
<body>
  <div id="ui">
    <div id="score" class="score">0</div>
    <div id="combo" class="combo"></div>
  </div>
  <div id="hint">TAP TO SLICE & STACK</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const comboEl = document.getElementById("combo");
    const hintEl = document.getElementById("hint");

    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    Jumby.input.init(canvas);

    // Built-in Web Audio Synthesizer
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioCtor) audioCtx = new AudioCtor();
      }
      if (audioCtx && audioCtx.state === "suspended") {
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
      osc.type = "sine";
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(380, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, actx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.09);
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
        return Math.round(255 * color).toString(16).padStart(2, "0");
      };
      return "#" + f(0) + f(8) + f(4);
    }

    const BLOCK_HEIGHT = 22;
    const INITIAL_SIZE = 140;
    const LIMIT = 180;

    let state = "playing";
    let score = 0;
    let combo = 0;
    let stack = [];
    let activeBlock = null;
    let debris = [];
    let cameraY = 0;
    let targetCameraY = 0;

    function resetGame() {
      state = "playing";
      score = 0;
      combo = 0;
      cameraY = 0;
      targetCameraY = 0;
      debris = [];
      scoreEl.innerText = "0";
      comboEl.innerText = "";
      hintEl.style.display = "none";

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
      Jumby.setScore(0);
      Jumby.sound.jump();
    }

    function spawnNextBlock() {
      const top = stack[stack.length - 1];
      const axis = stack.length % 2 === 1 ? "x" : "z";
      const nextHex = hslToHex((210 + stack.length * 10) % 360, 80, 68);
      const speed = (3.6 + Math.min(score * 0.08, 3.2)) * ${opts.speedMultiplier} * Jumby.level.multiplier;

      activeBlock = {
        axis: axis,
        x: axis === "x" ? -LIMIT : top.x,
        z: axis === "z" ? -LIMIT : top.z,
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
      if (!activeBlock || state !== "playing") return;

      const top = stack[stack.length - 1];
      const axis = activeBlock.axis;

      if (axis === "x") {
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

          comboEl.innerText = combo > 1 ? \`PERFECT x\${combo}!\` : "PERFECT!";
          Jumby.sound.coin();
          Jumby.awardCoins(1, { item: "Perfect Stack" });
          const scr = toScreen(top.x, activeBlock.y + BLOCK_HEIGHT, top.z, width / 2, height * 0.65 + cameraY);
          Jumby.fx.particles(scr.x, scr.y, 22, "${opts.accentColor}");
          Jumby.fx.addFloatingText("PERFECT! +50", scr.x, scr.y - 15, "${opts.accentColor}", 24);
        } else {
          // Overhang Slice
          combo = 0;
          comboEl.innerText = "";
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

          Jumby.sound.score();
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

          comboEl.innerText = combo > 1 ? \`PERFECT x\${combo}!\` : "PERFECT!";
          Jumby.sound.coin();
          Jumby.awardCoins(1, { item: "Perfect Stack" });
          const scr = toScreen(top.x, activeBlock.y + BLOCK_HEIGHT, top.z, width / 2, height * 0.65 + cameraY);
          Jumby.fx.particles(scr.x, scr.y, 22, "${opts.accentColor}");
          Jumby.fx.addFloatingText("PERFECT! +50", scr.x, scr.y - 15, "${opts.accentColor}", 24);
        } else {
          // Overhang Slice
          combo = 0;
          comboEl.innerText = "";
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

          Jumby.sound.score();
        }
      }

      score++;
      scoreEl.innerText = score;
      Jumby.setScore(score);

      targetCameraY = (stack.length - 1) * BLOCK_HEIGHT;
      spawnNextBlock();
    }

    function die() {
      state = "dead";
      hintEl.style.display = "block";
      hintEl.innerText = "MISSED! TAP TO RETRY";
      Jumby.sound.hit();
      Jumby.fx.shake(16);
      Jumby.gameOver(score);
    }

    function handleAction() {
      getAudioCtx();
      if (state === "dead") {
        resetGame();
      } else if (state === "playing") {
        drop();
      }
    }

    window.addEventListener("pointerdown", handleAction);
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleAction();
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
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    resetGame();

    function loop() {
      requestAnimationFrame(loop);

      if (Jumby.input.justPressed) {
        handleAction();
      }

      // Smooth Camera Lerp
      cameraY += (targetCameraY - cameraY) * 0.12;
      const originX = width / 2;
      const originY = height * 0.65 + cameraY;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "${opts.bgTop}");
      grad.addColorStop(1, "${opts.bgBottom}");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Active Block Sweep
      if (state === "playing" && activeBlock) {
        if (activeBlock.axis === "x") {
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
        color: "#1A162B"
      }, originX, originY);

      // Draw Static Stacked Blocks
      for (let i = 0; i < stack.length; i++) {
        drawIsoBlock(stack[i], originX, originY);
      }

      // Draw Moving Active Block
      if (state === "playing" && activeBlock) {
        drawIsoBlock(activeBlock, originX, originY);
      }

      // Render Falling Debris with Gravity Physics
      if (debris.length > 0) {
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i];
          d.vy += 0.75;
          d.y -= d.vy;
          d.rot += d.rotDir;
          d.alpha -= 0.018;

          if (d.alpha <= 0 || d.y < -350) {
            debris.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, d.alpha);
          const center = toScreen(d.x, d.y + d.h / 2, d.z, originX, originY);
          ctx.translate(center.x, center.y);
          ctx.rotate(d.rot);
          drawIsoBlock({
            x: 0,
            z: 0,
            y: -d.h / 2,
            w: d.w,
            d: d.d,
            h: d.h,
            color: d.color
          }, 0, 0);
          ctx.restore();
        }
      }

      Jumby.fx.updateAndRender(ctx, width, height);
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
function generateRunnerGame(opts: GameGenOptions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${opts.fontUrl}" rel="stylesheet">
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: ${opts.fontFamily}; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; font-family: ${opts.fontFamily}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; font-family: ${opts.fontFamily}; }
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
      Jumby.sound.bgm.start('${opts.bgmVibe}');
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.sound.bgm.stop();
      Jumby.fx.shake(18);
      Jumby.fx.particles(getLaneX(lane), height - 120, 30, '${opts.themeColor}');
      hintEl.style.display = 'block';
      hintEl.innerText = 'WRECKED! TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    Jumby.on('REVIVE_GRANTED', () => {
      state = 'playing';
      obstacles = [];
      hintEl.style.display = 'none';
      Jumby.sound.powerup();
      Jumby.sound.bgm.start('${opts.bgmVibe}');
    });

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
        const spawnInterval = Jumby.level.getSpawnInterval(55 / ${opts.speedMultiplier}, score, 26);
        if (frames % spawnInterval === 0 && !Jumby.level.isBreather) {
          obstacles.push({
            lane: Math.floor(Math.random() * 3),
            y: -50,
            speed: (5.5 * ${opts.speedMultiplier}) * Jumby.level.multiplier,
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
            Jumby.fx.addFloatingText('+1', playerX, playerY - 40, '${opts.accentColor}', 20);
            obstacles.splice(i, 1);
          }
        }
      }

      // Draw Obstacles
      obstacles.forEach(ob => {
        const ox = getLaneX(ob.lane);
        Jumby.drawEmoji(ctx, '${opts.hazardEmoji}', ox, ob.y, 36);
      });

      // Draw Player
      const px = getLaneX(lane);
      const py = height - 120;
      Jumby.drawEmoji(ctx, '${opts.playerEmoji}', px, py, 42, {
        shadowColor: '${opts.accentColor}',
        shadowBlur: 20
      });

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
// 5. CATCHER / FALLING COLLECTOR ARCHETYPE
// --------------------------------------------------------------------------
function generateCatcherGame(opts: GameGenOptions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${opts.fontUrl}" rel="stylesheet">
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: ${opts.fontFamily}; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; font-family: ${opts.fontFamily}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; font-family: ${opts.fontFamily}; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">DRAG TO CATCH • AVOID HAZARDS</div>
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
    let items = [];

    const basket = {
      x: width / 2,
      y: height - 70,
      w: 80,
      h: 22,
      speed: 8 * ${opts.speedMultiplier}
    };

    function spawnItem() {
      const isFever = Jumby.level.isBreather;
      const isHazard = isFever ? false : Math.random() < Math.min(0.42, 0.22 * Jumby.level.multiplier);
      items.push({
        x: Math.random() * (width - 60) + 30,
        y: -20,
        radius: 18,
        vy: (3.2 + Math.random() * 2) * ${opts.speedMultiplier} * Jumby.level.multiplier,
        isHazard: isHazard,
        emoji: isHazard ? '${opts.hazardEmoji}' : '${opts.targetEmoji}'
      });
    }

    function startGame() {
      state = 'playing';
      score = 0;
      frames = 0;
      items = [];
      basket.x = width / 2;
      basket.y = height - 70;
      scoreEl.innerText = '0';
      hintEl.style.display = 'none';
      Jumby.setScore(0);
      Jumby.sound.jump();
      Jumby.sound.bgm.start('${opts.bgmVibe}');
      Jumby.level.init({
        pointsPerLevel: 10,
        onLevelUp: (lvl) => {
          Jumby.level.banner('LEVEL ' + lvl + '!', '🌟 FEVER BONUS ROUND! 🌟', '#FFD700', 2500);
        }
      });
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.sound.bgm.stop();
      Jumby.fx.shake(16);
      Jumby.fx.particles(basket.x, basket.y, 25, '#EF4444');
      hintEl.style.display = 'block';
      hintEl.innerText = 'MISSED! TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    Jumby.on('REVIVE_GRANTED', () => {
      state = 'playing';
      items = items.filter(it => it.y > height * 0.4);
      hintEl.style.display = 'none';
      Jumby.sound.powerup();
      Jumby.sound.bgm.start('${opts.bgmVibe}');
    });

    function loop() {
      requestAnimationFrame(loop);
      frames++;

      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '${opts.bgTop}');
      grad.addColorStop(1, '${opts.bgBottom}');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Handle Input
      if (Jumby.input.justPressed && (state === 'waiting' || state === 'gameover')) {
        startGame();
      }

      if (state === 'playing') {
        // Continuous smooth drag/touch tracking
        if (Jumby.input.isDown || Jumby.input.touchPos.x > 0) {
          const targetX = Jumby.input.touchPos.x;
          basket.x += (targetX - basket.x) * 0.35;
        }

        // Keyboard controls fallback
        if (Jumby.input.keysDown.has('ArrowLeft') || Jumby.input.keysDown.has('KeyA')) {
          basket.x -= basket.speed;
        }
        if (Jumby.input.keysDown.has('ArrowRight') || Jumby.input.keysDown.has('KeyD')) {
          basket.x += basket.speed;
        }

        // Clamp basket inside screen
        basket.x = Math.max(basket.w / 2, Math.min(width - basket.w / 2, basket.x));

        // Spawn items
        if (frames % Math.floor(45 / ${opts.speedMultiplier}) === 0) {
          spawnItem();
        }

        // Update items
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy;

          // Check collision with basket
          const inX = it.x > basket.x - basket.w / 2 - it.radius && it.x < basket.x + basket.w / 2 + it.radius;
          const inY = it.y > basket.y - basket.h / 2 - it.radius && it.y < basket.y + basket.h / 2 + it.radius;

          if (inX && inY) {
            if (it.isHazard) {
              die();
              break;
            } else {
              score += 1;
              scoreEl.innerText = score;
              Jumby.setScore(score);
              Jumby.sound.score();
              Jumby.fx.particles(it.x, it.y, 14, '${opts.accentColor}');
              Jumby.fx.addFloatingText('+1', it.x, it.y, '${opts.accentColor}', 22);
              items.splice(i, 1);
              continue;
            }
          }

          // Off bottom of screen
          if (it.y > height + 30) {
            if (!it.isHazard) {
              // Missed a collectible
              Jumby.fx.particles(it.x, height - 10, 6, 'rgba(255,255,255,0.4)');
            }
            items.splice(i, 1);
          }
        }
      }

      // Draw Items with Emojis
      items.forEach(it => {
        Jumby.drawEmoji(ctx, it.emoji, it.x, it.y, 34);
      });

      // Draw Basket / Collector Character
      Jumby.drawEmoji(ctx, '${opts.playerEmoji}', basket.x, basket.y, 44, {
        shadowColor: '${opts.themeColor}',
        shadowBlur: 14
      });

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
// 6. SHOOTER / WAVE BLASTER ARCHETYPE
// --------------------------------------------------------------------------
function generateShooterGame(opts: GameGenOptions) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${opts.fontUrl}" rel="stylesheet">
  <script src="/jumby-runtime.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${opts.bgTop}; font-family: ${opts.fontFamily}; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 20px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 56px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${opts.themeColor}; font-family: ${opts.fontFamily}; }
    #hint { position: absolute; bottom: 25%; left: 0; right: 0; text-align: center; color: ${opts.accentColor}; font-size: 16px; font-weight: 800; text-shadow: 0 0 10px ${opts.accentColor}; pointer-events: none; font-family: ${opts.fontFamily}; }
  </style>
</head>
<body>
  <div id="ui"><div id="score" class="score">0</div></div>
  <div id="hint">TAP TO FIRE • DESTROY TARGETS</div>
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
    let bullets = [];
    let enemies = [];

    const ship = {
      x: width / 2,
      y: height - 70,
      radius: 20,
      speed: 8 * ${opts.speedMultiplier}
    };

    function spawnEnemy() {
      enemies.push({
        x: Math.random() * (width - 80) + 40,
        y: -25,
        radius: 18,
        vy: (2.2 + Math.random() * 1.5) * ${opts.speedMultiplier} * Jumby.level.multiplier,
        emoji: '${opts.hazardEmoji}'
      });
    }

    function fireBullet() {
      bullets.push({
        x: ship.x,
        y: ship.y - ship.radius,
        vy: -11 * ${opts.speedMultiplier},
        radius: 5
      });
      Jumby.sound.laser();
      Jumby.fx.particles(ship.x, ship.y - ship.radius, 4, '${opts.accentColor}');
    }

    function startGame() {
      state = 'playing';
      score = 0;
      frames = 0;
      bullets = [];
      enemies = [];
      ship.x = width / 2;
      scoreEl.innerText = '0';
      hintEl.style.display = 'none';
      Jumby.setScore(0);
      Jumby.sound.powerup();
      Jumby.sound.bgm.start('${opts.bgmVibe}');
      Jumby.level.init({
        pointsPerLevel: 10,
        curve: 'waves',
        onLevelUp: (wave) => {
          Jumby.level.banner('WAVE ' + wave + '!', 'INCOMING SWARM!', '${opts.accentColor}', 2400);
        }
      });
    }

    function die() {
      state = 'gameover';
      Jumby.sound.hit();
      Jumby.sound.bgm.stop();
      Jumby.fx.shake(16);
      Jumby.fx.particles(ship.x, ship.y, 25, '#EF4444');
      hintEl.style.display = 'block';
      hintEl.innerText = 'BASE BREACHED! TAP TO RETRY';
      Jumby.gameOver(score, { coins: Math.floor(score / 5) });
    }

    Jumby.on('REVIVE_GRANTED', () => {
      state = 'playing';
      enemies = enemies.filter(e => e.y < height * 0.3);
      hintEl.style.display = 'none';
      Jumby.sound.powerup();
      Jumby.sound.bgm.start('${opts.bgmVibe}');
    });

    function loop() {
      requestAnimationFrame(loop);
      frames++;

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
          fireBullet();
        }
      }

      if (state === 'playing') {
        // Follow touch/pointer horizontally
        if (Jumby.input.touchPos.x > 0) {
          ship.x += (Jumby.input.touchPos.x - ship.x) * 0.35;
        }

        // Keyboard controls
        if (Jumby.input.keysDown.has('ArrowLeft') || Jumby.input.keysDown.has('KeyA')) {
          ship.x -= ship.speed;
        }
        if (Jumby.input.keysDown.has('ArrowRight') || Jumby.input.keysDown.has('KeyD')) {
          ship.x += ship.speed;
        }

        ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));

        // Auto-fire while holding touch or space
        if (frames % 12 === 0 && (Jumby.input.isDown || Jumby.input.keysDown.has('Space'))) {
          fireBullet();
        }

        // Spawn enemies with wave interval and breather
        const spawnInterval = Jumby.level.getSpawnInterval(50 / ${opts.speedMultiplier}, score, 22);
        if (frames % spawnInterval === 0 && !Jumby.level.isBreather) {
          spawnEnemy();
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y += b.vy;

          if (b.y < -10) {
            bullets.splice(i, 1);
            continue;
          }

          // Collision with enemies
          for (let j = enemies.length - 1; j >= 0; j--) {
            const en = enemies[j];
            const dist = Math.hypot(b.x - en.x, b.y - en.y);
            if (dist < b.radius + en.radius) {
              score += 1;
              scoreEl.innerText = score;
              Jumby.setScore(score);
              Jumby.sound.score();
              Jumby.fx.particles(en.x, en.y, 16, '${opts.accentColor}');
              Jumby.fx.addFloatingText('+10', en.x, en.y, '${opts.accentColor}', 22);
              enemies.splice(j, 1);
              bullets.splice(i, 1);
              break;
            }
          }
        }

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          en.y += en.vy;

          if (en.y > height - 60) {
            die();
            break;
          }
        }
      }

      // Draw Bullets
      bullets.forEach(b => {
        ctx.save();
        ctx.fillStyle = '${opts.accentColor}';
        ctx.shadowColor = '${opts.accentColor}';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Enemies with Emojis
      enemies.forEach(en => {
        Jumby.drawEmoji(ctx, en.emoji, en.x, en.y, 36);
      });

      // Draw Ship Character
      Jumby.drawEmoji(ctx, '${opts.playerEmoji}', ship.x, ship.y, 44, {
        shadowColor: '${opts.accentColor}',
        shadowBlur: 20
      });

      Jumby.fx.updateAndRender(ctx, width, height);
      ctx.restore();

      Jumby.input.endFrame();
    }

    loop();
  </script>
</body>
</html>`;
}
