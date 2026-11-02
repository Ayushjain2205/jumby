import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt, extractGameHtml } from '@/lib/ai/runtime-contract';
import { synthesizeProceduralGame } from '@/lib/ai/smart-generator';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      baseCode,
      archetype = 'flappy',
      apiKey: clientApiKey,
      provider = 'auto',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const geminiKey = clientApiKey || process.env.GEMINI_API_KEY;
    const openaiKey = clientApiKey || process.env.OPENAI_API_KEY;

    const useGemini = provider === 'gemini' || (!provider || provider === 'auto') && geminiKey;
    const useOpenAI = provider === 'openai' || (!provider || provider === 'auto') && openaiKey && !geminiKey;

    // Check if live external LLM can be used
    if (useGemini && geminiKey) {
      return streamFromGemini(geminiKey, prompt, archetype, baseCode);
    } else if (useOpenAI && openaiKey) {
      return streamFromOpenAI(openaiKey, prompt, archetype, baseCode);
    }

    // Default: High-fidelity procedural dynamic generation with SSE streaming
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
async function streamFromGemini(apiKey: string, prompt: string, archetype?: string, baseCode?: string) {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode });
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
      const finalHtml = extractGameHtml(accumulated);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true, fullHtml: finalHtml })}\n\n`)
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
async function streamFromOpenAI(apiKey: string, prompt: string, archetype?: string, baseCode?: string) {
  const systemPrompt = buildSystemPrompt({ archetype, baseCode });
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
      const finalHtml = extractGameHtml(accumulated);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true, fullHtml: finalHtml })}\n\n`)
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
