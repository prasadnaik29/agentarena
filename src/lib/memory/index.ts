// ============================================================
// Memory Manager — Structured memory for arena and agents
// ============================================================

import { v4 as uuid } from 'uuid';
import type {
  GlobalArenaMemory,
  AgentMemory,
  ProposalRecord,
  CritiqueRecord,
  EvidenceRecord,
  PhaseRecord,
} from '@/types/memory';
import type { ArenaPhase } from '@/types/arena';

export class MemoryManager {
  private globalMemory: GlobalArenaMemory;
  private agentMemories: Map<string, AgentMemory> = new Map();

  constructor(arenaId: string, challenge: string) {
    this.globalMemory = {
      arenaId,
      challenge,
      constraints: [],
      subproblems: [],
      importantFacts: [],
      decisions: [],
      proposals: [],
      critiques: [],
      evidence: [],
      conclusions: [],
      currentPhase: 'decompose',
      phaseHistory: [],
    };
  }

  // ---- Global Memory ----

  getGlobalMemory(): GlobalArenaMemory {
    return { ...this.globalMemory };
  }

  setPhase(phase: ArenaPhase): void {
    // Complete previous phase
    const currentPhaseRecord = this.globalMemory.phaseHistory.find(
      p => p.phase === this.globalMemory.currentPhase && !p.completedAt
    );
    if (currentPhaseRecord) {
      currentPhaseRecord.completedAt = new Date();
    }

    this.globalMemory.currentPhase = phase;
    this.globalMemory.phaseHistory.push({
      phase,
      startedAt: new Date(),
    });
  }

  addSubproblems(subproblems: string[]): void {
    this.globalMemory.subproblems.push(...subproblems);
  }

  addConstraints(constraints: string[]): void {
    this.globalMemory.constraints.push(...constraints);
  }

  addFact(fact: string): void {
    this.globalMemory.importantFacts.push(fact);
  }

  addProposal(proposal: ProposalRecord): void {
    this.globalMemory.proposals.push(proposal);
  }

  addCritique(critique: CritiqueRecord): void {
    this.globalMemory.critiques.push(critique);
  }

  addEvidence(evidence: EvidenceRecord): void {
    this.globalMemory.evidence.push(evidence);
  }

  addConclusion(conclusion: string): void {
    this.globalMemory.conclusions.push(conclusion);
  }

  addDecision(content: string, madeBy: string, phase: ArenaPhase): void {
    this.globalMemory.decisions.push({
      id: uuid(),
      content,
      madeBy,
      phase,
      timestamp: new Date(),
    });
  }

  getProposals(): ProposalRecord[] {
    return [...this.globalMemory.proposals];
  }

  getProposalsForTeam(teamId: string): ProposalRecord[] {
    return this.globalMemory.proposals.filter(p => p.teamId === teamId);
  }

  getCritiques(): CritiqueRecord[] {
    return [...this.globalMemory.critiques];
  }

  getCritiquesForAgent(agentId: string): CritiqueRecord[] {
    return this.globalMemory.critiques.filter(c => c.targetAgentId === agentId);
  }

  getPhaseHistory(): PhaseRecord[] {
    return [...this.globalMemory.phaseHistory];
  }

  // ---- Agent Memory ----

  initAgentMemory(agentId: string, role: string): void {
    this.agentMemories.set(agentId, {
      agentId,
      role,
      previousFindings: [],
      feedbackReceived: [],
      toolResults: [],
      challengesReceived: [],
      revisionHistory: [],
    });
  }

  getAgentMemory(agentId: string): AgentMemory | undefined {
    const mem = this.agentMemories.get(agentId);
    return mem ? { ...mem } : undefined;
  }

  addAgentFinding(agentId: string, finding: string): void {
    const mem = this.agentMemories.get(agentId);
    if (mem) mem.previousFindings.push(finding);
  }

  setAgentProposal(agentId: string, proposal: string): void {
    const mem = this.agentMemories.get(agentId);
    if (mem) mem.currentProposal = proposal;
  }

