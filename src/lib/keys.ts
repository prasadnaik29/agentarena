// ============================================================
// API Key Management & Local Storage Persistence
// ============================================================

import type { LLMProviderType } from '@/types/arena';

const STORAGE_PREFIX = 'agent_arena_key_';
const BASE_URL_PREFIX = 'agent_arena_base_url_';
const MODEL_PREFIX = 'agent_arena_model_';

export function getSavedKey(provider: LLMProviderType): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${provider}`) || '';
  } catch {
    return '';
  }
}

export function saveKey(provider: LLMProviderType, key: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (key.trim()) {
      localStorage.setItem(`${STORAGE_PREFIX}${provider}`, key.trim());
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}${provider}`);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getSavedBaseUrl(provider: LLMProviderType): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(`${BASE_URL_PREFIX}${provider}`) || '';
  } catch {
    return '';
  }
}

export function saveBaseUrl(provider: LLMProviderType, url: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (url.trim()) {
      localStorage.setItem(`${BASE_URL_PREFIX}${provider}`, url.trim());
    } else {
      localStorage.removeItem(`${BASE_URL_PREFIX}${provider}`);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getSavedModel(provider: LLMProviderType): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(`${MODEL_PREFIX}${provider}`) || '';
  } catch {
    return '';
  }
}

export function saveModel(provider: LLMProviderType, model: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (model.trim()) {
      localStorage.setItem(`${MODEL_PREFIX}${provider}`, model.trim());
    } else {
      localStorage.removeItem(`${MODEL_PREFIX}${provider}`);
    }
  } catch {
    // Ignore storage errors
  }
}

export interface KeyValidationResult {
  valid: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}

export async function validateApiKey(params: {
  provider: LLMProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<KeyValidationResult> {
  try {
    const res = await fetch('/api/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.valid) {
      return {
        valid: false,
        error: data.error || 'Validation failed. Check your API key.',
      };
    }

    return {
      valid: true,
      provider: data.provider,
      model: data.model,
      latencyMs: data.latencyMs,
      message: data.message,
    };
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message || 'Network error during key validation',
    };
  }
}
