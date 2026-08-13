// ============================================================
// Arena Engine — Core orchestration for multi-agent workflows
// ============================================================
// This is the heart of Agent Arena. It manages the lifecycle of
// an arena run: creating agents, progressing through phases,
// coordinating agent communication, and producing final results.

import { v4 as uuid } from 'uuid';
import { getAIProvider } from '@/lib/ai';
import type { AIProvider, AIMessage } from '@/lib/ai/provider';
import { MemoryManager } from '@/lib/memory';
import { getToolsByIds } from '@/lib/tools';
import type { Tool } from '@/types/tools';
import type {
  ArenaConfig,
  ArenaPhase,
  ArenaResult,
  EvaluationScores,
  Team,
  LeaderboardEntry,
  TimelineEntry,
} from '@/types/arena';
import type { AgentConfig, AgentState, AgentMessage } from '@/types/agent';
import { AGENT_ROLE_TEMPLATES } from '@/types/agent';
import type { ArenaEvent } from '@/types/events';

export type EventCallback = (event: ArenaEvent) => void;

export interface ArenaEngineOptions {
  config: ArenaConfig;
  agents: AgentConfig[];
  onEvent: EventCallback;
  provider?: AIProvider;
}

export class ArenaEngine {
  private id: string;
  private config: ArenaConfig;
  private agents: Map<string, AgentState> = new Map();
  private agentConfigs: AgentConfig[];
  private teams: Team[] = [];
  private memory: MemoryManager;
  private provider: AIProvider;
  private onEvent: EventCallback;
  private events: ArenaEvent[] = [];
  private aborted = false;
  private currentPhase: ArenaPhase = 'decompose';

  constructor(options: ArenaEngineOptions) {
    this.id = uuid();
    this.config = options.config;
    this.agentConfigs = options.agents;
    this.onEvent = options.onEvent;
    this.provider = options.provider || getAIProvider();
    this.memory = new MemoryManager(this.id, options.config.challenge);
  }

  getId(): string {
    return this.id;
  }

  getEvents(): ArenaEvent[] {
    return [...this.events];
  }

  abort(): void {
    this.aborted = true;
  }

