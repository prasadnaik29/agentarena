// ============================================================
// Event Types — Structured events for agent communication
// ============================================================

import type { ArenaPhase, EvaluationScores } from './arena';
import type { AgentStatus } from './agent';

export type ArenaEventType =
  // Agent lifecycle events
  | 'AGENT_STARTED'
  | 'AGENT_STATUS_CHANGED'
  | 'AGENT_MESSAGE'
  | 'AGENT_FINDING'
  | 'AGENT_PROPOSAL'
  | 'AGENT_CHALLENGE'
  | 'AGENT_CHALLENGE_RESPONSE'
  | 'AGENT_CRITIQUE'
  | 'AGENT_REVISION'
  | 'AGENT_VOTE'
  | 'AGENT_TOOL_CALL'
  | 'AGENT_TOOL_RESULT'
  | 'AGENT_ERROR'
  | 'AGENT_FINISHED'
  // Arena lifecycle events
  | 'ARENA_STARTED'
  | 'ARENA_PHASE_CHANGED'
  | 'ARENA_DEBATE_STARTED'
  | 'ARENA_DEBATE_RESOLVED'
  | 'ARENA_VOTING_STARTED'
  | 'ARENA_VOTING_COMPLETED'
  | 'ARENA_EVALUATION_COMPLETED'
  | 'ARENA_FINISHED'
  | 'ARENA_ERROR';

export interface BaseArenaEvent {
  id: string;
  type: ArenaEventType;
  arenaId: string;
  timestamp: Date;
}

export interface AgentStartedEvent extends BaseArenaEvent {
  type: 'AGENT_STARTED';
  agentId: string;
  agentName: string;
  role: string;
}

export interface AgentStatusChangedEvent extends BaseArenaEvent {
  type: 'AGENT_STATUS_CHANGED';
  agentId: string;
  agentName: string;
  previousStatus: AgentStatus;
  newStatus: AgentStatus;
  task?: string;
}

export interface AgentMessageEvent extends BaseArenaEvent {
  type: 'AGENT_MESSAGE';
  agentId: string;
  agentName: string;
  content: string;
  summary: string; // user-safe summary
  phase: ArenaPhase;
}

export interface AgentFindingEvent extends BaseArenaEvent {
  type: 'AGENT_FINDING';
  agentId: string;
  agentName: string;
  finding: string;
  evidence?: string;
  confidence: number;
}

export interface AgentProposalEvent extends BaseArenaEvent {
  type: 'AGENT_PROPOSAL';
  agentId: string;
  agentName: string;
  proposal: string;
  teamId?: string;
}

export interface AgentChallengeEvent extends BaseArenaEvent {
  type: 'AGENT_CHALLENGE';
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  challenge: string;
}

export interface AgentChallengeResponseEvent extends BaseArenaEvent {
  type: 'AGENT_CHALLENGE_RESPONSE';
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  response: string;
  accepted: boolean;
}

