// ============================================================
// Arena API — Create arena and auto-build team
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { autoBuildTeam } from '@/lib/orchestration';
import type { ArenaConfig } from '@/types/arena';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challenge, mode, agentCount, domain, constraints, teamCount } = body;

    if (!challenge || typeof challenge !== 'string' || challenge.trim().length < 10) {
      return NextResponse.json(
        { error: 'Challenge must be at least 10 characters.' },
        { status: 400 }
      );
    }

    const config: ArenaConfig = {
      challenge: challenge.trim(),
      mode: mode === 'competitive' ? 'competitive' : 'collaborative',
      agentCount: agentCount || undefined,
      domain: domain || undefined,
      constraints: constraints || undefined,
      teamCount: mode === 'competitive' ? (teamCount || 3) : undefined,
    };

    // Auto-build the agent team
    const agents = autoBuildTeam(config.challenge, config.mode, config.agentCount);

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
