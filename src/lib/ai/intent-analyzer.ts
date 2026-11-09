/**
 * Jumby AI Intent & Concept Analyzer
 * Deeply interprets natural language user prompts and visual references
 * into structured game architecture specifications.
 */

export interface GameIntent {
  title: string;
  tagline?: string;
  archetype: 'slingshot' | 'grid_puzzle' | 'survivors_arena' | 'card_strategy' | 'stack' | 'runner' | 'flappy' | 'catcher' | 'shooter' | 'breakout' | 'orbit' | 'custom' | string;
  gameplayLoop: string;
  theme: string;
  themeColor: string;
  accentColor: string;
  bgColor: string;
  fontVibe: 'pixel' | 'cyber' | 'cartoon' | 'action' | 'zen';
  speedMultiplier: number;
  gravity: number;
  soundVibe: 'arcade' | 'cyber' | 'chill' | 'action';
  collectibleItem: string;
  mechanicTwist: string;
  requiredPrimitives?: ('physics' | 'grid' | 'camera' | 'slingshot' | 'particles' | 'virtualStick')[];
}

export interface IntentOptions {
  prompt: string;
  requestedArchetype?: string;
  referenceImages?: { name: string; dataUrl?: string }[];
  apiKey?: string;
  provider?: string;
  isEdit?: boolean;
  currentTitle?: string;
}

const SYSTEM_INTENT_PROMPT = `You are the Jumby Lead Game Designer AI.
Analyze the user game prompt and return ONLY a valid, raw JSON object (no markdown, no backticks) with this exact schema:
{
  "title": "Punchy, catchy arcade title (e.g. Neon Sushi Express)",
  "tagline": "Short 4-8 word hook",
  "archetype": "slingshot" | "grid_puzzle" | "survivors_arena" | "card_strategy" | "stack" | "runner" | "flappy" | "catcher" | "shooter" | "breakout" | "orbit" | "custom",
  "gameplayLoop": "1-2 sentences explaining core interaction and win/loss condition",
  "theme": "Visual aesthetic name (e.g. Cyberpunk Synthwave, Cozy Lo-fi, Saffron Festival)",
  "themeColor": "#HEX primary dominant entity/player color",
  "accentColor": "#HEX bright neon/glow accent color",
  "bgColor": "#HEX dark rich background canvas color (keep dark, e.g. #090A1A, #0F0F14, #120A1A)",
  "fontVibe": "pixel" | "cyber" | "cartoon" | "action" | "zen",
  "speedMultiplier": 0.8 to 2.2 (floating point number),
  "gravity": 0.20 to 0.65 (floating point number),
  "soundVibe": "arcade" | "cyber" | "chill" | "action",
  "collectibleItem": "Emoji + item name (e.g. 🍣 Fresh Nigiri, 💎 Star Gem, ⚡ Plasma Orb)",
  "mechanicTwist": "One juicy, memorable gameplay mechanic hook"
}`;

/**
 * Intelligent AI Intent Extraction
 */
