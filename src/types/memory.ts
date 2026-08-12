// ============================================================
// Memory Types — Structured memory for arena and agents
// ============================================================

import type { ArenaPhase, EvaluationScores } from './arena';

export interface GlobalArenaMemory {
  arenaId: string;
  challenge: string;
  constraints: string[];
  subproblems: string[];
  importantFacts: string[];
  decisions: Decision[];
  proposals: ProposalRecord[];
  critiques: CritiqueRecord[];
  evidence: EvidenceRecord[];
  conclusions: string[];
  currentPhase: ArenaPhase;
  phaseHistory: PhaseRecord[];
}

export interface AgentMemory {
  agentId: string;
  role: string;
  previousFindings: string[];
  currentProposal?: string;
  feedbackReceived: FeedbackRecord[];
  toolResults: ToolResultRecord[];
  challengesReceived: string[];
  revisionHistory: RevisionRecord[];
}

export interface Decision {
  id: string;
  content: string;
  madeBy: string;
  phase: ArenaPhase;
  timestamp: Date;
}

export interface ProposalRecord {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  version: number;
  scores?: EvaluationScores;
  teamId?: string;
  timestamp: Date;
}

export interface CritiqueRecord {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  targetAgentId: string;
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  addressed: boolean;
  timestamp: Date;
}

export interface EvidenceRecord {
  id: string;
  agentId: string;
  content: string;
  source: string;
  confidence: number;
  timestamp: Date;
}

export interface FeedbackRecord {
  fromAgentId: string;
  fromAgentName: string;
  content: string;
  type: 'critique' | 'challenge' | 'suggestion';
  timestamp: Date;
}

export interface ToolResultRecord {
  toolId: string;
  toolName: string;
  input: string;
  output: string;
  timestamp: Date;
}

export interface RevisionRecord {
  version: number;
  previousContent: string;
  newContent: string;
  reason: string;
  triggeredBy: string;
  timestamp: Date;
}

export interface PhaseRecord {
  phase: ArenaPhase;
  startedAt: Date;
  completedAt?: Date;
  summary?: string;
}
