// ============================================================
// Anthropic Claude Provider — Implementation of AIProvider
// ============================================================

import type { AIProvider, AIGenerateOptions, AIStreamOptions, AIStructuredOptions, AIGenerateResult } from './provider';

const DEFAULT_CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicProvider implements AIProvider {
  name = 'claude';
  private apiKey: string;
  private defaultModel: string;
  private baseUrl: string;

  constructor(options?: string | { apiKey?: string; defaultModel?: string; baseUrl?: string }) {
    if (typeof options === 'string') {
      this.apiKey = options;
      this.defaultModel = DEFAULT_CLAUDE_MODEL;
      this.baseUrl = ANTHROPIC_API_URL;
    } else {
      this.apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
      this.defaultModel = options?.defaultModel || process.env.ANTHROPIC_MODEL || DEFAULT_CLAUDE_MODEL;
      this.baseUrl = options?.baseUrl || ANTHROPIC_API_URL;
    }
  }

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required. Please provide a valid Claude API key (sk-ant-...).');
    }

    const model = options.model || this.defaultModel || DEFAULT_CLAUDE_MODEL;
    const { systemPrompt, messages } = this.formatMessages(options);

    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.3,
      messages,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const endpoint = this.baseUrl.endsWith('/messages') ? this.baseUrl : `${this.baseUrl.replace(/\/+$/, '')}/messages`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Anthropic API error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch {
        errorMsg = `${errorMsg}: ${errorText.substring(0, 150)}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const textContent = data.content
      ?.filter((c: { type: string; text?: string }) => c.type === 'text')
      ?.map((c: { text: string }) => c.text)
      ?.join('') || '';

    return {
      content: textContent,
      model: data.model || model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens || 0,
        completionTokens: data.usage.output_tokens || 0,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      } : undefined,
    };
  }

  async stream(options: AIStreamOptions): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required.');
    }

    const model = options.model || this.defaultModel || DEFAULT_CLAUDE_MODEL;
    const { systemPrompt, messages } = this.formatMessages(options);

    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.3,
      messages,
      stream: true,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const endpoint = this.baseUrl.endsWith('/messages') ? this.baseUrl : `${this.baseUrl.replace(/\/+$/, '')}/messages`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`Anthropic streaming error (${response.status}): ${errorText.substring(0, 150)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              fullContent += event.delta.text;
              options.onChunk?.(event.delta.text);
            }
          } catch {
            // ignore malformed SSE
          }
        }
      }
    }

    return {
      content: fullContent,
      model,
    };
  }

  async structuredOutput<T>(options: AIStructuredOptions<T>): Promise<T> {
    const jsonPrompt = `${options.systemPrompt || ''}

IMPORTANT: You MUST respond with ONLY valid JSON matching this schema:
${JSON.stringify(options.schema.properties, null, 2)}

Do NOT include any markdown formatting, backticks, or explanation. Respond with ONLY the raw JSON.`;

    const result = await this.generate({
      ...options,
      systemPrompt: jsonPrompt,
      temperature: Math.min(options.temperature ?? 0.2, 0.3),
    });

    try {
      const jsonStr = this.extractJson(result.content);
      return options.parse(jsonStr);
    } catch {
      throw new Error(`Failed to parse structured output from Claude: ${result.content.substring(0, 200)}`);
    }
  }

  private formatMessages(options: AIGenerateOptions): { systemPrompt?: string; messages: Array<{ role: 'user' | 'assistant'; content: string }> } {
    let systemPrompt = options.systemPrompt;
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of options.messages) {
      if (msg.role === 'system') {
        systemPrompt = systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content;
      } else {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'Hello' });
    }

    return { systemPrompt, messages };
  }

  private extractJson(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];
    return text;
  }
}
