// ============================================================
// AI Provider Factory — Creates the appropriate AI provider
// ============================================================

import type { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { MockAIProvider } from './mock-provider';

export type ProviderType = 'openai' | 'mock';

export function createAIProvider(type?: ProviderType): AIProvider {
  // Auto-detect: use OpenAI if API key is available, otherwise mock
  const providerType = type || (process.env.OPENAI_API_KEY ? 'openai' : 'mock');

  switch (providerType) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        console.warn('[AI Provider] No OPENAI_API_KEY found. Falling back to mock provider.');
        return new MockAIProvider();
      }
      return new OpenAIProvider();
    case 'mock':
      console.info('[AI Provider] Using mock provider for development.');
      return new MockAIProvider();
    default:
      throw new Error(`Unknown AI provider type: ${providerType}`);
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
