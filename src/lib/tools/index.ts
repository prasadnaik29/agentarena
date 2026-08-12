// ============================================================
// Tool Implementations — Concrete tools for agents
// ============================================================

import { v4 as uuid } from 'uuid';
import type { Tool, ToolResult } from '@/types/tools';
import { z } from 'zod';

// ---- Calculator Tool ----
export const calculatorTool: Tool = {
  id: 'calculator',
  name: 'Calculator',
  description: 'Perform mathematical calculations and financial modeling',
  category: 'calculation',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate'),
  }),
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const expr = input.expression as string;
    try {
      // Safe math evaluation (no eval)
      const result = safeMathEval(expr);
      return {
        id: uuid(),
        toolCallId: '',
        output: `Result: ${result}`,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        id: uuid(),
        toolCallId: '',
        output: '',
        success: false,
        error: `Calculation failed: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  },
};

// Safe math evaluation without eval()
function safeMathEval(expr: string): number {
  // Remove whitespace
  const cleaned = expr.replace(/\s/g, '');
  // Only allow numbers, operators, parentheses, decimal points
  if (!/^[0-9+\-*/().,%]+$/.test(cleaned)) {
    throw new Error('Invalid expression: contains unsupported characters');
  }
  // Use Function constructor for sandboxed evaluation
  const fn = new Function(`"use strict"; return (${cleaned});`);
  const result = fn();
  if (typeof result !== 'number' || isNaN(result)) {
    throw new Error('Expression did not evaluate to a valid number');
  }
  return Math.round(result * 100) / 100;
}

// ---- Web Search Tool (Mock) ----
// MOCK: In production, integrate with a real search API (SerpAPI, Brave Search, etc.)
export const webSearchTool: Tool = {
  id: 'web-search',
  name: 'Web Search',
  description: 'Search the web for relevant information and data',
  category: 'search',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
  }),
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const query = input.query as string;
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    const mockResults = generateMockSearchResults(query);
    return {
      id: uuid(),
      toolCallId: '',
      output: mockResults,
      success: true,
      timestamp: new Date(),
    };
  },
};

function generateMockSearchResults(query: string): string {
  const lower = query.toLowerCase();
  
  if (lower.includes('market') || lower.includes('industry')) {
    return `Search Results for "${query}":
1. Market analysis shows the sector grew 28% YoY in 2024-25.
2. Key players include 3-4 major incumbents with combined market share of 65%.
3. Consumer surveys indicate 72% awareness but only 18% adoption rate.
4. Industry reports forecast $4.2B market size by 2027 (CAGR 24%).`;
  }
  
  if (lower.includes('cost') || lower.includes('price') || lower.includes('budget')) {
    return `Search Results for "${query}":
1. Average customer acquisition cost in this segment: ₹800-1,500.
2. Operational costs benchmark: 45-55% of revenue for early-stage companies.
3. Similar ventures typically require 18-24 months to break even.
4. Marketing spend benchmark: 35-45% of initial budget for digital-first launches.`;
  }
  
  if (lower.includes('competitor') || lower.includes('competition')) {
    return `Search Results for "${query}":
1. Three major competitors identified with ₹50Cr+ annual revenue.
2. Recent funding rounds: Competitor A raised ₹200Cr (Series B), Competitor B raised ₹75Cr (Series A).
3. Market gaps: Underserved tier-2 cities, limited vernacular language support.
4. Competitor weakness: High churn rates (35-50%) reported in user reviews.`;
  }
  
  return `Search Results for "${query}":
1. Multiple data points found relevant to the query.
2. Industry reports suggest growing demand in this area.
3. Key challenges include market fragmentation and regulatory uncertainty.
4. Expert consensus points to cautious optimism with proper execution.`;
}

// ---- Document Search Tool (Mock) ----
export const documentSearchTool: Tool = {
  id: 'document-search',
  name: 'Document Search',
  description: 'Search through documents and knowledge bases',
  category: 'search',
  inputSchema: z.object({
    query: z.string().describe('Document search query'),
  }),
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const query = input.query as string;
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
    
    return {
      id: uuid(),
      toolCallId: '',
      output: `Document search for "${query}": Found 3 relevant documents. Key excerpts support the hypothesis that the target market shows strong growth potential with manageable risk factors.`,
      success: true,
      timestamp: new Date(),
    };
  },
};

// ---- Data Query Tool (Mock) ----
export const dataQueryTool: Tool = {
  id: 'data-query',
  name: 'Data Query',
  description: 'Query structured data and databases',
  category: 'data',
  inputSchema: z.object({
    query: z.string().describe('Data query in natural language'),
  }),
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const query = input.query as string;
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
    
    return {
      id: uuid(),
      toolCallId: '',
      output: `Query: "${query}" → Results: 12 records matched. Summary: Key metrics within expected ranges. Trend analysis shows 15% improvement over last quarter.`,
      success: true,
      timestamp: new Date(),
    };
  },
};

// ---- Tool Registry ----
const ALL_TOOLS: Tool[] = [
  calculatorTool,
  webSearchTool,
  documentSearchTool,
  dataQueryTool,
];

export function getToolById(id: string): Tool | undefined {
  return ALL_TOOLS.find(t => t.id === id);
}

export function getToolsByIds(ids: string[]): Tool[] {
  return ids.map(id => getToolById(id)).filter((t): t is Tool => t !== undefined);
}

export function getAllTools(): Tool[] {
  return [...ALL_TOOLS];
}

// Role-based tool access — agents only get tools appropriate to their role
export function getToolsForRole(role: string): string[] {
  const roleToolMap: Record<string, string[]> = {
    researcher: ['web-search', 'document-search'],
    strategist: ['web-search'],
    finance: ['calculator'],
    risk: ['web-search', 'calculator'],
    critic: [],
    judge: [],
    custom: [],
  };
  return roleToolMap[role] || [];
}
