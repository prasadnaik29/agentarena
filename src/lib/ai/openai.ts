// ============================================================
// OpenAI Provider — Implementation of AIProvider for OpenAI
// ============================================================

import OpenAI from 'openai';
import type { AIProvider, AIGenerateOptions, AIStreamOptions, AIStructuredOptions, AIGenerateResult, AIMessage } from './provider';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const messages = this.buildMessages(options);
    
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: options.model || DEFAULT_MODEL,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens || 2048,
          messages,
        });

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
          await this.delay(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    throw new Error(`OpenAI API call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  async stream(options: AIStreamOptions): Promise<AIGenerateResult> {
    const messages = this.buildMessages(options);
    
    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || DEFAULT_MODEL,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens || 2048,
        messages,
        stream: true,
      });

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
        model: options.model || DEFAULT_MODEL,
      };
    } catch (error) {
      throw new Error(`OpenAI streaming failed: ${(error as Error).message}`);
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
