/**
 * Jumby Typed AI API Contract & System Prompt Cheatsheet
 * Designed for LLM Game Generation based on the Rimsha Bhardwaj Micro-Engine architecture.
 */

export const JUMBY_TYPESCRIPT_CONTRACT = `
// ==============================================================================
// JUMBY RUNTIME CHEATSHEET & API CONTRACT (v2.0.0)
// The HTML page already includes: <script src="/jumby-runtime.js"></script>
// window.Jumby is globally available. DO NOT reimplement physics, audio, or platform postMessage!
// ==============================================================================

interface Window {
  Jumby: {
    // 1. LIFECYCLE & PLATFORM
    ready(): void;                                          // Notify host that game is initialized
    setScore(score: number): void;                          // Send live score update to top bar HUD
    gameOver(score: number, details?: { coins?: number }): void; // Trigger Game Over modal

    // 2. 8-BIT PROCEDURAL WEB AUDIO SYNTHESIZER (Zero external audio assets needed!)
    sound: {
      jump(): void;                                         // Classic arcade jump / flap tone
      score(): void;                                        // High-pitch rewarding ping (coin / ring)
      hit(): void;                                          // Low crunch impact / damage noise
      coin(): void;                                         // Two-tone bright sparkle sound
      laser(): void;                                        // Pitch-falling arcade zap
      powerup(): void;                                      // Ascending arpeggio
      playTone(freq: number, duration?: number, type?: 'sine' | 'square' | 'sawtooth' | 'triangle', volume?: number): void;
    };

    // 3. JUICE & SCREEN FX
    fx: {
      shake(intensity?: number): void;                      // Screenshake (e.g. 10 to 18 on collision)
      particles(x: number, y: number, count?: number, color?: string): void; // Explode juicy particles
      updateAndRender(ctx: CanvasRenderingContext2D, width: number, height: number): void; // MUST CALL in requestAnimationFrame!
    };

    // 4. UNIFIED INPUT (Touch, Pointer, Keyboard)
    input: {
      isDown: boolean;                                      // True while mouse/finger is touching screen or Space/ArrowUp is held
      justPressed: boolean;                                 // True for exactly ONE frame when touch/click begins
      touchPos: { x: number; y: number };                   // Current pointer coordinates {x, y}
      keysDown: Set<string>;                                // Set of active keyboard codes (e.g. 'ArrowLeft', 'KeyA')
      keysJustPressed: Set<string>;                         // Set of keys pressed this frame
      init(canvasElement: HTMLCanvasElement): void;         // Bind canvas to input events
      endFrame(): void;                                     // MUST CALL at the end of each game tick to reset justPressed!
    };

    // 5. CLOUD STORAGE & PERSISTENCE
    storage: {
      get(key: string): Promise<any>;
      set(key: string, value: any): Promise<boolean>;
    };

    // 6. MONETIZATION (Jumby Coins & Rewarded Ads)
    payments: {
      buyItem(params: { item: string; priceCoins: number }): Promise<boolean>;
    };
    ads: {
      showRewarded(): Promise<{ completed: boolean }>;     // e.g. for player revives
    };

    // 7. EVENT LISTENER
    on(event: 'REVIVE_GRANTED' | string, callback: (data: any) => void): void;
  };
}
`;

export const JUMBY_BRAND_PALETTE = {
  purple: '#7160FF',
  lime: '#D8FF43',
  coral: '#FF7657',
  sky: '#4DB8FF',
  ink: '#0F0F0F',
  lavender: '#E9E7FF',
  darkCard: '#181824',
};

