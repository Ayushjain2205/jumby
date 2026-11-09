import { Hono } from 'hono';
import { CloudflareEnv, AppVariables } from '../types';
import { buildSystemPrompt } from '@/lib/ai/runtime-contract';
import { synthesizeProceduralGame } from '@/lib/ai/smart-generator';
import { validateAndHealGameHtml } from '@/lib/ai/game-healer';
import { extractGameIntent, type GameIntent } from '@/lib/ai/intent-analyzer';

export const generateRouter = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

generateRouter.post('/', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const {
      prompt,
      baseCode,
      archetype: requestedArchetype,
      apiKey: clientApiKey,
      provider = 'auto',
      targetDevice = 'mobile',
      referenceImages = [],
      isEdit,
      currentTitle,
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const cliProxyUrl = (typeof process !== 'undefined' && process.env?.CLI_PROXY_URL) || 'http://127.0.0.1:8317';
    const cliProxyKey = (typeof process !== 'undefined' && process.env?.CLI_PROXY_KEY) || '123456';
    const cliProxyModel = (typeof process !== 'undefined' && process.env?.CLI_PROXY_MODEL) || 'gemini-3-flash';

    const geminiKey = clientApiKey || c.env.GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
    const openaiKey = clientApiKey || c.env.OPENAI_API_KEY || (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY);

    // Detect if this is an in-place edit on existing code
    const isEditing = Boolean((baseCode && baseCode.trim().length > 50) || isEdit);
    const effectiveBaseCode = isEditing && baseCode ? baseCode : undefined;

    // Preserve existing archetype in edit mode by inspecting baseCode if needed
    let effectiveArchetype = requestedArchetype;
    if (isEditing && (!effectiveArchetype || effectiveArchetype === 'custom' || effectiveArchetype === 'flappy')) {
      effectiveArchetype = detectArchetypeFromCode(baseCode || '') || requestedArchetype || 'custom';
    }

    // Intelligent AI Intent & Architectural Blueprint Extraction
    const intent = await extractGameIntent({
      prompt,
      requestedArchetype: effectiveArchetype,
      referenceImages,
      apiKey: clientApiKey,
      provider,
      isEdit: isEditing,
      currentTitle,
    });

    const archetype = isEditing && effectiveArchetype && effectiveArchetype !== 'custom'
      ? effectiveArchetype
      : (intent.archetype || requestedArchetype || 'flappy');

    // 1. Try Local CLI Proxy API if requested or in auto mode
    const tryProxy = provider === 'proxy' || provider === 'cliproxy' || provider === 'auto';
    if (tryProxy && cliProxyUrl) {
      try {
        const proxyStream = await streamFromCliProxy(
          cliProxyUrl,
          cliProxyKey,
          cliProxyModel,
          prompt,
          archetype,
          effectiveBaseCode,
          targetDevice,
          referenceImages,
          intent
        );
        if (proxyStream) {
          return proxyStream;
        }
      } catch (err) {
        console.warn('[/api/generate] CLI Proxy attempt failed, falling back:', err);
      }
    }

    // 2. Fall back to external Gemini / OpenAI if keys provided
    const useGemini = provider === 'gemini' || (provider === 'auto' && geminiKey);
    const useOpenAI = provider === 'openai' || (provider === 'auto' && openaiKey && !geminiKey);

    if (useGemini && geminiKey) {
      return streamFromGemini(geminiKey, prompt, archetype, effectiveBaseCode, targetDevice, referenceImages, intent);
    } else if (useOpenAI && openaiKey) {
      return streamFromOpenAI(openaiKey, prompt, archetype, effectiveBaseCode, targetDevice, referenceImages, intent);
    }

    // 3. Fallback: High-fidelity procedural dynamic generation with SSE streaming
    return streamProceduralGame(prompt, archetype, baseCode, intent);
  } catch (error: any) {
    console.error('[/api/generate] Error:', error);
    return c.json({ error: error.message || 'Generation failed' }, 500);
  }
});

