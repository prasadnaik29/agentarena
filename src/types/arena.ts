// ============================================================
// Arena Types — Core domain models for the Arena system
// ============================================================

export type ArenaMode = 'collaborative' | 'competitive';

export type ArenaStatus = 
  | 'draft'
  | 'configuring'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

export type ArenaPhase =
  | 'decompose'
  | 'investigate'
  | 'propose'
  | 'debate'
  | 'critique'
  | 'revise'
  | 'judge'
  | 'synthesize'
  | 'results';

export const ARENA_PHASE_ORDER: ArenaPhase[] = [
  'decompose',
  'investigate',
  'propose',
  'debate',
  'critique',
  'revise',
  'judge',
  'synthesize',
  'results',
];

export const ARENA_PHASE_LABELS: Record<ArenaPhase, string> = {
  decompose: 'Decompose',
  investigate: 'Investigate',
  propose: 'Propose',
  debate: 'Debate',
  critique: 'Critique',
  revise: 'Revise',
  judge: 'Judge',
  synthesize: 'Synthesize',
  results: 'Results',
};

export const ARENA_PHASE_DESCRIPTIONS: Record<ArenaPhase, string> = {
  decompose: 'Breaking the challenge into subproblems',
  investigate: 'Gathering information and evidence',
  propose: 'Developing independent approaches',
  debate: 'Challenging one another\'s proposals',
  critique: 'Aggressively testing proposals',
  revise: 'Improving proposals based on feedback',
  judge: 'Evaluating all solutions',
  synthesize: 'Creating the final recommendation',
  results: 'Final recommendation and analysis',
};

export type LLMProviderType = 'mock' | 'openai' | 'gemini' | 'claude' | 'groq' | 'openrouter' | 'deepseek' | 'ollama';

export interface ArenaConfig {
  challenge: string;
  mode: ArenaMode;
  agentCount?: number;
  domain?: string;
  constraints?: string;
  teamCount?: number; // competitive mode
  timeLimit?: number; // seconds
  provider?: LLMProviderType;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface Arena {
  id: string;
  config: ArenaConfig;
  status: ArenaStatus;
  currentPhase: ArenaPhase;
  agents: string[]; // agent IDs
  teams?: Team[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  agentIds: string[];
  proposalId?: string;
  score?: EvaluationScores;
}

export interface ArenaResult {
  id: string;
  arenaId: string;
  recommendation: string;
  confidence: number; // 0-100
  keyFindings: string[];
  risks: string[];
  assumptions: string[];
  bestAlternative?: string;
  rejectedApproaches: RejectedApproach[];
  evidence: EvidenceItem[];
  agentScores: AgentScore[];
  timeline: TimelineEntry[];
  leaderboard?: LeaderboardEntry[]; // competitive mode
  createdAt: Date;
}

export interface RejectedApproach {
  description: string;
  reason: string;
  proposedBy: string;
}

export interface EvidenceItem {
  id: string;
  content: string;
  source: string;
  agentId: string;
  confidence: number;
  timestamp: Date;
}

export interface AgentScore {
  agentId: string;
  agentName: string;
  contribution: number;
  accuracy: number;
  responsiveness: number;
}

export interface TimelineEntry {
  timestamp: Date;
  phase: ArenaPhase;
  event: string;
  description: string;
  agentId?: string;
  agentName?: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  scores: EvaluationScores;
  overallScore: number;
  rank: number;
  proposal: string;
  strengths: string[];
  weaknesses: string[];
}

export interface EvaluationScores {
  feasibility: number;
  evidence: number;
  originality: number;
  costEfficiency: number;
  risk: number;
  impact: number;
  consistency: number;
  overall: number;
}

// Sample challenges for demo
export const SAMPLE_CHALLENGES = [
  {
    title: 'AI Education Platform',
    challenge: 'Should a startup launch an AI-powered education platform for Indian college students with a ₹10 lakh initial budget?',
    domain: 'EdTech / Startup',
  },
  {
    title: 'College Tech Festival',
    challenge: 'Design the optimal strategy for a college tech festival with a ₹5 lakh budget.',
    domain: 'Event Management',
  },
  {
    title: 'Four-Day Workweek',
    challenge: 'Should a company adopt a four-day workweek?',
    domain: 'HR / Operations',
  },
  {
    title: 'EV Subscription Service',
    challenge: 'Develop a market-entry strategy for an affordable EV subscription service in India.',
    domain: 'Automotive / Mobility',
  },
];
