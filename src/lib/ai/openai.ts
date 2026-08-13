// ============================================================
// OpenAI Provider — Implementation of AIProvider for OpenAI
// ============================================================

import OpenAI from 'openai';
import type { AIProvider, AIGenerateOptions, AIStreamOptions, AIStructuredOptions, AIGenerateResult } from './provider';
import { MockAIProvider } from './mock-provider';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private defaultModel: string;
  private mockFallback: MockAIProvider;
  private isGemini: boolean;

  constructor(options?: string | { apiKey?: string; defaultModel?: string; baseUrl?: string }) {
    const apiKey = typeof options === 'string' ? options : options?.apiKey || process.env.OPENAI_API_KEY;
    const baseURL = (typeof options === 'object' ? options?.baseUrl : undefined) || process.env.OPENAI_BASE_URL || undefined;
    this.defaultModel = (typeof options === 'object' ? options?.defaultModel : undefined) || process.env.OPENAI_MODEL || DEFAULT_MODEL;
    this.mockFallback = new MockAIProvider();
    this.isGemini = !!(baseURL && baseURL.includes('googleapis.com'));

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-custom-endpoint',
      baseURL: baseURL || undefined,
    });
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const messages = this.buildMessages(options);
    const model = options.model || this.defaultModel || DEFAULT_MODEL;
    
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Gemini's OpenAI-compatible endpoint does not support max_tokens
        const createParams: Record<string, unknown> = {
          model,
          temperature: options.temperature ?? 0.3,
          messages,
        };
        if (!this.isGemini) {
          createParams.max_tokens = options.maxTokens || 2048;
        }

        const response = await this.client.chat.completions.create(
          createParams as unknown as OpenAI.ChatCompletionCreateParamsNonStreaming
        );

        return {
          content: response.choices[0]?.message?.content || '',
          model: response.model,
          usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          } : undefined,
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_RETRIES - 1) {
          await this.delay(RETRY_DELAY_MS);
        }
      }
    }

    console.warn(`[OpenAI Provider] API call failed: ${lastError?.message}. Falling back to dynamic Mock Provider.`);
    return this.mockFallback.generate(options);
  }

  async stream(options: AIStreamOptions): Promise<AIGenerateResult> {
    const messages = this.buildMessages(options);
    const model = options.model || this.defaultModel || DEFAULT_MODEL;
    
    try {
      const createParams: Record<string, unknown> = {
        model,
        temperature: options.temperature ?? 0.3,
        messages,
        stream: true,
      };
      if (!this.isGemini) {
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
      console.warn(`[OpenAI Provider] Streaming failed: ${(error as Error).message}. Falling back to dynamic Mock Provider.`);
      return this.mockFallback.stream(options);
    }
  }

  async structuredOutput<T>(options: AIStructuredOptions<T>): Promise<T> {
    // Ask the model to output JSON matching our schema
    const jsonPrompt = `${options.systemPrompt || ''}

IMPORTANT: You MUST respond with ONLY valid JSON matching this schema:
${JSON.stringify(options.schema.properties, null, 2)}

Do NOT include any text outside the JSON object. No markdown, no explanations. Just the JSON.`;

    const result = await this.generate({
      ...options,
      systemPrompt: jsonPrompt,
      temperature: Math.min(options.temperature ?? 0.2, 0.3), // lower temp for structured output
    });

    try {
      // Try to extract JSON from the response
      const jsonStr = this.extractJson(result.content);
      return options.parse(jsonStr);
    } catch {
      throw new Error(`Failed to parse structured output: ${result.content.substring(0, 200)}`);
    }
  }

  private buildMessages(options: AIGenerateOptions): OpenAI.ChatCompletionMessageParam[] {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const msg of options.messages) {
      messages.push({ role: msg.role, content: msg.content } as OpenAI.ChatCompletionMessageParam);
    }

    return messages;
  }

  private extractJson(text: string): string {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    // Try array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }
    return text;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
