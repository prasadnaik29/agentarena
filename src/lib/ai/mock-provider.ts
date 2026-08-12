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
    
    return this.getResponse(role, phase, lastMessage);
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

  private getResponse(role: string, phase: string, context: string): string {
    const responses: Record<string, Record<string, string[]>> = {
      researcher: {
        decompose: [
          'I\'ve identified three key subproblems: (1) Market demand validation, (2) Competitive landscape analysis, (3) Target demographic profiling. Each requires independent investigation before we can form a coherent strategy.',
        ],
        investigate: [
          'Based on my research, the addressable market shows strong growth indicators. Key finding: The target segment has a 34% year-over-year growth rate, though market penetration remains below 12%. This suggests significant opportunity but also validates the need for careful market entry strategy.',
          'My analysis reveals three critical market assumptions that need validation: customer willingness to pay, expected adoption timeline, and channel effectiveness. Current data suggests the first assumption holds, but the latter two carry significant uncertainty.',
        ],
        propose: [
          'Based on evidence gathered, I propose a phased market entry approach: Phase 1 (months 1-3) focuses on a pilot in a single metro city to validate core assumptions. Phase 2 (months 4-6) expands to 3 tier-1 cities with validated pricing. Phase 3 (months 7-12) scales based on proven unit economics.',
        ],
        debate: [
          'I disagree with the aggressive timeline proposed. My research indicates similar market entries required 18-24 months for meaningful traction, not 12. The evidence supports a more conservative ramp-up.',
        ],
        critique: [
          'The revenue projections lack supporting evidence for the assumed 15% conversion rate. Industry benchmarks suggest 3-8% is more realistic for this segment. This fundamentally changes the financial model.',
        ],
        general: [
          'Analyzing the available data on this challenge. Initial findings suggest both opportunity and risk that need careful examination by the team.',
        ],
      },
      strategist: {
        decompose: [
          'From a strategic perspective, this challenge breaks into: (1) Market positioning, (2) Go-to-market strategy, (3) Competitive differentiation, (4) Resource allocation. The positioning decision cascades into all other strategic choices.',
        ],
        propose: [
          'I recommend a differentiation strategy focused on underserved segments. Specifically: target the mid-market with a premium-quality, competitively-priced offering. Key differentiator: superior user experience and localized features. Distribution through digital-first channels with strategic offline partnerships.',
        ],
        debate: [
          'While the conservative approach reduces risk, it also reduces first-mover advantage. I propose a balanced strategy: aggressive digital marketing spend in month 1-2 (40% of budget) to establish brand awareness, then shift to retention and organic growth. The cost of waiting exceeds the cost of early investment.',
        ],
        general: [
          'Developing strategic framework for this challenge. Evaluating multiple approaches against the given constraints and objectives.',
        ],
      },
      finance: {
        decompose: [
          'Financial analysis requires: (1) Cost structure breakdown, (2) Revenue model validation, (3) Unit economics analysis, (4) Cash flow projection, (5) Break-even analysis. Budget constraint is the binding factor here.',
        ],
        investigate: [
          'Financial deep-dive reveals: Operating costs will consume 65% of the budget in the first 6 months. Customer acquisition cost (CAC) is estimated at ₹850-1,200 per customer. With the current pricing model, break-even requires 2,400 paying customers — achievable by month 8 under optimistic scenarios, month 14 under realistic ones.',
        ],
        propose: [
          'Financial projection: With ₹10L budget, allocate 30% to development, 40% to marketing/acquisition, 15% to operations, 15% as reserve. Expected revenue trajectory: ₹0 (month 1-2), ₹1.5L/month (month 3-6), ₹4L/month (month 7-12). Break-even at month 10. Total first-year revenue: ₹22L. Net position: +₹12L.',
        ],
        debate: [
          'The marketing budget allocation of 40% is insufficient given current CAC estimates. My calculations show we need either: (a) 55% marketing spend, reducing development budget, or (b) a lower-cost acquisition channel. The current plan has a 23% budget overrun risk by month 6.',
        ],
        critique: [
          'The revenue projection assumes linear growth, but market data shows S-curve adoption. The first 3 months will likely generate 60% less revenue than projected. This creates a ₹3.2L cash flow gap that isn\'t addressed in the current plan.',
        ],
        general: [
          'Calculating financial feasibility. Initial numbers suggest the plan is viable but requires careful budget management and realistic growth assumptions.',
        ],
      },
      risk: {
        decompose: [
          'Risk analysis covers: (1) Market risk — demand may not materialize, (2) Financial risk — cash flow timing, (3) Operational risk — execution challenges, (4) Competitive risk — incumbent response, (5) Regulatory risk. Each requires separate assessment.',
        ],
        investigate: [
          'Risk assessment findings: HIGH RISK — Cash flow timing mismatch between marketing spend and revenue generation. MEDIUM RISK — Competitive response within 6 months of launch. MEDIUM RISK — Key personnel dependency. LOW RISK — Regulatory changes. The cash flow risk is the most critical and could derail the entire venture.',
        ],
        propose: [
          'Risk mitigation framework: (1) Maintain 15% budget reserve for cash flow gaps, (2) Sign 3 pilot customers before full launch to validate demand, (3) Establish contingency plan for competitive response, (4) Cross-train team members to reduce key-person dependency. Accept regulatory risk as low-probability.',
        ],
        debate: [
          'The proposed strategy underestimates competitive risk. Two established players have launched similar products in the last 6 months. Without a clear differentiation strategy, we risk being outspent 10:1. I recommend allocating specific budget for competitive intelligence and rapid pivoting capability.',
        ],
        general: [
          'Evaluating risk landscape for this challenge. Multiple risk vectors identified that require team discussion.',
        ],
      },
      critic: {
        decompose: [
          'Before decomposing, I want to challenge the problem statement itself. Are we asking the right question? The challenge assumes launch is a binary decision, but there may be intermediate options (soft launch, partnership, licensing) that deserve evaluation.',
        ],
        critique: [
          'Three critical weaknesses I\'ve identified: (1) The revenue model assumes a conversion rate 3x the industry average — unsupported by evidence. (2) The strategy ignores existing competitors\' likely response to market entry. (3) The financial plan has no contingency for delayed product-market fit. Each of these could independently cause failure.',
        ],
        debate: [
          'Both the optimistic and conservative proposals share a blind spot: neither adequately addresses customer retention after acquisition. Historical data shows 40-60% churn in the first 3 months for similar products. The financial model needs to account for this or the unit economics completely fall apart.',
        ],
        general: [
          'Reviewing all proposals for logical consistency and unsupported assumptions. Several weaknesses detected that need addressing.',
        ],
      },
      judge: {
        judge: [
          '{"feasibility": 78, "evidence": 82, "originality": 71, "costEfficiency": 74, "risk": 65, "impact": 83, "consistency": 76, "overall": 76}',
        ],
        synthesize: [
          'After weighing all agent inputs, my recommendation is: PROCEED WITH MODIFICATIONS. Confidence: 74%. The core opportunity is validated by market evidence, but the execution plan requires three critical adjustments: (1) Reduce initial scope to a single-city pilot before expansion, (2) Increase marketing budget allocation to 50% with a CAC-focused strategy, (3) Build in 3 explicit go/no-go decision points at months 3, 6, and 9. Key risks: cash flow timing and competitive response. These are manageable with the proposed mitigations but require active monitoring.',
        ],
        vote: [
          '{"vote": "approve", "reason": "The proposal addresses the core market opportunity and, with the recommended modifications for risk mitigation, presents a viable path forward. The remaining risks are manageable and the potential upside justifies proceeding."}',
        ],
        general: [
          'Evaluating all proposals against the challenge criteria. Synthesizing agent inputs into a balanced recommendation.',
        ],
      },
      general: {
        general: [
          'Analyzing the challenge from my area of expertise. I\'ll provide specific, actionable insights based on the available information.',
        ],
      },
    };

    const roleResponses = responses[role] || responses.general;
    const phaseResponses = roleResponses[phase] || roleResponses.general || responses.general.general;
    const idx = Math.floor(Math.random() * phaseResponses.length);
    
    return phaseResponses[idx];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
