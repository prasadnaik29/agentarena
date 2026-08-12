'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Wrench, X, Plus, RotateCcw } from 'lucide-react';
import { useArenaStore } from '@/lib/store';
import { AGENT_ROLE_TEMPLATES } from '@/types/agent';
import { TOOL_LABELS } from '@/types/tools';
import { useEffect } from 'react';

export default function ConfigurePage() {
  const router = useRouter();
  const { config, agents, setAgents, removeAgent, updateAgent, startArena } = useArenaStore();

  useEffect(() => {
    if (!config) {
      router.push('/arena/new');
    }
  }, [config, router]);

  if (!config) return null;

  const handleStart = () => {
    startArena();
    router.push('/arena/live');
  };

  const handleAutoRebuild = async () => {
    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) setAgents(data.agents);
    } catch (error) {
      console.error('Failed to rebuild team:', error);
    }
  };

  return (
    <main className="flex-1 flex flex-col px-6 py-12">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-accent">{config.mode}</span>
            {config.domain && <span className="badge badge-info">{config.domain}</span>}
          </div>
          <h1 className="text-2xl font-bold mb-2">Configure Agents</h1>
          <p className="text-sm text-[var(--muted)] line-clamp-2">{config.challenge}</p>
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <button onClick={handleAutoRebuild} className="btn-secondary text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            Auto Rebuild Team
          </button>
          <div className="flex-1" />
          <span className="text-xs text-[var(--muted)]">{agents.length} agents</span>
        </motion.div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="card relative group"
            >
              {/* Remove button */}
              <button
                onClick={() => removeAgent(agent.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-md bg-[var(--surface)] border border-[var(--border-color)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-[var(--danger)] hover:text-[var(--danger)]"
                aria-label={`Remove ${agent.name}`}
              >
                <X className="w-3 h-3" />
              </button>

              {/* Agent avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                >
                  {agent.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{agent.name}</h3>
                  <p className="text-xs text-[var(--muted)] capitalize">{agent.role}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--muted)] mb-3 line-clamp-2">{agent.description}</p>

              {/* Objectives */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Objectives</p>
                <ul className="space-y-0.5">
                  {agent.objectives.slice(0, 2).map((obj, j) => (
                    <li key={j} className="text-xs text-[var(--muted)] flex items-start gap-1">
                      <span className="text-[var(--accent)] mt-0.5">•</span>
                      <span className="line-clamp-1">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tools */}
              <div className="flex flex-wrap gap-1">
                {agent.toolIds.length > 0 ? (
                  agent.toolIds.map(toolId => (
                    <span key={toolId} className="badge badge-info flex items-center gap-1">
                      <Wrench className="w-2.5 h-2.5" />
                      {TOOL_LABELS[toolId] || toolId}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[var(--muted)]">No tools assigned</span>
                )}
              </div>

              {/* Temperature */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-[var(--muted)]">Temperature</span>
                <span className="text-[10px] font-mono text-[var(--accent)]">{agent.temperature}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <button
            onClick={handleStart}
            disabled={agents.length < 2}
            className="btn-primary text-base px-10 py-3.5 glow-accent"
          >
            <Play className="w-4 h-4" />
            START ARENA
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </main>
  );
}