  addAgentFeedback(agentId: string, feedback: { fromAgentId: string; fromAgentName: string; content: string; type: 'critique' | 'challenge' | 'suggestion' }): void {
    const mem = this.agentMemories.get(agentId);
    if (mem) {
      mem.feedbackReceived.push({
        ...feedback,
        timestamp: new Date(),
      });
    }
  }

  addAgentToolResult(agentId: string, result: { toolId: string; toolName: string; input: string; output: string }): void {
    const mem = this.agentMemories.get(agentId);
    if (mem) {
      mem.toolResults.push({
        ...result,
        timestamp: new Date(),
      });
    }
  }

  addAgentChallenge(agentId: string, challenge: string): void {
    const mem = this.agentMemories.get(agentId);
    if (mem) mem.challengesReceived.push(challenge);
  }

  addAgentRevision(agentId: string, revision: { version: number; previousContent: string; newContent: string; reason: string; triggeredBy: string }): void {
    const mem = this.agentMemories.get(agentId);
    if (mem) {
      mem.revisionHistory.push({
        ...revision,
        timestamp: new Date(),
      });
    }
  }

  // ---- Context Building ----
  // Builds selective context for an agent based on their role and the current phase.
  // Does NOT dump the entire conversation history.

  buildContextForAgent(agentId: string, phase: ArenaPhase): string {
    const agentMem = this.getAgentMemory(agentId);
    const global = this.globalMemory;
    
    const sections: string[] = [];

    // Always include the challenge
    sections.push(`CHALLENGE: ${global.challenge}`);
    
    // Include constraints
    if (global.constraints.length > 0) {
      sections.push(`CONSTRAINTS:\n${global.constraints.map(c => `- ${c}`).join('\n')}`);
    }

    // Include subproblems
    if (global.subproblems.length > 0) {
      sections.push(`SUBPROBLEMS:\n${global.subproblems.map(s => `- ${s}`).join('\n')}`);
    }

    // Phase-specific context
    switch (phase) {
      case 'investigate':
        // Give them the subproblems to investigate
        if (global.importantFacts.length > 0) {
          sections.push(`KNOWN FACTS:\n${global.importantFacts.map(f => `- ${f}`).join('\n')}`);
        }
        break;
      
      case 'propose':
        // Give evidence found during investigation
        if (global.evidence.length > 0) {
          const relevantEvidence = global.evidence.slice(-10);
          sections.push(`EVIDENCE:\n${relevantEvidence.map(e => `- [${e.agentId}] ${e.content}`).join('\n')}`);
        }
        break;
      
      case 'debate':
      case 'critique':
        // Give proposals to debate/critique
        if (global.proposals.length > 0) {
          sections.push(`PROPOSALS:\n${global.proposals.map(p => `[${p.agentName}]: ${p.content}`).join('\n\n')}`);
        }
        break;
      
      case 'revise':
        // Give agent their proposal + critiques received
        if (agentMem?.currentProposal) {
          sections.push(`YOUR CURRENT PROPOSAL:\n${agentMem.currentProposal}`);
        }
        if (agentMem && agentMem.feedbackReceived.length > 0) {
          sections.push(`FEEDBACK RECEIVED:\n${agentMem.feedbackReceived.map(f => `[${f.fromAgentName}] (${f.type}): ${f.content}`).join('\n')}`);
        }
        break;
      
      case 'judge':
      case 'synthesize':
        // Give everything for final synthesis
        if (global.proposals.length > 0) {
          sections.push(`ALL PROPOSALS:\n${global.proposals.map(p => `[${p.agentName} v${p.version}]: ${p.content}`).join('\n\n')}`);
        }
        if (global.critiques.length > 0) {
          sections.push(`CRITIQUES:\n${global.critiques.map(c => `[${c.fromAgentName}→${c.targetAgentId}] (${c.severity}): ${c.content}`).join('\n')}`);
        }
        if (global.evidence.length > 0) {
          sections.push(`KEY EVIDENCE:\n${global.evidence.map(e => `- ${e.content}`).join('\n')}`);
        }
        break;
    }

    // Include agent's own findings
    if (agentMem && agentMem.previousFindings.length > 0) {
      sections.push(`YOUR PREVIOUS FINDINGS:\n${agentMem.previousFindings.map(f => `- ${f}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }
}
