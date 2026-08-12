// ============================================================
// AI Provider — Abstract interface for LLM providers
// ============================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  messages: AIMessage[];
}

export interface AIStreamOptions extends AIGenerateOptions {
  onChunk?: (chunk: string) => void;
}

export interface AIStructuredOptions<T> extends AIGenerateOptions {
  schema: {
    name: string;
    description: string;
    properties: Record<string, unknown>;
  };
  parse: (raw: string) => T;
}

export interface AIGenerateResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  generate(options: AIGenerateOptions): Promise<AIGenerateResult>;
  stream(options: AIStreamOptions): Promise<AIGenerateResult>;
  structuredOutput<T>(options: AIStructuredOptions<T>): Promise<T>;
}
