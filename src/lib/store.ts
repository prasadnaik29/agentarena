// ============================================================
// Arena Store — Global state management with Zustand
// ============================================================

import { create } from 'zustand';
import type { ArenaConfig, ArenaPhase, ArenaResult, ArenaStatus } from '@/types/arena';
import type { AgentConfig, AgentStatus } from '@/types/agent';
import type { ArenaEvent } from '@/types/events';

export interface AgentUIState {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  currentTask?: string;
  messages: Array<{ content: string; type: string; timestamp: Date }>;
  vote?: 'approve' | 'reject';
  voteReason?: string;
}

export interface ArenaStore {
  // Arena state
  status: ArenaStatus;
  config: ArenaConfig | null;
  agents: AgentConfig[];
  agentStates: Map<string, AgentUIState>;
  currentPhase: ArenaPhase | null;
  events: ArenaEvent[];
  result: ArenaResult | null;
  error: string | null;

  // Arena screen
  selectedAgentId: string | null;
  isReplay: boolean;
  replayIndex: number;

  // Actions
  setConfig: (config: ArenaConfig) => void;
  setAgents: (agents: AgentConfig[]) => void;
  addAgent: (agent: AgentConfig) => void;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<AgentConfig>) => void;
  startArena: () => void;
  handleEvent: (event: ArenaEvent) => void;
  setResult: (result: ArenaResult) => void;
  setError: (error: string) => void;
  selectAgent: (agentId: string | null) => void;
  reset: () => void;
  startReplay: () => void;
  nextReplayStep: () => void;
  stopReplay: () => void;
}

const initialState = {
  status: 'draft' as ArenaStatus,
  config: null,
  agents: [],
  agentStates: new Map<string, AgentUIState>(),
  currentPhase: null,
  events: [],
  result: null,
  error: null,
  selectedAgentId: null,
  isReplay: false,
  replayIndex: 0,
};

export const useArenaStore = create<ArenaStore>((set, get) => ({
  ...initialState,

  setConfig: (config) => set({ config }),
  
  setAgents: (agents) => set({ agents }),
  
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  
  removeAgent: (agentId) => set((state) => ({ 
    agents: state.agents.filter(a => a.id !== agentId) 
  })),
  
  updateAgent: (agentId, updates) => set((state) => ({
    agents: state.agents.map(a => a.id === agentId ? { ...a, ...updates } : a),
  })),
  
  startArena: () => {
    const agents = get().agents;
    const newAgentStates = new Map<string, AgentUIState>();
    
    for (const agent of agents) {
      newAgentStates.set(agent.id, {
        id: agent.id,
        config: agent,
        status: 'idle',
        messages: [],
      });
    }
    
    set({ 
      status: 'running',
      agentStates: newAgentStates,
      events: [],
      result: null,
      error: null,
      currentPhase: 'decompose',
    });
  },

  handleEvent: (event) => {
    set((state) => {
      const newEvents = [...state.events, event];
      const newAgentStates = new Map(state.agentStates);
      let newPhase = state.currentPhase;

      switch (event.type) {
        case 'AGENT_STARTED': {
          const existing = newAgentStates.get(event.agentId);
          if (existing) {
            newAgentStates.set(event.agentId, { ...existing, status: 'idle' });
          }
          break;
        }
        case 'AGENT_STATUS_CHANGED': {
          const existing = newAgentStates.get(event.agentId);
          if (existing) {
            newAgentStates.set(event.agentId, {
              ...existing,
              status: event.newStatus,
              currentTask: event.task,
            });
          }
          break;
        }
        case 'AGENT_MESSAGE': {
          const existing = newAgentStates.get(event.agentId);
          if (existing) {
            newAgentStates.set(event.agentId, {
              ...existing,
              messages: [...existing.messages, {
                content: event.summary,
                type: 'message',
                timestamp: event.timestamp,
              }],
            });
          }
          break;
        }
        case 'AGENT_VOTE': {
          const existing = newAgentStates.get(event.agentId);
          if (existing) {
            newAgentStates.set(event.agentId, {
              ...existing,
              vote: event.vote,
              voteReason: event.reason,
            });
          }
          break;
        }
        case 'ARENA_PHASE_CHANGED': {
          newPhase = event.newPhase;
          break;
        }
      }

      return {
        events: newEvents,
        agentStates: newAgentStates,
        currentPhase: newPhase,
      };
    });
  },

  setResult: (result) => set({ result, status: 'completed' }),
  
  setError: (error) => set({ error, status: 'failed' }),
  
  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
  
  reset: () => set(initialState),

  startReplay: () => set({ isReplay: true, replayIndex: 0 }),

  nextReplayStep: () => {
    const { replayIndex, events } = get();
    if (replayIndex < events.length - 1) {
      set({ replayIndex: replayIndex + 1 });
    } else {
      set({ isReplay: false });
    }
  },

  stopReplay: () => set({ isReplay: false }),
}));
