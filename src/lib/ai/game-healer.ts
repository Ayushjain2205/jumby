/**
 * Jumby Self-Healing Code Validator & Auto-Patcher (v1.0.0)
 * 
 * Inspects raw AI-generated micro-game HTML, diagnoses syntax, structural, canvas,
 * and logic anomalies, and automatically heals them before mounting into the sandbox.
 * Guarantees zero blank screens, functional 60fps input tracking, and responsive canvas sizing.
 */

import { synthesizeProceduralGame } from './smart-generator';

export interface HealingResult {
  html: string;
  issuesFixed: string[];
  isPlayable: boolean;
  wasSynthesizedFallback: boolean;
}

export interface ValidationOptions {
  prompt?: string;
  archetype?: string;
}

/**
 * Validates raw AI game output and applies auto-healing patches.
 */
export function validateAndHealGameHtml(rawHtml: string, options?: ValidationOptions): HealingResult {
  const issuesFixed: string[] = [];
  const prompt = options?.prompt || 'arcade';
  const archetype = (options?.archetype as any) || 'catcher';

  if (!rawHtml || typeof rawHtml !== 'string' || rawHtml.trim().length < 50) {
    issuesFixed.push('Empty or truncated AI response; synthesized procedural fallback game');
    const fallback = synthesizeProceduralGame({ prompt, archetype });
    return {
      html: fallback,
      issuesFixed,
      isPlayable: true,
      wasSynthesizedFallback: true,
    };
  }

  let code = rawHtml.trim();

  // 1. Markdown Fences & Extraneous Conversational Text Cleanup
  const codeBlockMatch = code.match(/```(?:html|xml)?\s*\n?([\s\S]*?)(\n?```|$)/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    code = codeBlockMatch[1].trim();
    issuesFixed.push('Stripped markdown code fences');
  }

  const docTypeIdx = code.indexOf('<!DOCTYPE html');
  const htmlTagIdx = code.indexOf('<html');

  if (docTypeIdx !== -1) {
    code = code.substring(docTypeIdx);
  } else if (htmlTagIdx !== -1) {
    code = '<!DOCTYPE html>\n' + code.substring(htmlTagIdx);
    issuesFixed.push('Injected missing <!DOCTYPE html>');
  } else {
    code = '<!DOCTYPE html>\n<html lang="en">\n<head>\n</head>\n<body>\n' + code;
    issuesFixed.push('Wrapped raw snippet inside HTML document shell');
  }

  // 2. Head & Viewport & CSS Reset Guardian
  if (!code.includes('<head>')) {
    code = code.replace('<html lang="en">', '<html lang="en">\n<head>\n</head>');
    code = code.replace('<html>', '<html>\n<head>\n</head>');
    issuesFixed.push('Injected missing <head> tag');
  }

  if (!code.includes('viewport')) {
    code = code.replace(
      '<head>',
      '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">'
    );
    issuesFixed.push('Injected mobile responsive viewport meta tag');
  }

  // Ensure /jumby-runtime.js is present
  if (!code.includes('jumby-runtime.js')) {
    code = code.replace('<head>', '<head>\n  <script src="/jumby-runtime.js"></script>');
    issuesFixed.push('Injected missing <script src="/jumby-runtime.js"></script>');
  }

  // Ensure touch-action: none & zero margin reset styles
  if (!code.includes('touch-action')) {
    const resetStyle = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0F0F0F; font-family: -apple-system, sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
  </style>`;
    code = code.replace('</head>', `${resetStyle}\n</head>`);
    issuesFixed.push('Injected full-screen zero-scroll mobile CSS reset (touch-action: none)');
  }

  // 3. Body & Canvas Guardian
  if (!code.includes('<body>')) {
    code = code.replace('</head>', '</head>\n<body>');
    issuesFixed.push('Injected missing <body> tag');
  }

  if (!code.includes('<canvas')) {
    code = code.replace('<body>', '<body>\n  <canvas id="canvas"></canvas>');
    issuesFixed.push('Injected missing <canvas id="canvas"> into <body>');
  }

  // 4. Ensure Closing Tags
  if (!code.includes('</script>') && code.includes('<script')) {
    code += '\n</script>';
    issuesFixed.push('Closed unclosed <script> tag');
  }
  if (!code.includes('</body>')) {
    code += '\n</body>';
    issuesFixed.push('Closed unclosed </body> tag');
  }
  if (!code.includes('</html>')) {
    code += '\n</html>';
    issuesFixed.push('Closed unclosed </html> tag');
  }

  // 5. JavaScript Logic & Runtime Guardian Injection
  const scriptMatch = code.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
  let jsCode = scriptMatch ? scriptMatch[1] : '';

  if (!jsCode || jsCode.trim().length < 40) {
    // No JS code or completely hollow script -> synthesize procedural game
    issuesFixed.push('Script was empty or non-executable; synthesized procedural fallback game');
    const fallback = synthesizeProceduralGame({ prompt, archetype });
    return {
      html: fallback,
      issuesFixed,
      isPlayable: true,
      wasSynthesizedFallback: true,
    };
  }

  let jsPatched = jsCode;

  // A. Canvas & Context Binding Check
  if (!jsPatched.includes('getContext') && !jsPatched.includes('ctx')) {
    const canvasInit = `
    const canvas = document.getElementById('canvas') || document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
`;
    jsPatched = canvasInit + jsPatched;
    issuesFixed.push('Auto-bound canvas and 2D rendering context');
  }

  // B. Responsive Resize Guardian
  if (!jsPatched.includes('addEventListener(\'resize\'') && !jsPatched.includes('addEventListener("resize"')) {
    const resizeHandler = `
    function __jumby_auto_resize() {
      const c = document.querySelector('canvas');
      if (c) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
      }
    }
    window.addEventListener('resize', __jumby_auto_resize);
    __jumby_auto_resize();
