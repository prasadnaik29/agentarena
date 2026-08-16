// ============================================================
// AI Provider Factory — Creates the appropriate AI provider
// ============================================================

import type { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
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
  
  // Resolve provider type (explicit option > env auto-detection > fallback to mock)
  const providerType: LLMProviderType = opts.provider || (
    opts.apiKey ? 'openai' :
    process.env.GEMINI_API_KEY ? 'gemini' :
    process.env.OPENAI_API_KEY ? 'openai' :
    process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY ? 'claude' :
    process.env.GROQ_API_KEY ? 'groq' :
    process.env.OPENROUTER_API_KEY ? 'openrouter' :
    process.env.DEEPSEEK_API_KEY ? 'deepseek' :
    'mock'
  );

  const customKey = opts.apiKey?.trim();
  const customBaseUrl = opts.baseUrl?.trim();
  const customModel = opts.model?.trim();

  switch (providerType) {
    case 'gemini': {
      const gKey = customKey || process.env.GEMINI_API_KEY;
      const gUrl = customBaseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/';
      const gModel = customModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      if (gKey) {
        return new OpenAIProvider({
          apiKey: gKey,
          defaultModel: gModel,
          baseUrl: gUrl,
        });
      }
      return new MockAIProvider();
    }

    case 'openai': {
      const oKey = customKey || process.env.OPENAI_API_KEY;
      const oUrl = customBaseUrl || process.env.OPENAI_BASE_URL;
      const oModel = customModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
      if (oKey || oUrl) {
        return new OpenAIProvider({
          apiKey: oKey,
          defaultModel: oModel,
          baseUrl: oUrl,
        });
      }
      return new MockAIProvider();
    }

    case 'claude': {
      const cKey = customKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      const cUrl = customBaseUrl || process.env.ANTHROPIC_BASE_URL;
      const cModel = customModel || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
      if (cKey) {
        return new AnthropicProvider({
          apiKey: cKey,
          defaultModel: cModel,
          baseUrl: cUrl,
        });
      }
      return new MockAIProvider();
    }

    case 'groq': {
      const groqKey = customKey || process.env.GROQ_API_KEY;
      const groqUrl = customBaseUrl || process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
      const groqModel = customModel || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      if (groqKey || customBaseUrl) {
        return new OpenAIProvider({
          apiKey: groqKey,
          defaultModel: groqModel,
          baseUrl: groqUrl,
        });
      }
      return new MockAIProvider();
    }

    case 'openrouter': {
      const orKey = customKey || process.env.OPENROUTER_API_KEY;
      const orUrl = customBaseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const orModel = customModel || process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
      if (orKey || customBaseUrl) {
        return new OpenAIProvider({
          apiKey: orKey,
          defaultModel: orModel,
          baseUrl: orUrl,
        });
      }
      return new MockAIProvider();
    }

    case 'deepseek': {
      const dsKey = customKey || process.env.DEEPSEEK_API_KEY;
      const dsUrl = customBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
      const dsModel = customModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      if (dsKey || customBaseUrl) {
        return new OpenAIProvider({
          apiKey: dsKey,
          defaultModel: dsModel,
          baseUrl: dsUrl,
        });
      }
      return new MockAIProvider();
    }

    case 'ollama': {
      const olUrl = customBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
      const olModel = customModel || process.env.OLLAMA_MODEL || 'llama3';
      return new OpenAIProvider({
        apiKey: customKey || 'ollama',
        defaultModel: olModel,
        baseUrl: olUrl,
      });
    }

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