export interface AgentCritiqueEvent extends BaseArenaEvent {
  type: 'AGENT_CRITIQUE';
  agentId: string;
  agentName: string;
  targetAgentId: string;
  targetAgentName: string;
  critique: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentRevisionEvent extends BaseArenaEvent {
  type: 'AGENT_REVISION';
  agentId: string;
  agentName: string;
  previousProposal: string;
  revisedProposal: string;
  changesDescription: string;
}

export interface AgentVoteEvent extends BaseArenaEvent {
  type: 'AGENT_VOTE';
  agentId: string;
  agentName: string;
  vote: 'approve' | 'reject';
  reason: string;
}

export interface AgentToolCallEvent extends BaseArenaEvent {
  type: 'AGENT_TOOL_CALL';
  agentId: string;
  agentName: string;
  toolId: string;
  toolName: string;
  input: string;
}

export interface AgentToolResultEvent extends BaseArenaEvent {
  type: 'AGENT_TOOL_RESULT';
  agentId: string;
  agentName: string;
  toolId: string;
  toolName: string;
  result: string;
  success: boolean;
}

export interface AgentErrorEvent extends BaseArenaEvent {
  type: 'AGENT_ERROR';
  agentId: string;
  agentName: string;
  error: string;
  recoverable: boolean;
}

export interface AgentFinishedEvent extends BaseArenaEvent {
  type: 'AGENT_FINISHED';
  agentId: string;
  agentName: string;
}

export interface ArenaStartedEvent extends BaseArenaEvent {
  type: 'ARENA_STARTED';
  challenge: string;
  mode: string;
  agentCount: number;
}

export interface ArenaPhaseChangedEvent extends BaseArenaEvent {
  type: 'ARENA_PHASE_CHANGED';
  previousPhase: ArenaPhase | null;
  newPhase: ArenaPhase;
  description: string;
}

export interface ArenaDebateStartedEvent extends BaseArenaEvent {
  type: 'ARENA_DEBATE_STARTED';
  participants: string[];
  topic: string;
}

export interface ArenaDebateResolvedEvent extends BaseArenaEvent {
  type: 'ARENA_DEBATE_RESOLVED';
  resolution: string;
  winner?: string;
}

export interface ArenaVotingStartedEvent extends BaseArenaEvent {
  type: 'ARENA_VOTING_STARTED';
}

export interface ArenaVotingCompletedEvent extends BaseArenaEvent {
  type: 'ARENA_VOTING_COMPLETED';
  approveCount: number;
  rejectCount: number;
  votes: Array<{ agentId: string; agentName: string; vote: 'approve' | 'reject'; reason: string }>;
}

export interface ArenaEvaluationCompletedEvent extends BaseArenaEvent {
  type: 'ARENA_EVALUATION_COMPLETED';
  scores: EvaluationScores;
  teamId?: string;
  teamName?: string;
}

export interface ArenaFinishedEvent extends BaseArenaEvent {
  type: 'ARENA_FINISHED';
  recommendation: string;
  confidence: number;
}

export interface ArenaErrorEvent extends BaseArenaEvent {
  type: 'ARENA_ERROR';
  error: string;
  recoverable: boolean;
}

export type ArenaEvent =
  | AgentStartedEvent
  | AgentStatusChangedEvent
  | AgentMessageEvent
  | AgentFindingEvent
  | AgentProposalEvent
  | AgentChallengeEvent
  | AgentChallengeResponseEvent
  | AgentCritiqueEvent
  | AgentRevisionEvent
  | AgentVoteEvent
  | AgentToolCallEvent
  | AgentToolResultEvent
  | AgentErrorEvent
  | AgentFinishedEvent
  | ArenaStartedEvent
  | ArenaPhaseChangedEvent
  | ArenaDebateStartedEvent
  | ArenaDebateResolvedEvent
  | ArenaVotingStartedEvent
  | ArenaVotingCompletedEvent
  | ArenaEvaluationCompletedEvent
  | ArenaFinishedEvent
  | ArenaErrorEvent;

// Helper to get a user-friendly description of an event
export function getEventSummary(event: ArenaEvent): string {
  switch (event.type) {
    case 'AGENT_STARTED':
      return `${event.agentName} joined the arena.`;
    case 'AGENT_STATUS_CHANGED':
      return `${event.agentName} is now ${event.newStatus}.`;
    case 'AGENT_MESSAGE':
      return event.summary;
    case 'AGENT_FINDING':
      return `${event.agentName} found: ${event.finding}`;
    case 'AGENT_PROPOSAL':
      return `${event.agentName} submitted a proposal.`;
    case 'AGENT_CHALLENGE':
      return `${event.fromAgentName} challenged ${event.toAgentName}: ${event.challenge}`;
    case 'AGENT_CHALLENGE_RESPONSE':
      return `${event.fromAgentName} responded to ${event.toAgentName}'s challenge.`;
    case 'AGENT_CRITIQUE':
      return `${event.agentName} critiqued ${event.targetAgentName}: ${event.critique}`;
    case 'AGENT_REVISION':
      return `${event.agentName} revised their proposal: ${event.changesDescription}`;
    case 'AGENT_VOTE':
      return `${event.agentName} voted: ${event.vote.toUpperCase()} — ${event.reason}`;
    case 'AGENT_TOOL_CALL':
      return `${event.agentName} is using ${event.toolName}.`;
    case 'AGENT_TOOL_RESULT':
      return `${event.agentName} received results from ${event.toolName}.`;
    case 'AGENT_ERROR':
      return `${event.agentName} encountered an error: ${event.error}`;
    case 'AGENT_FINISHED':
      return `${event.agentName} has completed their work.`;
    case 'ARENA_STARTED':
      return `Arena started with ${event.agentCount} agents in ${event.mode} mode.`;
    case 'ARENA_PHASE_CHANGED':
      return `Phase changed to: ${event.newPhase.toUpperCase()} — ${event.description}`;
    case 'ARENA_DEBATE_STARTED':
      return `Debate started: ${event.topic}`;
    case 'ARENA_DEBATE_RESOLVED':
      return `Debate resolved: ${event.resolution}`;
    case 'ARENA_VOTING_STARTED':
      return 'Agents are now voting.';
    case 'ARENA_VOTING_COMPLETED':
      return `Voting complete: ${event.approveCount} approve, ${event.rejectCount} reject.`;
    case 'ARENA_EVALUATION_COMPLETED':
      return `Evaluation complete${event.teamName ? ` for ${event.teamName}` : ''}: Overall score ${event.scores.overall}/100`;
    case 'ARENA_FINISHED':
      return `Arena complete. Confidence: ${event.confidence}%`;
    case 'ARENA_ERROR':
      return `Arena error: ${event.error}`;
  }
}