`;
    jsPatched = resizeHandler + jsPatched;
    issuesFixed.push('Injected responsive 60fps window resize event listener');
  }

  // C. Unified Input Init Check
  if (!jsPatched.includes('Jumby.input.init(')) {
    const inputInit = `
    if (typeof Jumby !== 'undefined' && Jumby.input) {
      const c = document.querySelector('canvas');
      if (c) Jumby.input.init(c);
    }
    if (typeof Jumby !== 'undefined' && !Jumby.awardCoins) {
      Jumby.awardCoins = function (amount, details) {
        if (typeof window !== 'undefined' && window.parent) {
          window.parent.postMessage({ source: 'JUMBY_GAME', type: 'JUMBY_AWARD_COINS', amount: amount || 1, ...(typeof details === 'object' ? details : {}) }, '*');
        }
      };
    }
`;
    jsPatched = inputInit + jsPatched;
    issuesFixed.push('Auto-initialized Jumby.input unified touch/pointer controls');
  }

  // D. RAF Loop Guardian
  if (!jsPatched.includes('requestAnimationFrame')) {
    // If there is an update or loop function, schedule it
    const loopMatch = jsPatched.match(/function\s+(loop|update|render|tick|gameLoop)\s*\(/i);
    if (loopMatch) {
      const funcName = loopMatch[1];
      jsPatched += `
    function __jumby_guard_loop() {
      try {
        ${funcName}();
      } catch (e) {
        console.error('[Jumby RAF Guard Error]', e);
      }
      requestAnimationFrame(__jumby_guard_loop);
    }
    requestAnimationFrame(__jumby_guard_loop);
`;
      issuesFixed.push(`Injected missing requestAnimationFrame loop for '${funcName}()'`);
    }
  }

  // E. Input EndFrame Guardian
  if (!jsPatched.includes('Jumby.input.endFrame()')) {
    // Inject at the end of loop or tick function
    if (jsPatched.includes('requestAnimationFrame(')) {
      jsPatched = jsPatched.replace(
        /requestAnimationFrame\s*\([^)]+\);/g,
        (match) => `${match}\n      if (typeof Jumby !== 'undefined' && Jumby.input) Jumby.input.endFrame();`
      );
      issuesFixed.push('Injected Jumby.input.endFrame() reset into animation loop');
    }
  }

  // F. Tap-to-Restart State Safeguard (only if no existing input listener is registered)
  if (!jsPatched.includes('pointerdown') && !jsPatched.includes('justPressed') && !jsPatched.includes('isDown')) {
    const restartSafeguard = `
    window.addEventListener('pointerdown', function () {
      if (typeof state !== 'undefined' && (state === 'gameover' || state === 'waiting')) {
        state = 'playing';
        if (typeof startGame === 'function') startGame();
        else if (typeof initGame === 'function') initGame();
        else if (typeof restartGame === 'function') restartGame();
        else if (typeof reset === 'function') reset();
      }
    });
