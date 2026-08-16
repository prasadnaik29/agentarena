// ============================================================
// OpenAI-Compatible Provider — Handles OpenAI, Gemini, Groq, OpenRouter, DeepSeek, Ollama, etc.
// ============================================================

import OpenAI from 'openai';
import type { AIProvider, AIGenerateOptions, AIStreamOptions, AIStructuredOptions, AIGenerateResult } from './provider';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 600;

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private defaultModel: string;
  private isGemini: boolean;
  private isReasoningModel: boolean;

  constructor(options?: string | { apiKey?: string; defaultModel?: string; baseUrl?: string }) {
    const apiKey = typeof options === 'string' ? options : options?.apiKey || process.env.OPENAI_API_KEY;
    const baseURL = (typeof options === 'object' ? options?.baseUrl : undefined) || process.env.OPENAI_BASE_URL || undefined;
    this.defaultModel = (typeof options === 'object' ? options?.defaultModel : undefined) || process.env.OPENAI_MODEL || DEFAULT_MODEL;
    
    this.isGemini = !!(baseURL && baseURL.includes('googleapis.com'));
    this.isReasoningModel = this.defaultModel.startsWith('o1') || this.defaultModel.startsWith('o3');

    // Clean up baseUrl (strip trailing slash if needed, but ensure valid url)
    const formattedBaseUrl = baseURL ? baseURL.trim() : undefined;

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-custom-endpoint',
      baseURL: formattedBaseUrl,
      // Pass necessary headers for OpenRouter or custom proxies
      defaultHeaders: formattedBaseUrl?.includes('openrouter.ai') ? {
        'HTTP-Referer': 'https://agentarena.ai',
        'X-Title': 'Agent Arena',
      } : undefined,
    });
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const model = options.model || this.defaultModel || DEFAULT_MODEL;
    const isReasoning = model.startsWith('o1') || model.startsWith('o3');
    const messages = this.buildMessages(options, isReasoning);
    
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const createParams: Record<string, unknown> = {
          model,
          messages,
        };

        // Standard models accept temperature; reasoning models might not
        if (!isReasoning) {
          createParams.temperature = options.temperature ?? 0.3;
        }

        // Token limit handling
        if (isReasoning) {
          createParams.max_completion_tokens = options.maxTokens || 2048;
        } else if (!this.isGemini) {
          createParams.max_tokens = options.maxTokens || 2048;
        }

        const response = await this.client.chat.completions.create(
          createParams as unknown as OpenAI.ChatCompletionCreateParamsNonStreaming
        );

        const content = response.choices[0]?.message?.content || '';

        return {
          content,
          model: response.model || model,
          usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          } : undefined,
        };
      } catch (error) {
        lastError = this.formatError(error);
        
        // Don't retry if it's an authentication, invalid key, or quota error
        const msg = lastError.message.toLowerCase();
        if (msg.includes('401') || msg.includes('auth') || msg.includes('key') || msg.includes('quota') || msg.includes('credit')) {
          throw lastError;
        }

        if (attempt < MAX_RETRIES - 1) {
          await this.delay(RETRY_DELAY_MS);
        }
      }
    }

    throw lastError || new Error('AI provider request failed after retries.');
  }

  async stream(options: AIStreamOptions): Promise<AIGenerateResult> {
    const model = options.model || this.defaultModel || DEFAULT_MODEL;
    const isReasoning = model.startsWith('o1') || model.startsWith('o3');
    const messages = this.buildMessages(options, isReasoning);
    
    try {
      const createParams: Record<string, unknown> = {
        model,
        messages,
        stream: true,
      };

      if (!isReasoning) {
        createParams.temperature = options.temperature ?? 0.3;
      }

      if (isReasoning) {
        createParams.max_completion_tokens = options.maxTokens || 2048;
      } else if (!this.isGemini) {
        createParams.max_tokens = options.maxTokens || 2048;
      }

      const stream = await this.client.chat.completions.create(
        createParams as unknown as OpenAI.ChatCompletionCreateParamsStreaming
      );

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          options.onChunk?.(delta);
        }
      }

      return {
        content: fullContent,
        model,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async structuredOutput<T>(options: AIStructuredOptions<T>): Promise<T> {
    const jsonPrompt = `${options.systemPrompt || ''}

IMPORTANT: You MUST respond with ONLY valid JSON matching this schema:
${JSON.stringify(options.schema.properties, null, 2)}

Do NOT include any text outside the JSON object. No markdown backticks, no explanations. Just the raw JSON.`;

    const result = await this.generate({
      ...options,
      systemPrompt: jsonPrompt,
      temperature: Math.min(options.temperature ?? 0.2, 0.3),
    });

    try {
      const jsonStr = this.extractJson(result.content);
      return options.parse(jsonStr);
    } catch {
      throw new Error(`Failed to parse structured output: ${result.content.substring(0, 200)}`);
    }
  }

  private buildMessages(options: AIGenerateOptions, isReasoning: boolean): OpenAI.ChatCompletionMessageParam[] {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    
    if (options.systemPrompt) {
      if (isReasoning) {
        // Reasoning models like o1 prefer system instructions inside user message or developer role
        messages.push({ role: 'developer', content: options.systemPrompt } as OpenAI.ChatCompletionMessageParam);
      } else {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
    }

    for (const msg of options.messages) {
      messages.push({ role: msg.role, content: msg.content } as OpenAI.ChatCompletionMessageParam);
    }

    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'Hello' });
    }

    return messages;
  }

  private formatError(error: unknown): Error {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes('401') || msg.includes('Incorrect API key') || msg.includes('invalid_api_key') || msg.includes('UNAUTHENTICATED')) {
        return new Error(`Invalid API key or unauthorized. Please verify your API key.`);
      }
      if (msg.includes('429') || msg.includes('insufficient_quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        return new Error(`API rate limit or quota exceeded. Please check your credit balance or try again.`);
      }
      if (msg.includes('model_not_found') || msg.includes('404')) {
        return new Error(`Model not found or not supported by your API key.`);
      }
      return error;
    }
    return new Error(String(error));
  }

  private extractJson(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];
    return text;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
