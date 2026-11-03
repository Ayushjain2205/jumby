export interface GameFontVibe {
  id: string;
  name: string;
  fontFamily: string;
  fallback: string;
  googleFont: string;
  cssUrl: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const GAME_FONTS: GameFontVibe[] = [
  {
    id: 'cartoon',
    name: 'Bouncy Cartoon',
    fontFamily: 'Fredoka',
    fallback: 'cursive, sans-serif',
    googleFont: 'Fredoka:wght@600;700;900',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;900&display=swap',
    icon: '🍭',
    description: 'Chunky bubble font for stack, slice, candy, animals, and casual games',
    keywords: ['stack', 'slice', 'tower', 'cartoon', 'bubble', 'bouncy', 'candy', 'fruit', 'animal', 'cute', 'funny', 'taco', 'casual', 'party', 'food'],
  },
  {
    id: 'retro',
    name: '8-Bit Arcade',
    fontFamily: 'Press Start 2P',
    fallback: 'monospace',
    googleFont: 'Press+Start+2P',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
    icon: '🕹️',
    description: 'Nostalgic crunchy pixel font for retro arcade, flappy, and classic jumpers',
    keywords: ['pixel', '8bit', '8-bit', 'retro', 'arcade', 'flappy', 'mario', 'nostalgia', 'chiptune', 'vintage', 'bird', 'pipe'],
  },
  {
    id: 'cyber',
    name: 'Cyber Sci-Fi',
    fontFamily: 'Orbitron',
    fallback: 'sans-serif',
    googleFont: 'Orbitron:wght@700;900',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap',
    icon: '⚡',
    description: 'High-tech angular font for runners, space, lasers, speed, and synthwave',
    keywords: ['cyber', 'neon', 'runner', 'speed', 'laser', 'space', 'synthwave', 'future', 'scifi', 'sci-fi', 'drift', 'tech', 'lane'],
  },
  {
    id: 'action',
    name: 'Action Impact',
    fontFamily: 'Russo One',
    fallback: 'sans-serif',
    googleFont: 'Russo+One',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap',
    icon: '🔥',
    description: 'Heavy bold aggressive font for racing, fighting, survival, and hard action',
    keywords: ['action', 'heavy', 'hardcore', 'battle', 'war', 'punch', 'fight', 'racing', 'car', 'turbo', 'survival', 'zombie', 'blast', 'hard'],
  },
  {
    id: 'minimal',
    name: 'Modern Clean',
    fontFamily: 'Space Grotesk',
    fallback: 'sans-serif',
    googleFont: 'Space+Grotesk:wght@700',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap',
    icon: '✨',
    description: 'Crisp geometric typography for zen orbit, rhythm pulse, and minimal puzzles',
    keywords: ['orbit', 'pulse', 'minimal', 'clean', 'zen', 'relax', 'geometric', 'rhythm', 'puzzle', 'modern', 'planet', 'circle'],
  },
];

export const DEFAULT_FONT_VIBE = GAME_FONTS[0]; // Bouncy Cartoon

/**
 * Detects the best-fitting font vibe from prompt text and archetype
 */
export function detectFontVibe(prompt: string, archetype?: string): GameFontVibe {
  const lower = (prompt || '').toLowerCase();
  const arch = (archetype || '').toLowerCase();

  // 1. Check direct keywords in prompt
  for (const vibe of GAME_FONTS) {
    if (vibe.keywords.some((kw) => lower.includes(kw))) {
      return vibe;
    }
  }

  // 2. Fall back to archetype defaults
  if (arch === 'flappy') return GAME_FONTS.find((f) => f.id === 'retro') || DEFAULT_FONT_VIBE;
  if (arch === 'runner') return GAME_FONTS.find((f) => f.id === 'cyber') || DEFAULT_FONT_VIBE;
  if (arch === 'orbit') return GAME_FONTS.find((f) => f.id === 'minimal') || DEFAULT_FONT_VIBE;
  if (arch === 'stack') return GAME_FONTS.find((f) => f.id === 'cartoon') || DEFAULT_FONT_VIBE;

  return DEFAULT_FONT_VIBE;
}

/**
 * Extracts which known font vibe is currently used in the game HTML
 */
export function extractFontFromHtml(html: string): GameFontVibe {
  if (!html) return DEFAULT_FONT_VIBE;

  for (const vibe of GAME_FONTS) {
    if (html.includes(vibe.fontFamily) || html.includes(vibe.googleFont)) {
      return vibe;
    }
  }

  return DEFAULT_FONT_VIBE;
}

/**
 * Injects or replaces the typography in a game's HTML code:
 * - Updates Google Font stylesheet in <head>
 * - Updates CSS font-family
 * - Updates canvas ctx.font declarations
 */
export function injectOrReplaceFontInHtml(html: string, vibeOrId: string | GameFontVibe): string {
  if (!html) return html;

  const targetVibe = typeof vibeOrId === 'string'
    ? GAME_FONTS.find((f) => f.id === vibeOrId) || DEFAULT_FONT_VIBE
    : vibeOrId;

  let updated = html;

  // 1. Ensure Google Font <link> in <head>
  const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${targetVibe.cssUrl}" rel="stylesheet">`;

  // Remove any existing Google Font stylesheet links
  const existingLinkRegex = /<link[^>]*fonts\.googleapis\.com[^>]*>/gi;
  const existingGstaticRegex = /<link[^>]*fonts\.gstatic\.com[^>]*>/gi;
  updated = updated.replace(existingGstaticRegex, '');
  if (existingLinkRegex.test(updated)) {
    updated = updated.replace(existingLinkRegex, fontLink);
  } else if (updated.includes('</head>')) {
    updated = updated.replace('</head>', `  ${fontLink}\n</head>`);
  } else if (updated.includes('<head>')) {
    updated = updated.replace('<head>', `<head>\n  ${fontLink}`);
  }

  // 2. Update CSS font-family
  const targetFontCss = `'${targetVibe.fontFamily}', ${targetVibe.fallback}`;
  // Replace existing font-family in body or * or html
  updated = updated.replace(
    /(font-family\s*:\s*)([^;}]+)(;?)/gi,
    `$1${targetFontCss}$3`
  );

  // 3. Update canvas ctx.font definitions
  // Matches e.g.: ctx.font = 'bold 24px sans-serif' -> ctx.font = 'bold 24px "Fredoka", cursive, sans-serif'
  const canvasFontRegex = /(ctx\.font\s*=\s*['"])([^'"]+)(['"])/gi;
  updated = updated.replace(canvasFontRegex, (match, prefix, fontValue, suffix) => {
    // Extract size and weight (e.g. "bold 32px", "900 48px", "20px")
    const sizeMatch = fontValue.match(/(?:(?:bold|italic|normal|[1-9]00)\s+)*\d+(?:\.\d+)?(?:px|pt|em|rem)/i);
    const sizePart = sizeMatch ? sizeMatch[0] : '24px';
    return `${prefix}${sizePart} '${targetVibe.fontFamily}', ${targetVibe.fallback}${suffix}`;
  });

  return updated;
}
