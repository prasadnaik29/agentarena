// ============================================================
// Arena API — Create arena and auto-build team
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { autoBuildTeam } from '@/lib/orchestration';
import { createAIProvider } from '@/lib/ai';
import type { ArenaConfig, LLMProviderType } from '@/types/arena';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      challenge,
      mode,
      agentCount,
      domain,
      constraints,
      teamCount,
      provider = 'mock',
      model,
      apiKey,
      baseUrl,
    } = body;

    if (!challenge || typeof challenge !== 'string' || challenge.trim().length < 10) {
      return NextResponse.json(
        { error: 'Challenge must be at least 10 characters.' },
        { status: 400 }
      );
    }

    const resolvedProvider: LLMProviderType = provider || 'mock';

    // Model resolution defaults per provider
    const defaultModels: Record<LLMProviderType, string> = {
      mock: 'mock-dynamic',
      openai: 'gpt-4o-mini',
      gemini: 'gemini-2.5-flash',
      claude: 'claude-3-5-sonnet-20241022',
      groq: 'llama-3.3-70b-versatile',
      openrouter: 'anthropic/claude-3.5-sonnet',
      deepseek: 'deepseek-chat',
      ollama: 'llama3',
    };

    const resolvedModel = model || defaultModels[resolvedProvider] || 'gpt-4o-mini';

    // Validate the API key by making a lightweight test call (skip for mock)
    if (resolvedProvider !== 'mock') {
      try {
        const testProvider = createAIProvider({
          provider: resolvedProvider,
          model: resolvedModel,
          apiKey: apiKey ? apiKey.trim() : undefined,
          baseUrl: baseUrl ? baseUrl.trim() : undefined,
        });

        // Quick validation call
        await testProvider.generate({
          model: resolvedModel,
          messages: [{ role: 'user', content: 'Ping: reply with OK' }],
          maxTokens: 5,
        });
      } catch (error) {
        const errMsg = (error as Error).message || 'Invalid credentials';
        return NextResponse.json(
          {
            error: `API key validation failed for ${resolvedProvider.toUpperCase()}: ${errMsg}. Please verify your API key, or switch to the Free Simulator.`,
          },
          { status: 401 }
        );
      }
    }

    const config: ArenaConfig = {
      challenge: challenge.trim(),
      mode: mode === 'competitive' ? 'competitive' : 'collaborative',
      agentCount: agentCount || undefined,
      domain: domain ? domain.trim() : undefined,
      constraints: constraints ? constraints.trim() : undefined,
      teamCount: mode === 'competitive' ? (teamCount || 3) : undefined,
      provider: resolvedProvider,
      model: resolvedModel,
      apiKey: apiKey ? apiKey.trim() : undefined,
      baseUrl: baseUrl ? baseUrl.trim() : undefined,
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
      { error: `Failed to create arena: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
