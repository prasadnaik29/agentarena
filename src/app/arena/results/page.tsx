'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  Shield,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  BarChart3,
  Users,
  Target,
  Play,
  Home,
} from 'lucide-react';
import { useArenaStore } from '@/lib/store';
import type { ArenaResult, EvaluationScores, LeaderboardEntry, TimelineEntry } from '@/types/arena';
import { ARENA_PHASE_LABELS } from '@/types/arena';

// ---- Score Bar Component ----
function ScoreBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--muted)] w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 score-bar">
        <motion.div
          className="score-bar-fill"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay, duration: 1, ease: 'easeOut' }}
        />
      </div>
      <motion.span
        className="text-xs font-mono w-8 text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5 }}
      >
        {value}
      </motion.span>
    </div>
  );
}

// ---- Confidence Ring ----
function ConfidenceRing({ confidence }: { confidence: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;
  
  const getColor = (val: number) => {
    if (val >= 80) return 'var(--success)';
    if (val >= 60) return 'var(--accent)';
    if (val >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="6"
        />
        <motion.circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke={getColor(confidence)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {confidence}%
        </motion.span>
        <span className="text-[9px] text-[var(--muted)] uppercase">confidence</span>
      </div>
    </div>
  );
}

// ---- Leaderboard ----
function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.teamId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="card overflow-hidden"
        >
          <button
            onClick={() => setExpanded(expanded === entry.teamId ? null : entry.teamId)}
            className="w-full flex items-center gap-3 text-left"
          >
            <span className="text-2xl">{medals[i] || `#${entry.rank}`}</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{entry.teamName}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="score-bar flex-1 max-w-32">
                  <motion.div
                    className="score-bar-fill"
                    style={{ backgroundColor: i === 0 ? 'var(--success)' : i === 1 ? 'var(--accent)' : 'var(--warning)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.overallScore}%` }}
                    transition={{ delay: i * 0.15 + 0.3, duration: 1 }}
                  />
                </div>
                <span className="text-sm font-mono font-bold">{entry.overallScore}</span>
              </div>
            </div>
            {expanded === entry.teamId ? (
              <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
            )}
          </button>

          {expanded === entry.teamId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-2"
            >
              <ScoreBar label="Feasibility" value={entry.scores.feasibility} color="var(--info)" delay={0} />
              <ScoreBar label="Evidence" value={entry.scores.evidence} color="var(--success)" delay={0.05} />
              <ScoreBar label="Originality" value={entry.scores.originality} color="var(--accent)" delay={0.1} />
              <ScoreBar label="Cost Efficiency" value={entry.scores.costEfficiency} color="var(--warning)" delay={0.15} />
              <ScoreBar label="Risk" value={entry.scores.risk} color="var(--danger)" delay={0.2} />
              <ScoreBar label="Impact" value={entry.scores.impact} color="#8b5cf6" delay={0.25} />
              <ScoreBar label="Consistency" value={entry.scores.consistency} color="#6366f1" delay={0.3} />

              {entry.proposal && (
                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-1">Proposal</p>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">{entry.proposal.substring(0, 300)}...</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ---- Evolution Timeline (What Changed?) ----
function EvolutionTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  const meaningfulEvents = timeline.filter(t => 
    ['high', 'critical'].includes(t.impact) || t.event === 'ARENA_PHASE_CHANGED'
  );

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-[var(--border-color)]" />

      <div className="space-y-4">
        {meaningfulEvents.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            {/* Timeline dot */}
            <div
              className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2"
              style={{
                borderColor: entry.impact === 'critical' ? 'var(--danger)' : 
                              entry.impact === 'high' ? 'var(--warning)' : 'var(--accent)',
                backgroundColor: entry.impact === 'critical' ? 'var(--danger)' :
                                  entry.impact === 'high' ? 'var(--warning)' : 'transparent',
              }}
            />

            <div>
              {entry.agentName && (
                <span className="text-[10px] font-semibold text-[var(--accent)]">{entry.agentName}</span>
              )}
              <p className="text-xs text-[var(--foreground)]">{entry.description}</p>
              <p className="text-[9px] text-[var(--muted)] font-mono mt-0.5">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---- Voting Summary ----
function VotingSummary({ events }: { events: { agentId: string; agentName: string; vote: 'approve' | 'reject'; reason: string }[] }) {
  const approvals = events.filter(e => e.vote === 'approve');
  const rejections = events.filter(e => e.vote === 'reject');

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-[var(--success)]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xl font-bold">{approvals.length}</span>
          <span className="text-xs">Approve</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--danger)]">
          <XCircle className="w-4 h-4" />
          <span className="text-xl font-bold">{rejections.length}</span>
          <span className="text-xs">Reject</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {events.map((ev, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg border ${
              ev.vote === 'approve'
                ? 'border-[var(--success)]/20 bg-[var(--success)]/5'
                : 'border-[var(--danger)]/20 bg-[var(--danger)]/5'
            }`}
          >
            <div className="flex items-center gap-1 mb-1">
              {ev.vote === 'approve' ? (
                <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
              ) : (
                <XCircle className="w-3 h-3 text-[var(--danger)]" />
              )}
              <span className="text-xs font-medium">{ev.agentName}</span>
            </div>
            <p className="text-[10px] text-[var(--muted)] line-clamp-2">{ev.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main Results Page ----
export default function ResultsPage() {
  const router = useRouter();
  const { result, config, events, reset, agentStates } = useArenaStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'leaderboard' | 'voting'>('overview');

  useEffect(() => {
    if (!result || !config) {
      router.push('/arena/new');
    }
  }, [result, config, router]);

  if (!result || !config) return null;

  // Extract voting events
  const votingEvent = events.find(e => e.type === 'ARENA_VOTING_COMPLETED') as 
    { votes: Array<{ agentId: string; agentName: string; vote: 'approve' | 'reject'; reason: string }> } | undefined;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Target },
    { id: 'timeline' as const, label: 'What Changed?', icon: Clock },
    ...(config.mode === 'competitive' && result.leaderboard ? [{ id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy }] : []),
    ...(votingEvent ? [{ id: 'voting' as const, label: 'Voting', icon: Users }] : []),
  ];

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Hero */}
      <section className="border-b border-[var(--border-color)] px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="text-5xl mb-4"
          >
            🏆
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-2"
          >
            ARENA COMPLETE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-[var(--muted)] mb-6 max-w-lg mx-auto"
          >
            {config.challenge}
          </motion.p>

          {/* Confidence Ring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <ConfidenceRing confidence={result.confidence} />
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-[var(--border-color)] px-6">
        <div className="max-w-4xl mx-auto flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <section className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Recommendation */}
              <div className="card glow-accent">
                <h3 className="text-xs uppercase tracking-wider text-[var(--accent)] mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Final Recommendation
                </h3>
                <p className="text-sm leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Key Findings */}
              {result.keyFindings.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                    Key Findings
                  </h3>
                  <div className="space-y-2">
                    {result.keyFindings.map((finding, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card text-xs leading-relaxed"
                      >
                        {finding}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {result.risks.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)]" />
                    Risks
                  </h3>
                  <div className="space-y-2">
                    {result.risks.map((risk, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card text-xs leading-relaxed border-[var(--warning)]/20"
                      >
                        {risk}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions */}
              {result.assumptions.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-[var(--info)]" />
                    Key Assumptions
                  </h3>
                  <ul className="space-y-1">
                    {result.assumptions.map((assumption, i) => (
                      <li key={i} className="text-xs text-[var(--muted)] flex items-start gap-2">
                        <span className="text-[var(--accent)]">•</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agent Scores */}
              {result.agentScores.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Agent Performance
                  </h3>
                  <div className="space-y-2">
                    {result.agentScores.map((score, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs w-32 flex-shrink-0">{score.agentName}</span>
                        <div className="flex-1 score-bar">
                          <motion.div
                            className="score-bar-fill bg-[var(--accent)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${score.contribution}%` }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                          />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{Math.round(score.contribution)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-sm font-semibold mb-4">Solution Evolution</h3>
              <EvolutionTimeline timeline={result.timeline} />
            </motion.div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && result.leaderboard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-sm font-semibold mb-4">Team Rankings</h3>
              <Leaderboard entries={result.leaderboard} />
            </motion.div>
          )}

          {/* Voting Tab */}
          {activeTab === 'voting' && votingEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-sm font-semibold mb-4">Agent Votes</h3>
              <VotingSummary events={votingEvent.votes} />
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom Actions */}
      <section className="border-t border-[var(--border-color)] px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => { reset(); router.push('/'); }}
            className="btn-secondary"
          >
            <Home className="w-4 h-4" />
            New Arena
          </button>
          <div className="flex-1" />
          <button
            onClick={() => { /* Replay would go here */ }}
            className="btn-secondary"
          >
            <Play className="w-4 h-4" />
            Replay Arena
          </button>
        </div>
      </section>
    </main>
  );
}
