import { NextRequest, NextResponse } from 'next/server';

const REPAIR_SYSTEM_PROMPT = `You are the Lead JavaScript & Canvas2D Game Debugger for "Jumby".
A generated HTML5 canvas game encountered a runtime script error during execution.

YOUR OBJECTIVE:
1. Identify the exact line or logic causing the error.
2. Surgically fix the error while PRESERVING all game mechanics, entity structures, and visual styles.
3. Common bugs to check and fix:
   - ReferenceError (variable used before definition or typo in name)
   - TypeError (calling undefined as function, reading property of null/undefined)
   - Missing canvas context or unhandled NaN in coordinates
   - Unclosed brackets or syntax errors
   - Missing Jumby calls (keep window.Jumby.ready(), sound, input, fx, etc.)
4. OUTPUT FORMAT:
   Return ONLY the complete, working, bug-free HTML file starting with '<!DOCTYPE html>' and ending with '</html>'.
   Do NOT output markdown code fences, do NOT output explanations before or after the code.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, error, prompt } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const errorMessage = error?.message || 'Unknown runtime error';
    const errorLine = error?.line ? `at line ${error.line}` : '';
    const errorDetail = `${errorMessage} ${errorLine}`.trim();

    const cliProxyUrl = process.env.CLI_PROXY_URL || 'http://127.0.0.1:8317';
    const cliProxyKey = process.env.CLI_PROXY_KEY || '123456';
    const cliProxyModel = process.env.CLI_PROXY_MODEL || 'gemini-3-flash';

    const userPrompt = `The following HTML5 game crashed with runtime error:
"${errorDetail}"

User's original concept: "${prompt || 'Arcade game'}"

CRASHED CODE:
${code}

Fix the bug and return the complete, corrected, playable HTML.`;

    // 1. Try local CLI Proxy (Ultra-fast Gemini Flash reflection)
    if (cliProxyUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${cliProxyUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cliProxyKey}`,
          },
          body: JSON.stringify({
            model: cliProxyModel,
            messages: [
              { role: 'system', content: REPAIR_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 4000,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          let repairedCode = data.choices?.[0]?.message?.content?.trim();
          if (repairedCode) {
            // Strip any accidental markdown fences
            const match = repairedCode.match(/```(?:html)?\s*\n?([\s\S]*?)(\n?```|$)/i);
            if (match && match[1]) repairedCode = match[1].trim();

            if (repairedCode.includes('<!DOCTYPE html') || repairedCode.includes('<canvas')) {
              return NextResponse.json({
                success: true,
                repairedHtml: repairedCode,
                fixedError: errorDetail,
              });
            }
          }
        }
      } catch (proxyErr) {
        console.warn('[/api/heal] CLI proxy reflection failed:', proxyErr);
      }
    }

    // 2. Fallback to Gemini API if key exists in env
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${REPAIR_SYSTEM_PROMPT}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4000,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let repairedCode = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (repairedCode) {
            const match = repairedCode.match(/```(?:html)?\s*\n?([\s\S]*?)(\n?```|$)/i);
            if (match && match[1]) repairedCode = match[1].trim();

            if (repairedCode.includes('<!DOCTYPE html') || repairedCode.includes('<canvas')) {
              return NextResponse.json({
                success: true,
                repairedHtml: repairedCode,
                fixedError: errorDetail,
              });
            }
          }
        }
      } catch (geminiErr) {
        console.warn('[/api/heal] Gemini reflection failed:', geminiErr);
      }
    }

    // 3. Fallback: Heuristic regex repair
    let heuristicCode = code;
    // Fix unclosed tags
    if (!heuristicCode.includes('</html>')) heuristicCode += '\n</html>';
    if (!heuristicCode.includes('</script>') && heuristicCode.includes('<script>')) heuristicCode += '\n</script>';
    // Ensure runtime is injected
    if (!heuristicCode.includes('jumby-runtime.js')) {
      heuristicCode = heuristicCode.replace('<head>', '<head>\n<script src="/jumby-runtime.js"></script>');
    }

    return NextResponse.json({
      success: true,
      repairedHtml: heuristicCode,
      fixedError: errorDetail,
      heuristic: true,
    });
  } catch (err: any) {
    console.error('[/api/heal] Uncaught error:', err);
    return NextResponse.json(
      { error: err.message || 'Heal failed' },
      { status: 500 }
    );
  }
}
