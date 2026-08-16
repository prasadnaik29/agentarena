// ============================================================
// Validate Key API — Tests provider credentials and measures latency
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';
import type { LLMProviderType } from '@/types/arena';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, baseUrl, model } = body as {
      provider: LLMProviderType;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
    };

    if (!provider || provider === 'mock') {
      return NextResponse.json({
        valid: true,
        provider: 'mock',
        model: 'mock-dynamic',
        latencyMs: 15,
        message: 'Free Simulator ready (no API key required).',
      });
    }

    const testProvider = createAIProvider({
      provider,
      apiKey: apiKey?.trim() || undefined,
      baseUrl: baseUrl?.trim() || undefined,
      model: model?.trim() || undefined,
    });

    const startTime = Date.now();
    const result = await testProvider.generate({
      model: model?.trim() || undefined,
      messages: [{ role: 'user', content: 'Ping: respond with "PONG"' }],
      maxTokens: 10,
    });
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      valid: true,
      provider,
      model: result.model || model,
      latencyMs,
      message: `Connection successful (${latencyMs}ms)`,
      preview: result.content.trim(),
    });
  } catch (error) {
    const message = (error as Error).message || 'Validation failed';
    return NextResponse.json(
      {
        valid: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
