// ============================================================
// Config API — Returns detected provider based on env vars
// ============================================================

import { NextResponse } from 'next/server';

export async function GET() {
  let detectedProvider = 'mock';
  let detectedModel = 'mock-dynamic';

  if (process.env.GEMINI_API_KEY) {
    detectedProvider = 'gemini';
    detectedModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  } else if (process.env.OPENAI_API_KEY) {
    detectedProvider = 'openai';
    detectedModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  return NextResponse.json({
    defaultProvider: detectedProvider,
    defaultModel: detectedModel,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });
}
