// ============================================================
// Config API — Returns detected providers based on env vars
// ============================================================

import { NextResponse } from 'next/server';

export async function GET() {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 5);
  const hasClaudeKey = !!((process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) && (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)!.length > 5);
  const hasGroqKey = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 5);
  const hasOpenRouterKey = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 5);
  const hasDeepSeekKey = !!(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 5);

  let defaultProvider = 'mock';
  let defaultModel = 'mock-dynamic';

  // Prefer configured server keys if available
  if (hasOpenAIKey) {
    defaultProvider = 'openai';
    defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  } else if (hasGeminiKey) {
    defaultProvider = 'gemini';
    defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  } else if (hasClaudeKey) {
    defaultProvider = 'claude';
    defaultModel = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  } else if (hasGroqKey) {
    defaultProvider = 'groq';
    defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  } else if (hasOpenRouterKey) {
    defaultProvider = 'openrouter';
    defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  } else if (hasDeepSeekKey) {
    defaultProvider = 'deepseek';
    defaultModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  return NextResponse.json({
    defaultProvider,
    defaultModel,
    serverKeys: {
      gemini: hasGeminiKey,
      openai: hasOpenAIKey,
      claude: hasClaudeKey,
      groq: hasGroqKey,
      openrouter: hasOpenRouterKey,
      deepseek: hasDeepSeekKey,
    },
  });
}