async function streamFromCliProxy(
  proxyUrl: string,
  proxyKey: string,
  model: string,
  prompt: string,
  archetype?: string,
  baseCode?: string,
  targetDevice?: 'mobile' | 'desktop' | 'responsive',
  referenceImages?: { name: string; dataUrl?: string }[],
  intent?: GameIntent
): Promise<Response | null> {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode, targetDevice, referenceImages, intent });
  const endpoint = `${proxyUrl.replace(/\/+$/, '')}/v1/chat/completions`;

  const controller = new AbortController();
  const connectTimeout = setTimeout(() => controller.abort(), 6000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proxyKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(connectTimeout);
    console.warn(`[CLI Proxy] Connection failed at ${endpoint}:`, err);
    return null;
  }
  clearTimeout(connectTimeout);

  if (!response.ok || !response.body) {
    return null;
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  const transformStream = new TransformStream({
    start(streamController) {
      if (intent) {
        const stepMsg = baseCode
          ? `🎨 Applying "${intent.theme}" updates to "${intent.title}"...`
          : `🧠 Dreaming up "${intent.title}" (${intent.theme})...`;
        streamController.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step: stepMsg, intent })}\n\n`)
        );
      } else {
        streamController.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step: baseCode ? `🎨 Updating game elements...` : `⚡ Cooking up your game concept...` })}\n\n`)
        );
      }
      streamController.enqueue(
        encoder.encode(`data: ${JSON.stringify({ step: `🎮 Building gameplay, visuals & juicy sounds...` })}\n\n`)
      );
    },
    transform(chunk, streamController) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            const healed = validateAndHealGameHtml(accumulated, { prompt, archetype, fallbackOnAstError: true });
            streamController.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  fullHtml: healed.html,
                  issuesFixed: healed.issuesFixed,
                  astValidation: healed.astValidation,
                  isPlayable: healed.isPlayable,
                })}\n\n`
              )
            );
            try {
              streamController.terminate();
            } catch {}
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              streamController.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`)
              );
            }
          } catch {
            // Partial JSON
          }
        }
      }
    },
    flush(streamController) {
      const healed = validateAndHealGameHtml(accumulated, { prompt, archetype, fallbackOnAstError: true });
      streamController.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            done: true,
            fullHtml: healed.html,
            issuesFixed: healed.issuesFixed,
            astValidation: healed.astValidation,
            isPlayable: healed.isPlayable,
          })}\n\n`
        )
      );
    },
  });

  return new Response(response.body.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function streamProceduralGame(prompt: string, archetype: any, baseCode?: string, intent?: GameIntent) {
  const encoder = new TextEncoder();
  const fullHtml = synthesizeProceduralGame({ prompt, archetype, baseCode });

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, any>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      if (intent) {
        const stepMsg = baseCode
          ? `🎨 Applying "${intent.theme}" updates to "${intent.title}"...`
          : `🧠 AI Intent: "${intent.title}" (${intent.theme})`;
        sendEvent({ step: stepMsg, intent });
        await sleep(150);
      } else {
        sendEvent({ step: '🧠 Interpreting micro-game mechanics & physics...' });
        await sleep(150);
      }

      sendEvent({ step: '🎨 Synthesizing procedural canvas shaders & neon glow...' });
      await sleep(200);

      sendEvent({ step: '🔊 Composing 8-bit synthesizer audio & juice...' });
      await sleep(150);

      const chunkSize = 160;
      for (let i = 0; i < fullHtml.length; i += chunkSize) {
        const chunk = fullHtml.slice(i, i + chunkSize);
        sendEvent({ chunk });
        await sleep(20);
      }

      sendEvent({ done: true, fullHtml });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

async function streamFromGemini(
  apiKey: string,
  prompt: string,
  archetype?: string,
  baseCode?: string,
  targetDevice?: 'mobile' | 'desktop' | 'responsive',
  referenceImages?: { name: string; dataUrl?: string }[],
  intent?: GameIntent
) {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode, targetDevice, referenceImages, intent });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const geminiPayload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiPayload),
  });

  if (!response.ok || !response.body) {
    return streamProceduralGame(prompt, archetype, baseCode, intent);
  }

  const encoder = new TextEncoder();
  let accumulated = '';

  const transformStream = new TransformStream({
    start(controller) {
      if (intent) {
        const stepMsg = baseCode
          ? `🎨 Applying "${intent.theme}" updates to "${intent.title}"...`
          : `🧠 AI Intent: "${intent.title}" (${intent.theme})`;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step: stepMsg, intent })}\n\n`)
        );
      }
    },
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            const candidate = data.candidates?.[0];
            const contentChunk = candidate?.content?.parts?.[0]?.text;
            if (contentChunk) {
              accumulated += contentChunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: contentChunk })}\n\n`)
              );
            }
          } catch {
            // Ignore
          }
        }
      }
    },
    flush(controller) {
      const healed = validateAndHealGameHtml(accumulated, { prompt, archetype, fallbackOnAstError: true });
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            done: true,
            fullHtml: healed.html,
            issuesFixed: healed.issuesFixed,
            astValidation: healed.astValidation,
            isPlayable: healed.isPlayable,
          })}\n\n`
        )
      );
    },
  });

  return new Response(response.body.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

async function streamFromOpenAI(
  apiKey: string,
  prompt: string,
  archetype?: string,
  baseCode?: string,
  targetDevice?: 'mobile' | 'desktop' | 'responsive',
  referenceImages?: { name: string; dataUrl?: string }[],
  intent?: GameIntent
) {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode, targetDevice, referenceImages, intent });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok || !response.body) {
    return streamProceduralGame(prompt, archetype, baseCode, intent);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  const transformStream = new TransformStream({
    start(controller) {
      if (intent) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step: `🧠 AI Intent: "${intent.title}" (${intent.theme})`, intent })}\n\n`)
        );
      }
    },
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            const healed = validateAndHealGameHtml(accumulated, { prompt, archetype, fallbackOnAstError: true });
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  fullHtml: healed.html,
                  issuesFixed: healed.issuesFixed,
                  astValidation: healed.astValidation,
                  isPlayable: healed.isPlayable,
                })}\n\n`
              )
            );
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`));
            }
          } catch {
            // Ignore
          }
        }
      }
    },
    flush(controller) {
      const healed = validateAndHealGameHtml(accumulated, { prompt, archetype, fallbackOnAstError: true });
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            done: true,
            fullHtml: healed.html,
            issuesFixed: healed.issuesFixed,
            astValidation: healed.astValidation,
            isPlayable: healed.isPlayable,
          })}\n\n`
        )
      );
    },
  });

  return new Response(response.body.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function detectArchetypeFromCode(code: string): string | undefined {
  const lower = code.toLowerCase();
  if (lower.includes('player.hp') || lower.includes('enemy') && lower.includes('weapon') || lower.includes('xp') || lower.includes('camera.follow') || lower.includes('survivor') || lower.includes('bullet hell')) {
    return 'survivors_arena';
  }
  if (lower.includes('card') && (lower.includes('deck') || lower.includes('player_turn') || lower.includes('hand'))) {
    return 'card_strategy';
  }
  if (lower.includes('stack') || lower.includes('slice') || lower.includes('tower')) {
    return 'stack';
  }
  if (lower.includes('runner') || lower.includes('lane') || lower.includes('subway') || lower.includes('dash')) {
    return 'runner';
  }
  if (lower.includes('pipe') || lower.includes('flap') || lower.includes('bird')) {
    return 'flappy';
  }
  if (lower.includes('breakout') || lower.includes('paddle') || lower.includes('brick')) {
    return 'breakout';
  }
  if (lower.includes('orbit') || lower.includes('solar') || lower.includes('gravity')) {
    return 'orbit';
  }
  if (lower.includes('invader') || lower.includes('laser') || lower.includes('shoot')) {
    return 'shooter';
  }
  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
