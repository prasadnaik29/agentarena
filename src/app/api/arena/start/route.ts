// ============================================================
// Arena Start API — SSE endpoint for live arena execution
// ============================================================

import { NextRequest } from 'next/server';
import { ArenaEngine } from '@/lib/orchestration';
import { createAIProvider } from '@/lib/ai';
import type { ArenaConfig } from '@/types/arena';
import type { AgentConfig } from '@/types/agent';
import type { ArenaEvent } from '@/types/events';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, agents } = body as { config: ArenaConfig; agents: AgentConfig[] };

    if (!config || !agents || !Array.isArray(agents) || agents.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid arena configuration' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: ArenaEvent) => {
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {
            // Stream may have been closed
          }
        };

        try {
          const provider = createAIProvider({
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
          });

          const engine = new ArenaEngine({
            config,
            agents,
            onEvent: sendEvent,
            provider,
          });

          const result = await engine.run();

          // Send the final result as a special event
          const resultData = `data: ${JSON.stringify({ type: 'ARENA_RESULT', result })}\n\n`;
          controller.enqueue(encoder.encode(resultData));
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ 
            type: 'ARENA_ERROR', 
            error: (error as Error).message,
            recoverable: false 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to start arena' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
