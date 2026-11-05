/**
 * Jumby AI Intent & Concept Analyzer
 * Deeply interprets natural language user prompts and visual references
 * into structured game architecture specifications.
 */

export interface GameIntent {
  title: string;
  tagline?: string;
  archetype: 'stack' | 'runner' | 'flappy' | 'catcher' | 'shooter' | 'breakout' | 'orbit' | 'custom';
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
}

export interface IntentOptions {
  prompt: string;
  requestedArchetype?: string;
  referenceImages?: { name: string; dataUrl?: string }[];
  apiKey?: string;
  provider?: string;
}

const SYSTEM_INTENT_PROMPT = `You are the Jumby Lead Game Designer AI.
Analyze the user game prompt and return ONLY a valid, raw JSON object (no markdown, no backticks) with this exact schema:
{
  "title": "Punchy, catchy arcade title (e.g. Neon Sushi Express)",
  "tagline": "Short 4-8 word hook",
  "archetype": "stack" | "runner" | "flappy" | "catcher" | "shooter" | "breakout" | "orbit" | "custom",
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
  const { prompt, requestedArchetype } = options;

  const cliProxyUrl = process.env.CLI_PROXY_URL || 'http://127.0.0.1:8317';
  const cliProxyKey = process.env.CLI_PROXY_KEY || '123456';
  const cliProxyModel = process.env.CLI_PROXY_MODEL || 'gemini-3-flash';

  const userContent = requestedArchetype && requestedArchetype !== 'custom'
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
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        const parsed = parseIntentJson(content);
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
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseIntentJson(text);
          if (parsed) return parsed;
        }
      }
    } catch {}
  }

  // 3. Resilient Semantic Heuristic Fallback
  return fallbackSemanticIntent(prompt, requestedArchetype);
}

function parseIntentJson(raw: string): GameIntent | null {
  try {
    let clean = raw.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);
    clean = clean.trim();

    const data = JSON.parse(clean);
    if (data.title && data.archetype) {
      return {
        title: String(data.title).trim(),
        tagline: data.tagline ? String(data.tagline).trim() : undefined,
        archetype: sanitizeArchetype(data.archetype),
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
  const allowed = ['stack', 'runner', 'flappy', 'catcher', 'shooter', 'breakout', 'orbit', 'custom'];
  const s = String(val).toLowerCase().trim();
  return (allowed.includes(s) ? s : 'catcher') as GameIntent['archetype'];
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

function fallbackSemanticIntent(prompt: string, requestedArchetype?: string): GameIntent {
  const lower = prompt.toLowerCase();

  let archetype: GameIntent['archetype'] = (requestedArchetype as any) || 'catcher';
  if (lower.includes('stack') || lower.includes('tower') || lower.includes('slice') || lower.includes('balance')) {
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
  const title = words.length > 0 ? `${words.join(' ')} Arcade` : 'Arcade Surge';

  return {
    title,
    archetype,
    gameplayLoop: 'Dodge obstacles and collect rewards with precise 1-tap timing.',
    theme: 'Arcade Glow',
    themeColor: '#7160FF',
    accentColor: '#D8FF43',
    bgColor: '#090A14',
    fontVibe: archetype === 'stack' ? 'cartoon' : 'pixel',
    speedMultiplier: lower.includes('fast') ? 1.6 : 1.2,
    gravity: 0.38,
    soundVibe: archetype === 'stack' ? 'chill' : 'arcade',
    collectibleItem: '💎 Gem',
    mechanicTwist: 'Perfect timing unlocks speed frenzy mode',
  };
}