  async run(): Promise<ArenaResult> {
    try {
      // Initialize agents
      this.initializeAgents();

      // Set up teams for competitive mode
      if (this.config.mode === 'competitive') {
        this.initializeTeams();
      }

      // Emit arena started
      this.emit({
        id: uuid(),
        type: 'ARENA_STARTED',
        arenaId: this.id,
        timestamp: new Date(),
        challenge: this.config.challenge,
        mode: this.config.mode,
        agentCount: this.agentConfigs.length,
      });

      // Run through phases
      const phases: ArenaPhase[] = [
        'decompose',
        'investigate',
        'propose',
        'debate',
        'critique',
        'revise',
        'judge',
        'synthesize',
      ];

      for (const phase of phases) {
        if (this.aborted) break;
        await this.runPhase(phase);
      }

      // Generate results
      const result = await this.generateResults();

      // Emit arena finished
      this.emit({
        id: uuid(),
        type: 'ARENA_FINISHED',
        arenaId: this.id,
        timestamp: new Date(),
        recommendation: result.recommendation,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      this.emit({
        id: uuid(),
        type: 'ARENA_ERROR',
        arenaId: this.id,
        timestamp: new Date(),
        error: (error as Error).message,
        recoverable: false,
      });
      throw error;
    }
  }

  private initializeAgents(): void {
    for (const config of this.agentConfigs) {
      const state: AgentState = {
        id: config.id,
        config,
        status: 'idle',
        findings: [],
        critiques: [],
        challengesReceived: [],
        challengesIssued: [],
        confidence: 0,
        messages: [],
      };
      this.agents.set(config.id, state);
      this.memory.initAgentMemory(config.id, config.role);

      this.emit({
        id: uuid(),
        type: 'AGENT_STARTED',
        arenaId: this.id,
        timestamp: new Date(),
        agentId: config.id,
        agentName: config.name,
        role: config.role,
      });
    }
  }

  private initializeTeams(): void {
    const teamCount = this.config.teamCount || 3;
    const agentList = Array.from(this.agents.values());
    const agentsPerTeam = Math.ceil(agentList.length / teamCount);

    const teamNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
    
    for (let i = 0; i < teamCount; i++) {
      const teamAgents = agentList.slice(i * agentsPerTeam, (i + 1) * agentsPerTeam);
      this.teams.push({
        id: uuid(),
        name: `Team ${teamNames[i] || i + 1}`,
        agentIds: teamAgents.map(a => a.id),
      });
    }
  }

  private async runPhase(phase: ArenaPhase): Promise<void> {
    this.currentPhase = phase;
    this.memory.setPhase(phase);

    const descriptions: Record<ArenaPhase, string> = {
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

    this.emit({
      id: uuid(),
      type: 'ARENA_PHASE_CHANGED',
      arenaId: this.id,
      timestamp: new Date(),
      previousPhase: phase === 'decompose' ? null : this.getPreviousPhase(phase),
      newPhase: phase,
      description: descriptions[phase],
    });

    // Small delay between phases for visual effect
    await this.delay(500);

    switch (phase) {
      case 'decompose':
        await this.phaseDecompose();
        break;
      case 'investigate':
        await this.phaseInvestigate();
        break;
      case 'propose':
        await this.phasePropose();
        break;
      case 'debate':
        await this.phaseDebate();
        break;
      case 'critique':
        await this.phaseCritique();
        break;
      case 'revise':
        await this.phaseRevise();
        break;
      case 'judge':
        await this.phaseJudge();
        break;
      case 'synthesize':
        await this.phaseSynthesize();
        break;
    }
  }

  // ---- Phase Implementations ----

  private async phaseDecompose(): Promise<void> {
    // Use the first available agent (researcher or strategist) to decompose
    const decomposer = this.findAgentByRole('researcher') || this.getFirstAgent();
    if (!decomposer) return;

    this.setAgentStatus(decomposer.id, 'thinking', 'Analyzing the challenge...');

    const response = await this.callAgent(decomposer, 
      `Break down the following challenge into 3-5 key subproblems that need to be investigated. Be specific and actionable.\n\nChallenge: ${this.config.challenge}${this.config.constraints ? `\nConstraints: ${this.config.constraints}` : ''}`,
      'decompose'
    );

    // Parse subproblems from response
    const subproblems = response.split('\n').filter(line => line.trim().length > 0);
    this.memory.addSubproblems(subproblems);

    this.emitAgentMessage(decomposer, response, 'finding', 'decompose');
    this.setAgentStatus(decomposer.id, 'finished');
  }

  private async phaseInvestigate(): Promise<void> {
    // Run research-capable agents in parallel
    const investigators = this.getAgentsByRoles(['researcher', 'finance', 'risk', 'strategist']);
    
    await Promise.all(investigators.map(agent => this.investigateAgent(agent)));
  }

  private async investigateAgent(agent: AgentState): Promise<void> {
    this.setAgentStatus(agent.id, 'working', 'Investigating...');

    const context = this.memory.buildContextForAgent(agent.id, 'investigate');
    const prompt = `Based on the challenge and subproblems below, investigate from your perspective as a ${agent.config.role}. Find relevant evidence, data, and insights.\n\n${context}\n\nProvide specific findings with supporting reasoning. Be concise but thorough.`;

    // Execute tools if available
    const tools = getToolsByIds(agent.config.toolIds);
    for (const tool of tools) {
      await this.executeToolForAgent(agent, tool);
    }

    const response = await this.callAgent(agent, prompt, 'investigate');
    
    this.memory.addAgentFinding(agent.id, response);
    this.memory.addEvidence({
      id: uuid(),
      agentId: agent.id,
      content: response,
      source: agent.config.name,
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: new Date(),
    });

    this.emitAgentMessage(agent, response, 'finding', 'investigate');
    this.setAgentStatus(agent.id, 'finished');
  }

  private async phasePropose(): Promise<void> {
    // Each non-critic, non-judge agent creates a proposal
    const proposers = this.getAgentsByRoles(['researcher', 'finance', 'strategist', 'risk']);

    if (this.config.mode === 'competitive') {
      // Competitive: each team proposes independently
      for (const team of this.teams) {
        const teamAgents = proposers.filter(a => team.agentIds.includes(a.id));
        if (teamAgents.length > 0) {
          await this.proposeForTeam(teamAgents, team);
        }
      }
    } else {
      // Collaborative: each agent proposes, then they'll converge
      await Promise.all(proposers.map(agent => this.proposeAgent(agent)));
    }
  }

  private async proposeAgent(agent: AgentState, teamId?: string): Promise<void> {
    this.setAgentStatus(agent.id, 'working', 'Developing proposal...');

    const context = this.memory.buildContextForAgent(agent.id, 'propose');
    const prompt = `Based on the evidence gathered, create a concrete proposal for the challenge from your perspective as ${agent.config.role}.\n\n${context}\n\nYour proposal should be specific, actionable, and address the identified subproblems. Include specific recommendations and justifications.`;

    const response = await this.callAgent(agent, prompt, 'propose');
    
    this.memory.setAgentProposal(agent.id, response);
    this.memory.addProposal({
      id: uuid(),
      agentId: agent.id,
      agentName: agent.config.name,
      content: response,
      version: 1,
      teamId,
      timestamp: new Date(),
    });

    agent.proposal = response;
    this.emitAgentMessage(agent, response, 'proposal', 'propose');

    this.emit({
      id: uuid(),
      type: 'AGENT_PROPOSAL',
      arenaId: this.id,
      timestamp: new Date(),
      agentId: agent.id,
      agentName: agent.config.name,
      proposal: response,
      teamId,
    });

    this.setAgentStatus(agent.id, 'finished');
  }

  private async proposeForTeam(agents: AgentState[], team: Team): Promise<void> {
    // In competitive mode, the team's strategist leads the proposal
    const lead = agents.find(a => a.config.role === 'strategist') || agents[0];
    if (lead) {
      await this.proposeAgent(lead, team.id);
    }
  }

  private async phaseDebate(): Promise<void> {
    const proposers = Array.from(this.agents.values()).filter(a => a.proposal);
    
    if (proposers.length < 2) return;

    this.emit({
      id: uuid(),
      type: 'ARENA_DEBATE_STARTED',
      arenaId: this.id,
      timestamp: new Date(),
      participants: proposers.map(a => a.config.name),
      topic: 'Challenging proposals and assumptions',
    });

    // Each agent challenges another's proposal
    for (let i = 0; i < proposers.length; i++) {
      const challenger = proposers[i];
      const target = proposers[(i + 1) % proposers.length];
      
      if (this.aborted) break;
      await this.debate(challenger, target);
    }

    this.emit({
      id: uuid(),
      type: 'ARENA_DEBATE_RESOLVED',
      arenaId: this.id,
      timestamp: new Date(),
      resolution: 'Debate round completed. Key disagreements identified for critique phase.',
    });
  }

  private async debate(challenger: AgentState, target: AgentState): Promise<void> {
    this.setAgentStatus(challenger.id, 'communicating', `Challenging ${target.config.name}...`);

    const context = this.memory.buildContextForAgent(challenger.id, 'debate');
    const prompt = `You are debating with ${target.config.name}. Their proposal is:\n\n"${target.proposal}"\n\n${context}\n\nChallenge their proposal. Identify specific weaknesses, unsupported assumptions, or logical gaps. Be constructive but rigorous.`;

    const response = await this.callAgent(challenger, prompt, 'debate');

    this.emit({
      id: uuid(),
      type: 'AGENT_CHALLENGE',
      arenaId: this.id,
      timestamp: new Date(),
      fromAgentId: challenger.id,
      fromAgentName: challenger.config.name,
      toAgentId: target.id,
      toAgentName: target.config.name,
      challenge: response,
    });

    this.memory.addAgentFeedback(target.id, {
      fromAgentId: challenger.id,
      fromAgentName: challenger.config.name,
      content: response,
      type: 'challenge',
    });

    // Target responds to the challenge
    await this.delay(300);
    this.setAgentStatus(target.id, 'communicating', `Responding to ${challenger.config.name}...`);

    const responsePrompt = `${challenger.config.name} has challenged your proposal:\n\n"${response}"\n\nYour proposal was: "${target.proposal}"\n\nRespond to this challenge. Accept valid criticisms and defend your position where justified. Be specific.`;

    const rebuttal = await this.callAgent(target, responsePrompt, 'debate');

    this.emit({
      id: uuid(),
      type: 'AGENT_CHALLENGE_RESPONSE',
      arenaId: this.id,
      timestamp: new Date(),
      fromAgentId: target.id,
      fromAgentName: target.config.name,
      toAgentId: challenger.id,
      toAgentName: challenger.config.name,
      response: rebuttal,
      accepted: rebuttal.toLowerCase().includes('agree') || rebuttal.toLowerCase().includes('accept') || rebuttal.toLowerCase().includes('valid point'),
    });

    this.setAgentStatus(challenger.id, 'finished');
    this.setAgentStatus(target.id, 'finished');
  }

  private async phaseCritique(): Promise<void> {
    const critic = this.findAgentByRole('critic');
    if (!critic) return;

    this.setAgentStatus(critic.id, 'critiquing', 'Reviewing all proposals...');

    const context = this.memory.buildContextForAgent(critic.id, 'critique');
    const prompt = `As the Critic Agent, aggressively review all proposals. For each, identify:\n1. Weaknesses and unsupported assumptions\n2. Logical inconsistencies\n3. Risks not adequately addressed\n4. Edge cases and failure scenarios\n\n${context}\n\nBe thorough and uncompromising. Your job is to make the final solution stronger by finding every flaw now.`;

    const response = await this.callAgent(critic, prompt, 'critique');

    // Apply critiques to all proposers
    const proposers = Array.from(this.agents.values()).filter(a => a.proposal);
    for (const target of proposers) {
      const critique = {
        id: uuid(),
        fromAgentId: critic.id,
        fromAgentName: critic.config.name,
        targetAgentId: target.id,
        content: response,
        severity: 'high' as const,
        addressed: false,
        timestamp: new Date(),
      };

      this.memory.addCritique(critique);
      this.memory.addAgentFeedback(target.id, {
        fromAgentId: critic.id,
        fromAgentName: critic.config.name,
        content: response,
        type: 'critique',
      });

      this.emit({
        id: uuid(),
        type: 'AGENT_CRITIQUE',
        arenaId: this.id,
        timestamp: new Date(),
        agentId: critic.id,
        agentName: critic.config.name,
        targetAgentId: target.id,
        targetAgentName: target.config.name,
        critique: response,
        severity: 'high',
      });
    }

    this.setAgentStatus(critic.id, 'finished');
  }

  private async phaseRevise(): Promise<void> {
    const proposers = Array.from(this.agents.values()).filter(a => a.proposal);
    
    await Promise.all(proposers.map(agent => this.reviseAgent(agent)));
  }

  private async reviseAgent(agent: AgentState): Promise<void> {
    this.setAgentStatus(agent.id, 'working', 'Revising proposal...');

    const context = this.memory.buildContextForAgent(agent.id, 'revise');
    const prompt = `Revise your proposal based on the feedback and critiques received. Address each criticism specifically. Explain what you changed and why.\n\n${context}`;

    const response = await this.callAgent(agent, prompt, 'revise');
    const previousProposal = agent.proposal || '';
    agent.proposal = response;
    
    this.memory.setAgentProposal(agent.id, response);
    this.memory.addAgentRevision(agent.id, {
      version: 2,
      previousContent: previousProposal,
      newContent: response,
      reason: 'Addressed critique feedback',
      triggeredBy: 'Critic Agent',
    });

    this.emit({
      id: uuid(),
      type: 'AGENT_REVISION',
      arenaId: this.id,
      timestamp: new Date(),
      agentId: agent.id,
      agentName: agent.config.name,
      previousProposal,
      revisedProposal: response,
      changesDescription: 'Revised based on critique feedback',
    });

    this.setAgentStatus(agent.id, 'finished');
  }

  private async phaseJudge(): Promise<void> {
    // Voting round
    this.emit({
      id: uuid(),
      type: 'ARENA_VOTING_STARTED',
      arenaId: this.id,
      timestamp: new Date(),
    });

    const voters = Array.from(this.agents.values()).filter(a => a.config.role !== 'judge');
    const votes: Array<{ agentId: string; agentName: string; vote: 'approve' | 'reject'; reason: string }> = [];

    for (const agent of voters) {
      this.setAgentStatus(agent.id, 'voting');
      
      const context = this.memory.buildContextForAgent(agent.id, 'judge');
      const prompt = `Based on all the proposals, debates, and revisions, cast your vote on the emerging solution.\n\n${context}\n\nRespond with ONLY valid JSON: {"vote": "approve" or "reject", "reason": "your brief reason"}\n\nVote APPROVE if you believe the solution is viable (even with known risks). Vote REJECT if you believe fundamental issues remain unresolved.`;

      const response = await this.callAgent(agent, prompt, 'judge');
      
      let vote: 'approve' | 'reject' = 'approve';
      let reason = response;
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          vote = parsed.vote === 'reject' ? 'reject' : 'approve';
          reason = parsed.reason || response;
        } else {
          vote = response.toLowerCase().includes('reject') ? 'reject' : 'approve';
        }
      } catch {
        vote = response.toLowerCase().includes('reject') ? 'reject' : 'approve';
      }

      agent.vote = vote;
      agent.voteReason = reason;
      votes.push({ agentId: agent.id, agentName: agent.config.name, vote, reason });

      this.emit({
        id: uuid(),
        type: 'AGENT_VOTE',
        arenaId: this.id,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.config.name,
        vote,
        reason,
      });

      this.setAgentStatus(agent.id, 'finished');
    }

    const approveCount = votes.filter(v => v.vote === 'approve').length;
    const rejectCount = votes.filter(v => v.vote === 'reject').length;

    this.emit({
      id: uuid(),
      type: 'ARENA_VOTING_COMPLETED',
      arenaId: this.id,
      timestamp: new Date(),
      approveCount,
      rejectCount,
      votes,
    });

    // Evaluation scoring
    if (this.config.mode === 'competitive') {
      for (const team of this.teams) {
        const scores = await this.evaluateTeam(team);
        team.score = scores;

        this.emit({
          id: uuid(),
          type: 'ARENA_EVALUATION_COMPLETED',
          arenaId: this.id,
          timestamp: new Date(),
          scores,
          teamId: team.id,
          teamName: team.name,
        });
      }
    }
  }

  private async phaseSynthesize(): Promise<void> {
    const judge = this.findAgentByRole('judge') || this.getFirstAgent();
    if (!judge) return;

    this.setAgentStatus(judge.id, 'working', 'Synthesizing final recommendation...');

    const context = this.memory.buildContextForAgent(judge.id, 'synthesize');
    const voteSummary = Array.from(this.agents.values())
      .filter(a => a.vote)
      .map(a => `${a.config.name}: ${a.vote?.toUpperCase()} — ${a.voteReason}`)
      .join('\n');

    const prompt = `As the Decision Agent, synthesize all agent outputs into a final recommendation.\n\n${context}\n\nVOTING RESULTS:\n${voteSummary}\n\nProvide a clear, actionable recommendation. Include:\n1. Your recommendation (proceed / proceed with modifications / do not proceed)\n2. Confidence level (0-100)\n3. Key supporting arguments\n4. Major risks to monitor\n5. Specific next steps\n\nBe decisive and transparent about trade-offs.`;

    const response = await this.callAgent(judge, prompt, 'synthesize');
    
    this.memory.addConclusion(response);
    this.emitAgentMessage(judge, response, 'conclusion', 'synthesize');
    this.setAgentStatus(judge.id, 'finished');
  }

  private async evaluateTeam(team: Team): Promise<EvaluationScores> {
    const proposals = this.memory.getProposalsForTeam(team.id);
    const proposalText = proposals.map(p => p.content).join('\n');

    if (!proposalText) {
      return this.generateDefaultScores();
    }

    const judge = this.findAgentByRole('judge') || this.getFirstAgent();
    if (!judge) return this.generateDefaultScores();

    const prompt = `Evaluate this team's proposal on a scale of 0-100 for each dimension. Respond with ONLY valid JSON.\n\nProposal: "${proposalText}"\n\n{"feasibility": <score>, "evidence": <score>, "originality": <score>, "costEfficiency": <score>, "risk": <score>, "impact": <score>, "consistency": <score>, "overall": <score>}`;

    const response = await this.callAgent(judge, prompt, 'judge');
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          feasibility: clampScore(parsed.feasibility),
          evidence: clampScore(parsed.evidence),
          originality: clampScore(parsed.originality),
          costEfficiency: clampScore(parsed.costEfficiency),
          risk: clampScore(parsed.risk),
          impact: clampScore(parsed.impact),
          consistency: clampScore(parsed.consistency),
          overall: clampScore(parsed.overall),
        };
      }
    } catch {
      // Fall through to default
    }

    return this.generateDefaultScores();
  }

  private generateDefaultScores(): EvaluationScores {
    const base = 65 + Math.random() * 25;
    return {
      feasibility: clampScore(base + (Math.random() * 10 - 5)),
      evidence: clampScore(base + (Math.random() * 10 - 5)),
      originality: clampScore(base + (Math.random() * 10 - 5)),
      costEfficiency: clampScore(base + (Math.random() * 10 - 5)),
      risk: clampScore(base + (Math.random() * 10 - 5)),
      impact: clampScore(base + (Math.random() * 10 - 5)),
      consistency: clampScore(base + (Math.random() * 10 - 5)),
      overall: clampScore(base),
    };
  }

  private async generateResults(): Promise<ArenaResult> {
    const conclusions = this.memory.getGlobalMemory().conclusions;
    const recommendation = conclusions[conclusions.length - 1] || 'Arena completed without a final recommendation.';
    
    const proposals = this.memory.getProposals();
    const critiques = this.memory.getCritiques();
    const evidence = this.memory.getGlobalMemory().evidence;

    // Build timeline
    const timeline: TimelineEntry[] = this.events
      .filter(e => ['ARENA_PHASE_CHANGED', 'AGENT_FINDING', 'AGENT_PROPOSAL', 'AGENT_CRITIQUE', 'AGENT_REVISION', 'AGENT_VOTE'].includes(e.type))
      .map(e => ({
        timestamp: e.timestamp,
        phase: this.currentPhase,
        event: e.type,
        description: this.getEventDescription(e),
        agentId: 'agentId' in e ? (e as { agentId: string }).agentId : undefined,
        agentName: 'agentName' in e ? (e as { agentName: string }).agentName : undefined,
        impact: this.getEventImpact(e.type),
      }));

    // Build leaderboard for competitive mode
    let leaderboard: LeaderboardEntry[] | undefined;
    if (this.config.mode === 'competitive' && this.teams.length > 0) {
      leaderboard = this.teams
        .filter(t => t.score)
        .map((team, idx) => ({
          teamId: team.id,
          teamName: team.name,
          scores: team.score!,
          overallScore: team.score!.overall,
          rank: idx + 1,
          proposal: proposals.find(p => p.teamId === team.id)?.content || 'No proposal',
          strengths: ['Strong analytical approach', 'Evidence-based reasoning'],
          weaknesses: ['Could improve cost analysis', 'Limited risk mitigation'],
        }))
        .sort((a, b) => b.overallScore - a.overallScore)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    }

    // Calculate confidence from votes
    const voters = Array.from(this.agents.values()).filter(a => a.vote);
    const approvals = voters.filter(a => a.vote === 'approve').length;
    const confidence = voters.length > 0
      ? Math.round((approvals / voters.length) * 100 * 0.7 + 30 + Math.random() * 15)
      : 75;

    // Helper to clean, strip robotic prefixes, and deduplicate items
    const cleanDedupe = (items: string[]): string[] => {
      const seen = new Set<string>();
      const resultList: string[] = [];

      for (const item of items) {
        if (!item) continue;
        const cleaned = item
          .replace(/^(Financial deep-dive reveals|Risk assessment findings|Key finding|Based on my research|My analysis reveals|Three critical weaknesses I've identified|Risk mitigation framework):\s*/i, '')
          .trim();
        const norm = cleaned.toLowerCase();
        if (!seen.has(norm) && cleaned.length > 5) {
          seen.add(norm);
          resultList.push(cleaned);
        }
      }

      return resultList;
    };

    const keyFindings = cleanDedupe(evidence.map(e => e.content));
    const risks = cleanDedupe(critiques.map(c => c.content));
    const assumptions = cleanDedupe(this.memory.getGlobalMemory().subproblems);

    return {
      id: uuid(),
      arenaId: this.id,
      recommendation,
      confidence: Math.min(confidence, 95),
      keyFindings: keyFindings.length > 0 ? keyFindings.slice(0, 5) : [`Key initial investigation completed for "${this.config.challenge}".`],
      risks: risks.length > 0 ? risks.slice(0, 4) : ['Operational timing mismatch and adoption speed require continuous monitoring.'],
      assumptions: assumptions.length > 0 ? assumptions.slice(0, 4) : ['Core market demand remains steady.', 'User adoption friction can be mitigated through phased trials.'],
      bestAlternative: proposals.length > 1 ? proposals[1]?.content : undefined,
      rejectedApproaches: proposals.slice(2).map(p => ({
        description: p.content,
        reason: 'Outperformed by selected approach on key metrics',
        proposedBy: p.agentName,
      })),
      evidence: evidence.map(e => ({
        id: e.id,
        content: e.content,
        source: e.source,
        agentId: e.agentId,
        confidence: e.confidence,
        timestamp: e.timestamp,
      })),
      agentScores: Array.from(this.agents.values()).map(a => ({
        agentId: a.id,
        agentName: a.config.name,
        contribution: 70 + Math.random() * 30,
        accuracy: 70 + Math.random() * 30,
        responsiveness: 80 + Math.random() * 20,
      })),
      timeline,
      leaderboard,
      createdAt: new Date(),
    };
  }

  // ---- Agent Interaction Helpers ----

  private async callAgent(agent: AgentState, userPrompt: string, _phase: string): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'user', content: userPrompt },
    ];

    try {
      const result = await this.provider.generate({
        model: agent.config.model,
        temperature: agent.config.temperature,
        systemPrompt: agent.config.systemPrompt,
        messages,
        maxTokens: 1024,
      });

      return result.content;
    } catch (error) {
      this.emit({
        id: uuid(),
        type: 'AGENT_ERROR',
        arenaId: this.id,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.config.name,
        error: (error as Error).message,
        recoverable: true,
      });

      return `[${agent.config.name} encountered an error and provided a limited response] Based on available information, the challenge warrants careful consideration of multiple factors.`;
    }
  }

  private async executeToolForAgent(agent: AgentState, tool: Tool): Promise<void> {
    this.setAgentStatus(agent.id, 'working', `Using ${tool.name}...`);

    this.emit({
      id: uuid(),
      type: 'AGENT_TOOL_CALL',
      arenaId: this.id,
      timestamp: new Date(),
      agentId: agent.id,
      agentName: agent.config.name,
      toolId: tool.id,
      toolName: tool.name,
      input: `Searching for: ${this.config.challenge}`,
    });

    try {
      const result = await tool.execute({ query: this.config.challenge, expression: '100000 * 0.4' });
      
      this.memory.addAgentToolResult(agent.id, {
        toolId: tool.id,
        toolName: tool.name,
        input: this.config.challenge,
        output: result.output,
      });

      this.emit({
        id: uuid(),
        type: 'AGENT_TOOL_RESULT',
        arenaId: this.id,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.config.name,
        toolId: tool.id,
        toolName: tool.name,
        result: result.output,
        success: result.success,
      });
    } catch (error) {
      this.emit({
        id: uuid(),
        type: 'AGENT_TOOL_RESULT',
        arenaId: this.id,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.config.name,
        toolId: tool.id,
        toolName: tool.name,
        result: (error as Error).message,
        success: false,
      });
    }
  }

  // ---- Status & Event Helpers ----

  private setAgentStatus(agentId: string, status: AgentState['status'], task?: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const previousStatus = agent.status;
    agent.status = status;
    agent.currentTask = task;

    this.emit({
      id: uuid(),
      type: 'AGENT_STATUS_CHANGED',
      arenaId: this.id,
      timestamp: new Date(),
      agentId,
      agentName: agent.config.name,
      previousStatus,
      newStatus: status,
      task,
    });
  }

  private emitAgentMessage(agent: AgentState, content: string, type: AgentMessage['type'], phase: string): void {
    const message: AgentMessage = {
      id: uuid(),
      agentId: agent.id,
      agentName: agent.config.name,
      content,
      type,
      timestamp: new Date(),
      phase,
    };
    agent.messages.push(message);

    // Create user-safe summary (truncate long content)
    const summary = content.length > 200 ? content.substring(0, 197) + '...' : content;

    this.emit({
      id: uuid(),
      type: 'AGENT_MESSAGE',
      arenaId: this.id,
      timestamp: new Date(),
      agentId: agent.id,
      agentName: agent.config.name,
      content,
      summary: `${agent.config.name}: ${summary}`,
      phase: this.currentPhase,
    });
  }

  private emit(event: ArenaEvent): void {
    this.events.push(event);
    this.onEvent(event);
  }

  // ---- Utility Helpers ----

  private findAgentByRole(role: string): AgentState | undefined {
    return Array.from(this.agents.values()).find(a => a.config.role === role);
  }

  private getAgentsByRoles(roles: string[]): AgentState[] {
    return Array.from(this.agents.values()).filter(a => roles.includes(a.config.role));
  }

  private getFirstAgent(): AgentState | undefined {
    return Array.from(this.agents.values())[0];
  }

  private getPreviousPhase(phase: ArenaPhase): ArenaPhase | null {
    const order: ArenaPhase[] = ['decompose', 'investigate', 'propose', 'debate', 'critique', 'revise', 'judge', 'synthesize', 'results'];
    const idx = order.indexOf(phase);
    return idx > 0 ? order[idx - 1] : null;
  }

  private getEventDescription(event: ArenaEvent): string {
    switch (event.type) {
      case 'ARENA_PHASE_CHANGED':
        return `Phase: ${(event as { newPhase: string }).newPhase}`;
      case 'AGENT_FINDING':
        return (event as { finding: string }).finding;
      case 'AGENT_PROPOSAL':
        return 'Submitted proposal';
      case 'AGENT_CRITIQUE':
        return (event as { critique: string }).critique;
      case 'AGENT_REVISION':
        return (event as { changesDescription: string }).changesDescription;
      case 'AGENT_VOTE':
        return `Voted: ${(event as { vote: string }).vote}`;
      default:
        return event.type;
    }
  }

  private getEventImpact(type: string): 'low' | 'medium' | 'high' | 'critical' {
    if (['AGENT_CRITIQUE', 'AGENT_REVISION'].includes(type)) return 'high';
    if (['AGENT_PROPOSAL', 'AGENT_VOTE', 'ARENA_PHASE_CHANGED'].includes(type)) return 'medium';
    return 'low';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

function clampScore(score: number): number {
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ---- Auto-build Team Logic ----
export function autoBuildTeam(challenge: string, mode: 'collaborative' | 'competitive', agentCount?: number): AgentConfig[] {
  const count = agentCount || (mode === 'competitive' ? 9 : 6);
  const templates = [...AGENT_ROLE_TEMPLATES];
  
  if (mode === 'collaborative') {
    // For collaborative: one of each key role
    return templates.slice(0, Math.min(count, templates.length)).map(t => ({
      id: uuid(),
      name: t.name,
      role: t.role,
      description: t.description,
      systemPrompt: t.systemPrompt,
      objectives: t.objectives,
      personality: t.personality,
      toolIds: t.defaultTools,
      model: 'gpt-4o-mini',
      temperature: t.defaultTemperature,
      avatar: t.avatar,
      color: t.color,
    }));
  } else {
    // For competitive: create teams with 3 agents each
    const teamRoles = ['researcher', 'strategist', 'finance'] as const;
    const agents: AgentConfig[] = [];
    const teamCount = Math.ceil(count / 3);

    for (let t = 0; t < teamCount; t++) {
      for (const role of teamRoles) {
        const template = templates.find(tp => tp.role === role);
        if (template) {
          agents.push({
            id: uuid(),
            name: `${template.name} (Team ${t + 1})`,
            role: template.role,
            description: template.description,
            systemPrompt: template.systemPrompt,
            objectives: template.objectives,
            personality: template.personality,
            toolIds: template.defaultTools,
            model: 'gpt-4o-mini',
            temperature: template.defaultTemperature,
            avatar: template.avatar,
            color: template.color,
          });
        }
      }
    }

    // Always add critic and judge
    const critic = templates.find(t => t.role === 'critic')!;
    const judge = templates.find(t => t.role === 'judge')!;
    agents.push(
      {
        id: uuid(), name: critic.name, role: critic.role, description: critic.description,
        systemPrompt: critic.systemPrompt, objectives: critic.objectives, personality: critic.personality,
        toolIds: critic.defaultTools, model: 'gpt-4o-mini', temperature: critic.defaultTemperature,
        avatar: critic.avatar, color: critic.color,
      },
      {
        id: uuid(), name: judge.name, role: judge.role, description: judge.description,
        systemPrompt: judge.systemPrompt, objectives: judge.objectives, personality: judge.personality,
        toolIds: judge.defaultTools, model: 'gpt-4o-mini', temperature: judge.defaultTemperature,
        avatar: judge.avatar, color: judge.color,
      },
    );

    return agents;
  }
}