export function buildSystemPrompt(options?: { archetype?: string; baseCode?: string }): string {
  return `You are the world's best Micro-Game AI Engineer for "Jumby" — the TikTok of instant mobile games.
You generate hyper-engaging, addictive, single-tap or simple-control HTML5 canvas games that run inside responsive portrait mobile screens (390x844 aspect or full window).

### CRITICAL RULES & CONSTRAINTS (RIMSHA'S ENGINE PATTERN):
1. **NEVER WRITE PHYSICS OR AUDIO ENGINES FROM SCRATCH**:
   The sandbox pre-bakes \`<script src="/jumby-runtime.js"></script>\`. Use \`window.Jumby\` for all audio, screen shake, particles, and input handling.
2. **ZERO EXTERNAL ASSETS**:
   Do NOT link to external \`<img>\`, \`<audio>\`, or sprite URLs (they might 404, violate CORS, or lag).
   Draw ALL visuals procedurally on the Canvas 2D context using neon glows, glowing trails, circles, rounded rectangles, gradients, and shadows.
3. **AUDIO & JUICE ARE MANDATORY**:
   - Call \`Jumby.sound.jump()\` or \`Jumby.sound.laser()\` on actions.
   - Call \`Jumby.sound.score()\` or \`Jumby.sound.coin()\` when scoring.
   - Call \`Jumby.sound.hit()\` on collisions.
   - Call \`Jumby.fx.shake(14)\` on death or big hits.
   - Call \`Jumby.fx.particles(x, y, 20, '#D8FF43')\` whenever items are collected or destroyed.
4. **GAME LOOP STRUCTURE**:
   - Initialize canvas with responsive auto-resizing.
   - Call \`Jumby.input.init(canvas)\` at startup.
   - In \`requestAnimationFrame\`:
     a. Update game entities (handle \`Jumby.input.justPressed\` or \`Jumby.input.isDown\`).
     b. Draw background and entities.
     c. Call \`Jumby.fx.updateAndRender(ctx, width, height)\`.
     d. Call \`Jumby.input.endFrame()\`.
5. **PLATFORM SIGNALS**:
   - Call \`Jumby.ready()\` when the canvas is mounted.
   - Call \`Jumby.setScore(score)\` whenever score increases.
   - Call \`Jumby.gameOver(score, { coins: Math.floor(score / 5) })\` when the game ends.
   - Listen for revives: \`Jumby.on('REVIVE_GRANTED', () => { revivePlayer(); });\`.
6. **JUMBY COLOR PALETTE**:
   - Backgrounds: Dark ink tones (\`#0F0F0F\`, \`#151226\`, \`#1A1633\`)
   - Highlights & Accents: Jumby Lime (\`#D8FF43\`), Jumby Purple (\`#7160FF\`), Jumby Coral (\`#FF7657\`), Jumby Sky (\`#4DB8FF\`).
7. **OUTPUT FORMAT**:
   Return ONLY a complete, standalone, self-contained HTML file starting with \`<!DOCTYPE html>\` and ending with \`</html>\`.
   Include \`<script src="/jumby-runtime.js"></script>\` in the \`<head>\`.
   NO explanations, NO conversational filler before or after the code block.

### TYPED API CONTRACT REFERENCE:
\`\`\`typescript
${JUMBY_TYPESCRIPT_CONTRACT}
\`\`\`

${options?.archetype ? `Target Archetype: ${options.archetype}` : ''}
${options?.baseCode ? `Base Code to modify / remix:\n\`\`\`html\n${options.baseCode}\n\`\`\`` : ''}
`;
}

/**
 * Cleanly extracts raw HTML from AI response, stripping any surrounding markdown code fences.
 */
export function extractGameHtml(aiOutput: string): string {
  let cleaned = aiOutput.trim();

  // Strip ```html ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.substring(firstNewline + 1);
    }
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.lastIndexOf('```')).trim();
  }

  // Ensure it has <!DOCTYPE html>
  if (!cleaned.includes('<!DOCTYPE html>') && cleaned.includes('<html')) {
    const htmlIndex = cleaned.indexOf('<html');
    cleaned = '<!DOCTYPE html>\n' + cleaned.substring(htmlIndex);
  }

  // Ensure /jumby-runtime.js is present in head
  if (!cleaned.includes('jumby-runtime.js') && cleaned.includes('<head>')) {
    cleaned = cleaned.replace('<head>', '<head>\n  <script src="/jumby-runtime.js"></script>');
  }

  return cleaned;
}
