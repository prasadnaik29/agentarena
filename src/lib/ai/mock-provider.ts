// ============================================================
// Mock Provider — Simulates realistic AI agent responses
// for development and demo without requiring API keys
// ============================================================
// CLEARLY MARKED AS MOCK — swap with OpenAIProvider for production

import type { AIProvider, AIGenerateOptions, AIStreamOptions, AIStructuredOptions, AIGenerateResult } from './provider';

const MOCK_DELAY_MS = 800;
const STREAM_CHUNK_DELAY_MS = 30;

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    await this.delay(MOCK_DELAY_MS + Math.random() * 500);
    
    const content = this.generateContextualResponse(options);
    
    return {
      content,
      model: 'mock-model',
      usage: {
        promptTokens: 100,
        completionTokens: content.length / 4,
        totalTokens: 100 + content.length / 4,
      },
    };
  }

  async stream(options: AIStreamOptions): Promise<AIGenerateResult> {
    const content = this.generateContextualResponse(options);
    const words = content.split(' ');
    
    let streamed = '';
    for (const word of words) {
      const chunk = (streamed ? ' ' : '') + word;
      streamed += chunk;
      options.onChunk?.(chunk);
      await this.delay(STREAM_CHUNK_DELAY_MS + Math.random() * 20);
    }

    return {
      content,
      model: 'mock-model',
    };
  }

  async structuredOutput<T>(options: AIStructuredOptions<T>): Promise<T> {
    await this.delay(MOCK_DELAY_MS);
    
    // Generate a mock JSON that matches the expected structure
    const content = this.generateContextualResponse(options);
    return options.parse(content);
  }

  private generateContextualResponse(options: AIGenerateOptions): string {
    const systemPrompt = options.systemPrompt || '';
    const lastMessage = options.messages[options.messages.length - 1]?.content || '';
    
    // Detect agent role from system prompt
    const role = this.detectRole(systemPrompt);
    // Detect phase from last message
    const phase = this.detectPhase(lastMessage);
    // Extract challenge topic
    const topic = this.extractTopic(systemPrompt, options.messages);
    
    return this.getResponse(role, phase, topic);
  }

  private extractTopic(systemPrompt: string, messages: Array<{ role: string; content: string }>): string {
    const fullText = [systemPrompt, ...messages.map(m => m.content)].join('\n');
    
    // Look for explicit CHALLENGE: tag
    const challengeMatch = fullText.match(/CHALLENGE:\s*([^\n.]+)/i);
    if (challengeMatch && challengeMatch[1].trim().length > 5) {
      return challengeMatch[1].trim();
    }
    
    // Look for user question or prompt line
    for (const msg of messages) {
      if (msg.role === 'user' && msg.content.length > 10) {
        const cleaned = msg.content
          .replace(/^(run|start|evaluate|solve|help me with|how to)\s+/i, '')
          .split(/[\n.?]/)[0]
          .trim();
        if (cleaned.length > 5 && cleaned.length < 80) {
          return cleaned;
        }
      }
    }

    return 'the target challenge';
  }

  private detectRole(systemPrompt: string): string {
    const lower = systemPrompt.toLowerCase();
    if (lower.includes('researcher') || lower.includes('market research')) return 'researcher';
    if (lower.includes('strateg')) return 'strategist';
    if (lower.includes('financ')) return 'finance';
    if (lower.includes('risk')) return 'risk';
    if (lower.includes('critic') || lower.includes('adversarial')) return 'critic';
    if (lower.includes('decision') || lower.includes('judge') || lower.includes('evaluator')) return 'judge';
    return 'general';
  }

  private detectPhase(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('decompose') || lower.includes('break down')) return 'decompose';
    if (lower.includes('investigate') || lower.includes('research')) return 'investigate';
    if (lower.includes('propose') || lower.includes('proposal')) return 'propose';
    if (lower.includes('debate') || lower.includes('challenge')) return 'debate';
    if (lower.includes('critique') || lower.includes('review')) return 'critique';
    if (lower.includes('revise') || lower.includes('improve')) return 'revise';
    if (lower.includes('judge') || lower.includes('evaluate') || lower.includes('score')) return 'judge';
    if (lower.includes('synthesize') || lower.includes('final')) return 'synthesize';
    if (lower.includes('vote')) return 'vote';
    return 'general';
  }

  private getResponse(role: string, phase: string, topic: string): string {
    // Return structured JSON for judge/vote
    if (role === 'judge' && phase === 'judge') {
      return JSON.stringify({
        feasibility: 82,
        evidence: 85,
        originality: 78,
        costEfficiency: 76,
        risk: 72,
        impact: 88,
        consistency: 81,
        overall: 80,
      });
    }

    if (role === 'judge' && phase === 'vote') {
      return JSON.stringify({
        vote: 'approve',
        reason: `The proposal provides a clear, actionable roadmap for "${topic}" with realistic risk mitigations and solid operational viability.`,
      });
    }

    if (role === 'judge' && phase === 'synthesize') {
      return `RECOMMENDATION FOR "${topic.toUpperCase()}": PROCEED WITH PHASED EXECUTION. Confidence: 84%.

After multi-agent synthesis, the optimal approach is a 3-stage rollout:
1. Phase 1 (Months 1-3): Initiate a targeted pilot to validate core assumptions and user adoption.
2. Phase 2 (Months 4-6): Refine operational workflows based on pilot metrics and scale capacity by 2.5x.
3. Phase 3 (Months 7-12): Full deployment with dedicated monitoring of cash flow and risk triggers.

Key Mitigations: Maintain a 15% contingency reserve, conduct bi-weekly audit reviews, and set explicit go/no-go gates at each phase transition.`;
    }

    // Role-specific, topic-tailored human-like statements
    const domainTemplates: Record<string, Record<string, string[]>> = {
      researcher: {
        decompose: [
          `To solve "${topic}", we must analyze three sub-problems: (1) Core user demand and key adoption friction, (2) Operational & technical prerequisites, and (3) Competitive/market alternatives.`,
        ],
        investigate: [
          `Research on "${topic}" shows strong potential demand. Early indicators suggest a 25-35% efficiency upside if implemented with clear user onboarding.`,
          `Analysis reveals two critical assumptions for "${topic}": user willingness to adopt new workflows and initial implementation speed.`,
        ],
        propose: [
          `For "${topic}", I propose an evidence-backed phased rollout: start with a focused pilot, validate user retention, then scale across secondary segments.`,
        ],
        debate: [
          `I urge caution regarding overly rapid expansion for "${topic}". Historical data shows that rushing deployment without pilot validation leads to a 30% drop in user retention.`,
        ],
        critique: [
          `The current assumptions for "${topic}" lack empirical benchmark validation. We need clear metrics before committing full resource allocation.`,
        ],
      },
      strategist: {
        decompose: [
          `Strategic breakdown for "${topic}": (1) Value proposition positioning, (2) Go-to-market execution, (3) Long-term defensibility & scale.`,
        ],
        propose: [
          `Recommended strategy for "${topic}": Target high-intent early adopters first to establish social proof and refine the core experience before broader outreach.`,
        ],
        debate: [
          `While a conservative approach limits exposure, first-mover execution on "${topic}" is essential. Capturing early momentum outweighs minor initial setup friction.`,
        ],
      },
      finance: {
        decompose: [
          `Financial breakdown for "${topic}": (1) Upfront capital expenditure, (2) Unit economics & operating expenses, (3) Cash flow trajectory to break-even.`,
        ],
        investigate: [
          `Financial assessment for "${topic}": Initial capital requirements will be front-loaded (approx 50-60% in early months). Projected break-even is achievable within 8 to 12 months under steady adoption.`,
        ],
        propose: [
          `Budget structure for "${topic}": Allocate 40% to core execution & delivery, 30% to user acquisition, 15% to infrastructure, and 15% as a risk reserve.`,
        ],
        debate: [
          `The proposed budget for "${topic}" needs a larger contingency buffer. Unforeseen operational delays could create a 15-20% cash flow gap if unaddressed.`,
        ],
      },
      risk: {
        decompose: [
          `Risk evaluation for "${topic}": (1) Execution risk during initial setup, (2) Cash flow timing, (3) User churn & resistance, (4) External market dependencies.`,
        ],
        investigate: [
          `Primary risk for "${topic}": Operational friction during early adoption. We recommend setting explicit SLA thresholds and automated performance triggers.`,
        ],
        propose: [
          `Risk mitigation plan for "${topic}": (1) Maintain 15% cash reserve, (2) Enforce stage-gate reviews at month 3 and 6, (3) Establish secondary operational partners.`,
        ],
        debate: [
          `We are underestimating external competitive response to "${topic}". We should build modular features that allow rapid pivoting if market conditions shift.`,
        ],
      },
      critic: {
        decompose: [
          `Challenging the core premise of "${topic}": Are we addressing the root cause or merely treating a symptom? We must ensure simplicity in design.`,
        ],
        critique: [
          `Key vulnerability in the plan for "${topic}": Onboarding complexity could cause initial friction. We need to simplify the user journey before scaling.`,
        ],
        debate: [
          `The proposal for "${topic}" assumes smooth execution across all teams, but cross-functional handoffs are where 40% of project delays occur.`,
        ],
      },
    };

    const roleMap = domainTemplates[role] || domainTemplates.researcher;
    const phaseList = roleMap[phase] || roleMap.investigate || roleMap.decompose || [
      `Analyzing "${topic}" from a ${role} perspective to provide actionable, evidence-based recommendations.`,
    ];

    const idx = Math.floor(Math.random() * phaseList.length);
    return phaseList[idx];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
