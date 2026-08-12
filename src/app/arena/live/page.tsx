'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Activity,
  Clock,
  MessageSquare,
  ChevronRight,
  X,
  Wrench,
  Target,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useArenaStore, type AgentUIState } from '@/lib/store';
import type { ArenaEvent } from '@/types/events';
import type { ArenaResult, ArenaPhase } from '@/types/arena';
import {
  ARENA_PHASE_ORDER,
  ARENA_PHASE_LABELS,
  ARENA_PHASE_DESCRIPTIONS,
} from '@/types/arena';
import { AGENT_STATUS_COLORS } from '@/types/agent';

// ---- Custom Agent Node for React Flow ----
function AgentNodeComponent({ data }: { data: AgentUIState & { selected: boolean; onClick: () => void } }) {
  const statusColor = AGENT_STATUS_COLORS[data.status] || '#6b7280';
  const isActive = !['idle', 'finished'].includes(data.status);

  return (
    <div
      onClick={data.onClick}
      className={`agent-node ${data.status} cursor-pointer relative`}
      role="button"
      tabIndex={0}
      aria-label={`${data.config.name} - ${data.status}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--border-bright)] !border-0 !w-2 !h-2" />

      {/* Pulse ring for active agents */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ border: `2px solid ${statusColor}` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div
        className="w-20 h-20 rounded-xl bg-[var(--surface)] flex flex-col items-center justify-center gap-1 relative"
        style={{ border: `1.5px solid ${statusColor}40` }}
      >
        {/* Status dot */}
        <div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />

        <span className="text-2xl">{data.config.avatar}</span>
        <span className="text-[9px] font-medium text-[var(--foreground)] leading-tight text-center px-1 truncate w-full">
          {data.config.name.replace(' Agent', '')}
        </span>
      </div>

      {/* Task label */}
      {data.currentTask && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border-color)]"
        >
          {data.currentTask}
        </motion.div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--border-bright)] !border-0 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNodeComponent };

// ---- Phase Panel (Left) ----
function PhasePanel({ currentPhase }: { currentPhase: ArenaPhase | null }) {
  return (
    <div className="w-56 border-r border-[var(--border-color)] bg-[var(--surface)] p-4 overflow-y-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" />
        Arena Phases
      </h2>

      <div className="space-y-1">
        {ARENA_PHASE_ORDER.map((phase, i) => {
          const isActive = currentPhase === phase;
          const isPast = currentPhase ? ARENA_PHASE_ORDER.indexOf(currentPhase) > i : false;
          const isFuture = !isActive && !isPast;

          return (
            <motion.div
              key={phase}
              className={`phase-indicator ${isActive ? 'active' : ''} px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                  : isPast
                  ? 'text-[var(--success)] opacity-70'
                  : 'text-[var(--muted)] opacity-40'
              }`}
              animate={isActive ? { x: [0, 2, 0] } : {}}
              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
            >
              <div className="flex items-center gap-2">
                {isPast && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
                {isFuture && <div className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] opacity-40" />}
                <span className="text-xs font-medium">{ARENA_PHASE_LABELS[phase]}</span>
              </div>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-[10px] mt-1 ml-4 opacity-70"
                >
                  {ARENA_PHASE_DESCRIPTIONS[phase]}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Activity Feed (Right) ----
function ActivityFeed({ events }: { events: ArenaEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events.length]);

  const getEventIcon = (type: string) => {
    if (type.includes('PHASE')) return '⚡';
    if (type.includes('TOOL')) return '🔧';
    if (type.includes('CHALLENGE')) return '⚔️';
    if (type.includes('CRITIQUE')) return '🔍';
    if (type.includes('VOTE')) return '🗳️';
    if (type.includes('PROPOSAL')) return '📝';
    if (type.includes('REVISION')) return '✏️';
    if (type.includes('FINDING')) return '💡';
    if (type.includes('ERROR')) return '⚠️';
    if (type.includes('FINISHED')) return '✅';
    if (type.includes('STARTED')) return '🚀';
    return '📌';
  };

  const getEventText = (event: ArenaEvent): string => {
    switch (event.type) {
      case 'ARENA_STARTED':
        return `Arena started with ${event.agentCount} agents in ${event.mode} mode.`;
      case 'ARENA_PHASE_CHANGED':
        return `Phase → ${ARENA_PHASE_LABELS[event.newPhase]}`;
      case 'AGENT_STARTED':
        return `${event.agentName} joined the arena.`;
      case 'AGENT_STATUS_CHANGED':
        if (event.task) return `${event.agentName}: ${event.task}`;
        return `${event.agentName} is now ${event.newStatus}.`;
      case 'AGENT_MESSAGE':
        return event.summary;
      case 'AGENT_FINDING':
        return `${event.agentName} found: ${event.finding.substring(0, 120)}...`;
      case 'AGENT_PROPOSAL':
        return `${event.agentName} submitted a proposal.`;
      case 'AGENT_CHALLENGE':
        return `${event.fromAgentName} challenged ${event.toAgentName}.`;
      case 'AGENT_CHALLENGE_RESPONSE':
        return `${event.fromAgentName} responded to challenge.`;
      case 'AGENT_CRITIQUE':
        return `${event.agentName} critiqued ${event.targetAgentName}.`;
      case 'AGENT_REVISION':
        return `${event.agentName} revised their proposal.`;
      case 'AGENT_VOTE':
        return `${event.agentName} voted ${event.vote.toUpperCase()}.`;
      case 'AGENT_TOOL_CALL':
        return `${event.agentName} using ${event.toolName}...`;
      case 'AGENT_TOOL_RESULT':
        return `${event.agentName} received ${event.toolName} results.`;
      case 'AGENT_ERROR':
        return `⚠️ ${event.agentName}: ${event.error}`;
      case 'ARENA_VOTING_STARTED':
        return 'Voting has begun.';
      case 'ARENA_VOTING_COMPLETED':
        return `Voting complete: ${event.approveCount} approve, ${event.rejectCount} reject.`;
      case 'ARENA_DEBATE_STARTED':
        return `Debate: ${event.topic}`;
      case 'ARENA_DEBATE_RESOLVED':
        return `Debate resolved.`;
      case 'ARENA_EVALUATION_COMPLETED':
        return `${event.teamName || 'Team'} scored ${event.scores.overall}/100.`;
      case 'ARENA_FINISHED':
        return `Arena complete. Confidence: ${event.confidence}%`;
      case 'ARENA_ERROR':
        return `⚠️ Error: ${event.error}`;
      default:
        return event.type;
    }
  };

  // Filter out noisy status changes, keep meaningful events
  const visibleEvents = events.filter(e => {
    if (e.type === 'AGENT_STATUS_CHANGED') {
      const statusEvent = e as { task?: string; newStatus: string };
      return statusEvent.task || ['finished', 'error'].includes(statusEvent.newStatus);
    }
    return true;
  });

  return (
    <div className="w-72 border-l border-[var(--border-color)] bg-[var(--surface)] flex flex-col">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" />
          Live Activity
          <span className="badge badge-accent ml-auto">{visibleEvents.length}</span>
        </h2>
      </div>
      
      <div ref={feedRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {visibleEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="activity-item rounded-md"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs flex-shrink-0 mt-0.5">{getEventIcon(event.type)}</span>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--foreground)] leading-relaxed break-words">
                    {getEventText(event)}
                  </p>
                  <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- Agent Detail Panel ----
function AgentDetailPanel({ agent, onClose }: { agent: AgentUIState; onClose: () => void }) {
  const statusColor = AGENT_STATUS_COLORS[agent.status] || '#6b7280';

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute top-0 right-0 w-80 h-full bg-[var(--surface)] border-l border-[var(--border-color)] z-50 overflow-y-auto"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${agent.config.color}15`, border: `1px solid ${agent.config.color}30` }}
            >
              {agent.config.avatar}
            </div>
            <div>
              <h3 className="text-sm font-semibold">{agent.config.name}</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                <span className="text-[10px] capitalize" style={{ color: statusColor }}>{agent.status}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--surface-hover)] rounded" aria-label="Close panel">
            <X className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        {/* Role */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Role</p>
          <p className="text-xs">{agent.config.description}</p>
        </div>

        {/* Objectives */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Objectives
          </p>
          <ul className="space-y-1">
            {agent.config.objectives.map((obj, i) => (
              <li key={i} className="text-xs text-[var(--muted)] flex items-start gap-1">
                <span className="text-[var(--accent)]">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>

        {/* Vote */}
        {agent.vote && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Vote
            </p>
            <div className={`flex items-center gap-2 ${agent.vote === 'approve' ? 'vote-approve' : 'vote-reject'}`}>
              {agent.vote === 'approve' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="text-sm font-semibold uppercase">{agent.vote}</span>
            </div>
            {agent.voteReason && (
              <p className="text-xs text-[var(--muted)] mt-1">{agent.voteReason}</p>
            )}
          </div>
        )}

        {/* Messages */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Messages ({agent.messages.length})
          </p>
          <div className="space-y-2">
            {agent.messages.map((msg, i) => (
              <div key={i} className="p-2 rounded-md bg-[var(--background)] border border-[var(--border-color)]">
                <p className="text-[11px] text-[var(--foreground)] leading-relaxed">{msg.content}</p>
                <p className="text-[9px] text-[var(--muted)] font-mono mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main Live Arena Page ----
export default function LiveArenaPage() {
  const router = useRouter();
  const {
    config, agents, agentStates, currentPhase, events, result, status,
    handleEvent, setResult, setError, selectAgent, selectedAgentId,
  } = useArenaStore();

  const [hasStarted, setHasStarted] = useState(false);

  // Build React Flow nodes and edges from agent states
  const { flowNodes, flowEdges } = useMemo(() => {
    const agentArray = Array.from(agentStates.values());
    if (agentArray.length === 0) return { flowNodes: [], flowEdges: [] };

    // Position agents in a pleasing layout
    const positions = calculatePositions(agentArray.length);

    const nodes: Node[] = agentArray.map((agent, i) => ({
      id: agent.id,
      type: 'agentNode',
      position: positions[i],
      data: {
        ...agent,
        selected: selectedAgentId === agent.id,
        onClick: () => selectAgent(selectedAgentId === agent.id ? null : agent.id),
      },
      draggable: true,
    }));

    // Create edges between agents based on communication
    const edges: Edge[] = [];
    const edgeSet = new Set<string>();

    // Create logical connections based on phase flow
    for (let i = 0; i < agentArray.length; i++) {
      for (let j = i + 1; j < agentArray.length; j++) {
        const a = agentArray[i];
        const b = agentArray[j];
        const key = `${a.id}-${b.id}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            id: key,
            source: a.id,
            target: b.id,
            animated: a.status === 'communicating' || b.status === 'communicating',
            style: {
              stroke: a.status === 'communicating' || b.status === 'communicating'
                ? 'rgba(139, 92, 246, 0.5)' : 'rgba(42, 42, 58, 0.3)',
              strokeWidth: 1,
            },
          });
        }
      }
    }

    return { flowNodes: nodes, flowEdges: edges };
  }, [agentStates, selectedAgentId, selectAgent]);

  // Start the arena run
  useEffect(() => {
    if (!config || !agents.length || hasStarted) return;
    if (status !== 'running') {
      router.push('/arena/new');
      return;
    }

    setHasStarted(true);

    const startArena = async () => {
      try {
        const response = await fetch('/api/arena/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config, agents }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to start arena');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'ARENA_RESULT') {
                  setResult(data.result);
                } else {
                  handleEvent(data);
                }
              } catch {
                // Skip malformed events
              }
            }
          }
        }
      } catch (error) {
        setError((error as Error).message);
      }
    };

    startArena();
  }, [config, agents, hasStarted, status, router, handleEvent, setResult, setError]);

  // Navigate to results when complete
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => router.push('/arena/results'), 2000);
      return () => clearTimeout(timer);
    }
  }, [result, router]);

  if (!config) return null;

  const selectedAgent = selectedAgentId ? agentStates.get(selectedAgentId) : null;

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Top Bar */}
      <div className="h-12 border-b border-[var(--border-color)] bg-[var(--surface)] flex items-center px-4 gap-4 flex-shrink-0">
        <span className="text-sm font-semibold">Agent Arena</span>
        <span className="text-[10px] text-[var(--muted)] font-mono">
          {config.mode.toUpperCase()}
        </span>
        <div className="flex-1" />
        {currentPhase && (
          <span className="badge badge-accent animate-pulse-glow">
            {ARENA_PHASE_LABELS[currentPhase]}
          </span>
        )}
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => router.push('/arena/results')}
              className="btn-primary text-xs py-1.5 px-4"
            >
              View Results <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Phase Panel */}
        <PhasePanel currentPhase={currentPhase} />

        {/* Center: React Flow Graph */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            minZoom={0.5}
            maxZoom={1.5}
          >
            <Background color="var(--border-color)" gap={40} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>

          {/* Challenge display */}
          <div className="absolute bottom-4 left-4 right-4 glass rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Challenge</p>
            <p className="text-xs text-[var(--foreground)] line-clamp-2">{config.challenge}</p>
          </div>

          {/* Arena complete overlay */}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/80 z-40"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <p className="text-4xl mb-2">🏆</p>
                <h2 className="text-2xl font-bold mb-2">ARENA COMPLETE</h2>
                <p className="text-lg text-[var(--accent)]">Confidence: {result.confidence}%</p>
                <p className="text-xs text-[var(--muted)] mt-2">Redirecting to results...</p>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Right: Activity Feed OR Agent Detail */}
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <AgentDetailPanel
              key="detail"
              agent={selectedAgent}
              onClose={() => selectAgent(null)}
            />
          ) : (
            <ActivityFeed key="feed" events={events} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- Position Calculator ----
function calculatePositions(count: number): Array<{ x: number; y: number }> {
  // Create a diamond/hierarchical layout
  const centerX = 300;
  const centerY = 250;
  const radiusX = 200;
  const radiusY = 180;

  if (count <= 3) {
    return [
      { x: centerX, y: centerY - radiusY },
      { x: centerX - radiusX, y: centerY + radiusY * 0.5 },
      { x: centerX + radiusX, y: centerY + radiusY * 0.5 },
    ].slice(0, count);
  }

  if (count <= 6) {
    // Diamond layout
    return [
      { x: centerX, y: centerY - radiusY },              // top
      { x: centerX - radiusX, y: centerY - radiusY * 0.3 }, // upper left
      { x: centerX + radiusX, y: centerY - radiusY * 0.3 }, // upper right
      { x: centerX - radiusX * 0.8, y: centerY + radiusY * 0.3 }, // lower left
      { x: centerX + radiusX * 0.8, y: centerY + radiusY * 0.3 }, // lower right
      { x: centerX, y: centerY + radiusY },               // bottom
    ].slice(0, count);
  }

  // Circular layout for larger groups
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    });
  }
  return positions;
}
