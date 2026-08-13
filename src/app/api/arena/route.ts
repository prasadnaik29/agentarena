// ============================================================
// Arena API — Create arena and auto-build team
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { autoBuildTeam } from '@/lib/orchestration';
import { createAIProvider } from '@/lib/ai';
import type { ArenaConfig } from '@/types/arena';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challenge, mode, agentCount, domain, constraints, teamCount, provider, model, apiKey, baseUrl } = body;

    if (!challenge || typeof challenge !== 'string' || challenge.trim().length < 10) {
      return NextResponse.json(
        { error: 'Challenge must be at least 10 characters.' },
        { status: 400 }
      );
    }

    // Resolve the actual provider (auto-detect from env if not specified)
    const resolvedProvider = provider || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'mock');
    const resolvedModel = model || (resolvedProvider === 'gemini' ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash') : resolvedProvider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : 'mock-dynamic');

    // Validate the API key by making a lightweight test call (skip for mock)
    if (resolvedProvider !== 'mock') {
      try {
        const testProvider = createAIProvider({
          provider: resolvedProvider,
          model: resolvedModel,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
        });

        // Quick validation — a minimal generate call to confirm the key works
        await testProvider.generate({
          model: resolvedModel,
          messages: [{ role: 'user', content: 'Respond with OK' }],
          maxTokens: 5,
        });
      } catch (error) {
        const errMsg = (error as Error).message || 'Unknown error';
        return NextResponse.json(
          { error: `API key validation failed for ${resolvedProvider}: ${errMsg}. Please check your API key and try again.` },
          { status: 401 }
        );
      }
    }

    const config: ArenaConfig = {
      challenge: challenge.trim(),
      mode: mode === 'competitive' ? 'competitive' : 'collaborative',
      agentCount: agentCount || undefined,
      domain: domain || undefined,
      constraints: constraints || undefined,
      teamCount: mode === 'competitive' ? (teamCount || 3) : undefined,
      provider: resolvedProvider,
      model: resolvedModel,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
    };

    // Auto-build the agent team with the correct model
    const agents = autoBuildTeam(config.challenge, config.mode, config.agentCount, resolvedModel);

    return NextResponse.json({
      config,
      agents,
    });
  } catch (error) {
    console.error('[Arena API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create arena.' },
      { status: 500 }
    );
  }
}
