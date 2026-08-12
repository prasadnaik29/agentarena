// ============================================================
// Tool Types — Tool abstraction for agent capabilities
// ============================================================

import { z } from 'zod';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  category: 'calculation' | 'search' | 'analysis' | 'data';
}

export interface ToolCall {
  id: string;
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
  agentId: string;
  timestamp: Date;
}

export interface ToolResult {
  id: string;
  toolCallId: string;
  output: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface Tool extends ToolDefinition {
  execute(input: Record<string, unknown>): Promise<ToolResult>;
}

// Available tool IDs for role mapping
export const TOOL_IDS = {
  CALCULATOR: 'calculator',
  WEB_SEARCH: 'web-search',
  DOCUMENT_SEARCH: 'document-search',
  DATA_QUERY: 'data-query',
} as const;

export const TOOL_LABELS: Record<string, string> = {
  [TOOL_IDS.CALCULATOR]: 'Calculator',
  [TOOL_IDS.WEB_SEARCH]: 'Web Search',
  [TOOL_IDS.DOCUMENT_SEARCH]: 'Document Search',
  [TOOL_IDS.DATA_QUERY]: 'Data Query',
};

export const TOOL_DESCRIPTIONS: Record<string, string> = {
  [TOOL_IDS.CALCULATOR]: 'Perform mathematical calculations and financial modeling',
  [TOOL_IDS.WEB_SEARCH]: 'Search the web for relevant information and data',
  [TOOL_IDS.DOCUMENT_SEARCH]: 'Search through documents and knowledge bases',
  [TOOL_IDS.DATA_QUERY]: 'Query structured data and databases',
};
