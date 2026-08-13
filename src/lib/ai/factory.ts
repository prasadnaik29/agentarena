// ============================================================
// AI Provider Factory — Creates the appropriate AI provider
// ============================================================

import type { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { MockAIProvider } from './mock-provider';

import type { LLMProviderType } from '@/types/arena';

export interface CreateAIProviderOptions {
  provider?: LLMProviderType;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export function createAIProvider(options?: CreateAIProviderOptions | LLMProviderType): AIProvider {
  const opts: CreateAIProviderOptions = typeof options === 'string' ? { provider: options } : options || {};
  const providerType = opts.provider || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'mock');

  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  const baseUrl = opts.baseUrl || process.env.OPENAI_BASE_URL;
  const model = opts.model || process.env.OPENAI_MODEL;

  switch (providerType) {
    case 'gemini':
      const gKey = opts.apiKey || process.env.GEMINI_API_KEY || apiKey;
      const gUrl = opts.baseUrl || process.env.GEMINI_BASE_URL || baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/';
      const gModel = opts.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      if (gKey) {
        return new OpenAIProvider({
          apiKey: gKey,
          defaultModel: gModel,
          baseUrl: gUrl,
        });
      }
      return new MockAIProvider();

    case 'openai':
      return new OpenAIProvider({
        apiKey,
        defaultModel: model,
        baseUrl,
      });

    case 'claude':
    case 'ollama':
      // Connect using custom endpoint / API key or fallback to OpenAI/Mock
      if (apiKey || baseUrl) {
        return new OpenAIProvider({
          apiKey,
          defaultModel: model,
          baseUrl,
        });
      }
      return new MockAIProvider();

    case 'mock':
    default:
      return new MockAIProvider();
  }
}

// Singleton instance
let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_provider) {
    _provider = createAIProvider();
  }
  return _provider;
}

export function resetAIProvider(): void {
  _provider = null;
}