export async function extractGameIntent(options: IntentOptions): Promise<GameIntent> {
  const { prompt, requestedArchetype, isEdit, currentTitle } = options;

  const cliProxyUrl = process.env.CLI_PROXY_URL || 'http://127.0.0.1:8317';
  const cliProxyKey = process.env.CLI_PROXY_KEY || '123456';
  const cliProxyModel = process.env.CLI_PROXY_MODEL || 'gemini-3-flash';

  const userContent = isEdit
    ? `EDITING EXISTING GAME:
Title: "${currentTitle || 'Existing Game'}"
Archetype: ${requestedArchetype || 'preserve existing'}
User Edit Instruction: "${prompt}"

CRITICAL: The user is EDITING an existing game. DO NOT CHANGE THE TITLE OR THE ARCHETYPE!
Set "title": "${currentTitle || 'Existing Game'}"
Set "archetype": "${requestedArchetype || 'grid_puzzle'}"
Update the visual theme, colors, font vibe, and item to reflect the user's requested edit.`
    : requestedArchetype && requestedArchetype !== 'custom'
    ? `Game Prompt: "${prompt}" (Preferred Base Archetype: ${requestedArchetype})`
    : `Game Prompt: "${prompt}"`;

  // 1. Try Local CLI Proxy (Ultra-fast, local Gemini Flash)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${cliProxyUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cliProxyKey}`,
      },
      body: JSON.stringify({
        model: cliProxyModel,
        messages: [
          { role: 'system', content: SYSTEM_INTENT_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        const parsed = parseIntentJson(content, isEdit, currentTitle, requestedArchetype);
        if (parsed) return parsed;
      }
    }
  } catch (err) {
    // Continue to cloud fallback
  }

  // 2. Try Gemini API directly if key available
  const geminiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_INTENT_PROMPT}\n\nUser Prompt: ${userContent}` }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseIntentJson(text, isEdit, currentTitle, requestedArchetype);
          if (parsed) return parsed;
        }
      }
    } catch {}
  }

  // 3. Resilient Semantic Heuristic Fallback
  return fallbackSemanticIntent(prompt, requestedArchetype, isEdit, currentTitle);
}

function parseIntentJson(
  raw: string,
  isEdit?: boolean,
  currentTitle?: string,
  requestedArchetype?: string
): GameIntent | null {
  try {
    let clean = raw.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    clean = clean.trim();

    const data = JSON.parse(clean);
    if (data.title && data.archetype) {
      const finalTitle = isEdit && currentTitle ? currentTitle : String(data.title).trim();
      const finalArchetype = isEdit && requestedArchetype && requestedArchetype !== 'custom'
        ? (requestedArchetype as any)
        : sanitizeArchetype(data.archetype);

      return {
        title: finalTitle,
        tagline: data.tagline ? String(data.tagline).trim() : undefined,
        archetype: finalArchetype,
        gameplayLoop: String(data.gameplayLoop || 'Tap to play and survive.'),
        theme: String(data.theme || 'Arcade'),
        themeColor: sanitizeHex(data.themeColor, '#7160FF'),
        accentColor: sanitizeHex(data.accentColor, '#D8FF43'),
        bgColor: sanitizeHex(data.bgColor, '#0A0A14'),
        fontVibe: sanitizeFontVibe(data.fontVibe),
        speedMultiplier: typeof data.speedMultiplier === 'number' ? Math.max(0.7, Math.min(2.5, data.speedMultiplier)) : 1.2,
        gravity: typeof data.gravity === 'number' ? Math.max(0.15, Math.min(0.7, data.gravity)) : 0.38,
        soundVibe: sanitizeSoundVibe(data.soundVibe),
        collectibleItem: String(data.collectibleItem || '💎 Gem'),
        mechanicTwist: String(data.mechanicTwist || 'Combo multiplier on perfect actions'),
      };
    }
  } catch {}
  return null;
}

function sanitizeArchetype(val: any): GameIntent['archetype'] {
  const allowed = [
    'slingshot',
    'grid_puzzle',
    'survivors_arena',
    'card_strategy',
    'stack',
    'runner',
    'flappy',
    'catcher',
    'shooter',
    'breakout',
    'orbit',
    'custom',
  ];
  const s = String(val).toLowerCase().trim();
  return allowed.includes(s) ? (s as GameIntent['archetype']) : s || 'custom';
}

function sanitizeHex(val: any, fallback: string): string {
  if (typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val)) return val;
  return fallback;
}

function sanitizeFontVibe(val: any): GameIntent['fontVibe'] {
  const allowed = ['pixel', 'cyber', 'cartoon', 'action', 'zen'];
  const s = String(val).toLowerCase().trim();
  return (allowed.includes(s) ? s : 'pixel') as GameIntent['fontVibe'];
}

function sanitizeSoundVibe(val: any): GameIntent['soundVibe'] {
  const allowed = ['arcade', 'cyber', 'chill', 'action'];
  const s = String(val).toLowerCase().trim();
  return (allowed.includes(s) ? s : 'arcade') as GameIntent['soundVibe'];
}

function fallbackSemanticIntent(
  prompt: string,
  requestedArchetype?: string,
  isEdit?: boolean,
  currentTitle?: string
): GameIntent {
  const lower = prompt.toLowerCase();

  let archetype: GameIntent['archetype'] = (requestedArchetype as any) || 'custom';
  if (isEdit && requestedArchetype) {
    archetype = requestedArchetype as any;
  } else if (lower.includes('slingshot') || lower.includes('catapult') || lower.includes('angry') || lower.includes('golf') || lower.includes('pinball') || lower.includes('billiards') || lower.includes('pool')) {
    archetype = 'slingshot';
  } else if (lower.includes('match') || lower.includes('grid') || lower.includes('puzzle') || lower.includes('2048') || lower.includes('sand') || lower.includes('chess') || lower.includes('sokoban') || lower.includes('tetris')) {
    archetype = 'grid_puzzle';
  } else if (lower.includes('survivor') || lower.includes('arena') || lower.includes('swarm') || lower.includes('bullet hell') || lower.includes('danmaku') || lower.includes('rogue')) {
    archetype = 'survivors_arena';
  } else if (lower.includes('card') || lower.includes('deck') || lower.includes('turn') || lower.includes('battle')) {
    archetype = 'card_strategy';
  } else if (lower.includes('stack') || lower.includes('tower') || lower.includes('slice') || lower.includes('balance')) {
    archetype = 'stack';
  } else if (lower.includes('runner') || lower.includes('car') || lower.includes('dash') || lower.includes('subway')) {
    archetype = 'runner';
  } else if (lower.includes('flap') || lower.includes('bird') || lower.includes('fly') || lower.includes('jump')) {
    archetype = 'flappy';
  } else if (lower.includes('shoot') || lower.includes('laser') || lower.includes('invader') || lower.includes('alien')) {
    archetype = 'shooter';
  } else if (lower.includes('brick') || lower.includes('breakout') || lower.includes('paddle') || lower.includes('pong')) {
    archetype = 'breakout';
  } else if (lower.includes('orbit') || lower.includes('gravity') || lower.includes('solar') || lower.includes('pulse')) {
    archetype = 'orbit';
  }

  const words = prompt.trim().replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const title = isEdit && currentTitle ? currentTitle : words.length > 0 ? `${words.join(' ')} Arcade` : 'Arcade Surge';

  return {
    title,
    archetype,
    gameplayLoop: 'Dodge obstacles and collect rewards with precise 1-tap timing.',
    theme: lower.includes('horror') ? 'Gothic Horror' : 'Arcade Glow',
    themeColor: lower.includes('horror') ? '#DC2626' : '#7160FF',
    accentColor: lower.includes('horror') ? '#991B1B' : '#D8FF43',
    bgColor: lower.includes('horror') ? '#080508' : '#090A14',
    fontVibe: lower.includes('horror') ? 'action' : archetype === 'stack' ? 'cartoon' : 'pixel',
    speedMultiplier: lower.includes('fast') ? 1.6 : 1.2,
    gravity: 0.38,
    soundVibe: lower.includes('horror') ? 'action' : archetype === 'stack' ? 'chill' : 'arcade',
    collectibleItem: lower.includes('horror') ? '💀 Skull' : '💎 Gem',
    mechanicTwist: 'Perfect timing unlocks speed frenzy mode',
  };
}