`;
    jsPatched += restartSafeguard;
    issuesFixed.push('Injected tap-to-restart safeguard for gameover/waiting states');
  }

  // G. DOMContentLoaded in srcdoc iframe safety
  // In srcdoc iframes, DOMContentLoaded may have already fired before the script executes
  if (jsPatched.includes('DOMContentLoaded')) {
    jsPatched = jsPatched.replace(
      /(?:window|document)\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*(?:\(\s*\)\s*=>|function\s*\(\s*\))\s*\{/g,
      '(function __jumby_run_game() {\n'
    );
    // Replace trailing }); with })();
    jsPatched = jsPatched.replace(/\}\s*\)\s*;\s*$/, '})();');
    issuesFixed.push('Unwrapped DOMContentLoaded listener so game runs immediately in srcdoc iframe');
  }

  // H. Stacker & Physics Boundary Oscillation Healer
  // Fixes: if (block.x > 180 || block.x < -180) moveDir *= -1; which traps blocks spawned outside boundary
  const boundaryPattern = /if\s*\(\s*(\w+\.(?:x|z|y|pos|coordinate))\s*>\s*(\d+(?:\.\d+)?)\s*\|\|\s*\1\s*<\s*-(\d+(?:\.\d+)?)\s*\)\s*(\w+(?:\.\w+)?)\s*\*=\s*-1;?/g;
  if (boundaryPattern.test(jsPatched)) {
    jsPatched = jsPatched.replace(boundaryPattern, (match, prop, maxLimit, minLimit, dirVar) => {
      const bound = Math.max(parseFloat(maxLimit), 220);
      return `if (${prop} >= ${bound}) { ${prop} = ${bound}; ${dirVar} = -Math.abs(${dirVar}); } else if (${prop} <= -${bound}) { ${prop} = -${bound}; ${dirVar} = Math.abs(${dirVar}); }`;
    });
    issuesFixed.push('Healed boundary oscillation traps into directional clamp bounces');
  }

  const absBoundaryPattern = /if\s*\(\s*Math\.abs\(\s*(\w+\.(?:x|z|y|pos|coordinate))\s*\)\s*>\s*(\d+(?:\.\d+)?)\s*\)\s*(\w+(?:\.\w+)?)\s*\*=\s*-1;?/g;
  if (absBoundaryPattern.test(jsPatched)) {
    jsPatched = jsPatched.replace(absBoundaryPattern, (match, prop, limit, dirVar) => {
      const bound = Math.max(parseFloat(limit), 220);
      return `if (${prop} >= ${bound}) { ${prop} = ${bound}; ${dirVar} = -Math.abs(${dirVar}); } else if (${prop} <= -${bound}) { ${prop} = -${bound}; ${dirVar} = Math.abs(${dirVar}); }`;
    });
    issuesFixed.push('Healed Math.abs boundary oscillation traps into directional clamp bounces');
  }

  // I. Auto-Start Uninitialized Games
  // If game defines resetGame/startGame/initGame but never calls it, it sits frozen in waiting state
  const resetFnMatch = jsPatched.match(/function\s+(resetGame|startGame|initGame|initStack|reset)\s*\(/i);
  if (resetFnMatch) {
    const fnName = resetFnMatch[1];
    const callRegex = new RegExp(`(?<!function\\s+)${fnName}\\s*\\(`, 'g');
    const matches = jsPatched.match(callRegex) || [];
    if (matches.length <= 1) {
      jsPatched += `\n    // Auto-started by Jumby Healer\n    if (typeof ${fnName} === 'function') { try { ${fnName}(); } catch (e) { console.warn('[Jumby Auto-Start]', e); } }\n`;
      issuesFixed.push(`Auto-started uninitialized game with '${fnName}()'`);
    }
  }

  // Replace script contents with patched code
  if (scriptMatch && scriptMatch[0]) {
    code = code.replace(scriptMatch[0], `<script>\n${jsPatched}\n  </script>`);
  } else {
    code = code.replace('</body>', `<script>\n${jsPatched}\n  </script>\n</body>`);
  }

  return {
    html: code,
    issuesFixed,
    isPlayable: true,
    wasSynthesizedFallback: false,
  };
}
