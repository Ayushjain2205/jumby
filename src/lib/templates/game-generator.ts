/**
 * Built-in Base Template Generator
 * Produces complete, runnable HTML5 Canvas games with window.Jumby SDK integration.
 */

export interface GameTemplateConfig {
  title: string;
  themeColor: string;
  accentColor: string;
  bgGradient: [string, string];
  gameType: 'flappy' | 'dodge' | 'stack' | 'collector';
  speedMultiplier: number;
  gravity: number;
  customJsSnippet?: string;
}

export function generateGameHtml(config: GameTemplateConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.title}</title>
  <script src="/jumby-sdk.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; -webkit-user-select: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${config.bgGradient[0]}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
    #ui { position: absolute; top: 24px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 10; }
    .score { font-size: 52px; font-weight: 900; color: #fff; text-shadow: 0 0 20px ${config.themeColor}; }
    #hint { position: absolute; bottom: 30%; left: 0; right: 0; text-align: center; color: ${config.accentColor}; font-size: 18px; font-weight: 700; text-shadow: 0 0 10px ${config.accentColor}; pointer-events: none; }
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

      // Gradient background
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

      // Draw items
      for (const item of items) {
        ctx.shadowBlur = 15;
        if (item.type === 'hazard') {
          ctx.shadowColor = '${config.accentColor}';
          ctx.fillStyle = '${config.accentColor}';
        } else {
          ctx.shadowColor = '#facc15';
          ctx.fillStyle = '#facc15';
        }
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw player trail
      for (let i = 0; i < player.trail.length; i++) {
        const t = player.trail[i];
        const alpha = (i + 1) / player.trail.length * 0.4;
        ctx.fillStyle = 'rgba(0, 240, 255, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(t.x, t.y, player.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw player
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
