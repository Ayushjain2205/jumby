import { NextRequest, NextResponse } from 'next/server';
import { extractGameIntent } from '@/lib/ai/intent-analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, requestedArchetype, referenceImages, apiKey, provider } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const intent = await extractGameIntent({
      prompt,
      requestedArchetype,
      referenceImages,
      apiKey,
      provider,
    });

    return NextResponse.json({ intent });
  } catch (error: any) {
    console.error('[/api/ai/intent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Intent extraction failed' },
      { status: 500 }
    );
  }
}
