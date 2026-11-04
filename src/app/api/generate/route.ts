import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/ai/runtime-contract';
import { synthesizeProceduralGame } from '@/lib/ai/smart-generator';
import { validateAndHealGameHtml } from '@/lib/ai/game-healer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      baseCode,
      archetype = 'flappy',
      apiKey: clientApiKey,
      provider = 'auto',
      targetDevice = 'mobile',
      referenceImages = [],
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const cliProxyUrl = process.env.CLI_PROXY_URL || 'http://127.0.0.1:8317';
    const cliProxyKey = process.env.CLI_PROXY_KEY || '123456';
    const cliProxyModel = process.env.CLI_PROXY_MODEL || 'gemini-3-flash';

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY;
    const openaiKey = clientApiKey || process.env.OPENAI_API_KEY;

    // If the user is remixing an existing game, pass that code so the AI can modify it.
    // If creating from scratch, pass undefined so the AI has full freedom to pick the right mechanic and palette.
    const isRemix = Boolean(baseCode && baseCode.trim().length > 50);
    const effectiveBaseCode = isRemix ? baseCode : undefined;

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
          referenceImages
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
      return streamFromGemini(geminiKey, prompt, archetype, effectiveBaseCode, targetDevice, referenceImages);
    } else if (useOpenAI && openaiKey) {
      return streamFromOpenAI(openaiKey, prompt, archetype, effectiveBaseCode, targetDevice, referenceImages);
    }

    // 3. Fallback: High-fidelity procedural dynamic generation with SSE streaming
    return streamProceduralGame(prompt, archetype, baseCode);
  } catch (error: any) {
    console.error('[/api/generate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

/**
 * Stream game generation from local CLI Proxy API (CPA) using OpenAI-compatible SSE format
 */
async function streamFromCliProxy(
  proxyUrl: string,
  proxyKey: string,
  model: string,
  prompt: string,
  archetype?: string,
  baseCode?: string,
  targetDevice?: 'mobile' | 'desktop' | 'responsive',
  referenceImages?: { name: string; dataUrl?: string }[]
): Promise<Response | null> {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode, targetDevice, referenceImages });
  const endpoint = `${proxyUrl.replace(/\/+$/, '')}/v1/chat/completions`;

  const controller = new AbortController();
  // 5 second timeout to establish connection to local proxy
  const connectTimeout = setTimeout(() => controller.abort(), 6000);

  let response: globalThis.Response;
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

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`[CLI Proxy] Non-200 response (${response.status}):`, errText);
    return null;
  }

  if (!response.body) {
    return null;
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  const transformStream = new TransformStream({
    start(streamController) {
      // Send initial progress indicators to the studio UI
      streamController.enqueue(
        encoder.encode(`data: ${JSON.stringify({ step: `🤖 Connecting to ${model} via CLI Proxy...` })}\n\n`)
      );
      streamController.enqueue(
        encoder.encode(`data: ${JSON.stringify({ step: '⚡ Synthesizing micro-game logic & juice...' })}\n\n`)
      );
    },
    transform(chunk, streamController) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      // Keep last potentially incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            const healed = validateAndHealGameHtml(accumulated, { prompt, archetype });
            streamController.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, fullHtml: healed.html, issuesFixed: healed.issuesFixed })}\n\n`
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
            // Partial or malformed JSON chunk, ignore
          }
        }
      }
    },
    flush(streamController) {
      const healed = validateAndHealGameHtml(accumulated, { prompt, archetype });
      streamController.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ done: true, fullHtml: healed.html, issuesFixed: healed.issuesFixed })}\n\n`
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

/**
 * Procedural Dynamic Streamer: Breaks generated game code into realistic chunks
 * and streams over SSE with progressive status milestones.
 */
function streamProceduralGame(prompt: string, archetype: any, baseCode?: string) {
  const encoder = new TextEncoder();
  const fullHtml = synthesizeProceduralGame({ prompt, archetype, baseCode });

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, any>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 1. Simulation milestones
      sendEvent({ step: '🧠 Interpreting micro-game mechanics & physics...' });
      await sleep(150);

      sendEvent({ step: '🎨 Synthesizing procedural canvas shaders & neon glow...' });
      await sleep(200);

      sendEvent({ step: '🔊 Composing 8-bit synthesizer audio & juice...' });
      await sleep(150);

      // 2. Stream code in progressive chunks
      const chunkSize = 160;
      for (let i = 0; i < fullHtml.length; i += chunkSize) {
        const chunk = fullHtml.slice(i, i + chunkSize);
        sendEvent({ chunk });
        await sleep(20);
      }

      // 3. Finish
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

/**
 * Live Google Gemini 2.5 Flash Streaming
 */
async function streamFromGemini(
  apiKey: string,
  prompt: string,
  archetype?: string,
  baseCode?: string,
  targetDevice?: 'mobile' | 'desktop' | 'responsive',
  referenceImages?: { name: string; dataUrl?: string }[]
) {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode, targetDevice, referenceImages });
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

  if (!response.ok) {
    const errText = await response.text();
    console.warn('[Gemini] Fallback due to error:', response.status, errText);
    return streamProceduralGame(prompt, archetype, baseCode);
  }

  const encoder = new TextEncoder();
  let accumulated = '';

  const transformStream = new TransformStream({
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
          } catch (e) {
            // ignore malformed SSE line
          }
        }
      }
    },
    flush(controller) {
      const healed = validateAndHealGameHtml(accumulated, { prompt, archetype });
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ done: true, fullHtml: healed.html, issuesFixed: healed.issuesFixed })}\n\n`
        )
      );
    },
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Live OpenAI GPT-4o / GPT-4o-mini Streaming
 */
async function streamFromOpenAI(
  apiKey: string,
  prompt: string,
  archetype?: string,
  baseCode?: string,
  targetDevice?: 'mobile' | 'desktop' | 'responsive',
  referenceImages?: { name: string; dataUrl?: string }[]
) {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode, targetDevice, referenceImages });
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.warn('[OpenAI] Fallback due to error:', response.status, err);
    return streamProceduralGame(prompt, archetype, baseCode);
  }

  const encoder = new TextEncoder();
  let accumulated = '';

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.substring(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`)
              );
            }
          } catch (e) {}
        }
      }
    },
    flush(controller) {
      const healed = validateAndHealGameHtml(accumulated, { prompt, archetype });
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ done: true, fullHtml: healed.html, issuesFixed: healed.issuesFixed })}\n\n`
        )
      );
    },
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
