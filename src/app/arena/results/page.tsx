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
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
  Users,
  Target,
  Play,
  Home,
  Copy,
  Check,
  Sparkles,
  Layers,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useArenaStore } from '@/lib/store';
import { FormattedContent } from '@/components/FormattedContent';
import type { LeaderboardEntry, TimelineEntry } from '@/types/arena';

// ---- Score Bar Component ----
function ScoreBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--muted)] w-28 flex-shrink-0">{label}</span>
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
        className="text-xs font-mono w-8 text-right font-medium"
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
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="6"
        />
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
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
        <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider font-semibold">confidence</span>
      </div>
    </div>
  );
}

// ---- Leaderboard ----
function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(entries[0]?.teamId || null);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.teamId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="card overflow-hidden border-[var(--border-bright)]"
        >
          <button
            onClick={() => setExpanded(expanded === entry.teamId ? null : entry.teamId)}
            className="w-full flex items-center gap-3 text-left p-1"
          >
            <span className="text-2xl">{medals[i] || `#${entry.rank}`}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{entry.teamName}</h4>
                {i === 0 && <span className="badge badge-success text-[10px]">Top Ranked Solution</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="score-bar flex-1 max-w-40">
                  <motion.div
                    className="score-bar-fill"
                    style={{
                      backgroundColor:
                        i === 0 ? 'var(--success)' : i === 1 ? 'var(--accent)' : 'var(--warning)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.overallScore}%` }}
                    transition={{ delay: i * 0.15 + 0.3, duration: 1 }}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-[var(--foreground)]">{entry.overallScore}/100</span>
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
              className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 rounded-lg bg-[var(--background)] border border-[var(--border-color)]">
                <ScoreBar label="Feasibility" value={entry.scores.feasibility} color="var(--info)" delay={0} />
                <ScoreBar label="Evidence" value={entry.scores.evidence} color="var(--success)" delay={0.05} />
                <ScoreBar label="Originality" value={entry.scores.originality} color="var(--accent)" delay={0.1} />
                <ScoreBar label="Cost Efficiency" value={entry.scores.costEfficiency} color="var(--warning)" delay={0.15} />
                <ScoreBar label="Risk Mitigation" value={entry.scores.risk} color="var(--danger)" delay={0.2} />
                <ScoreBar label="Market Impact" value={entry.scores.impact} color="#8b5cf6" delay={0.25} />
              </div>

              {entry.proposal && (
                <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Team Proposal Breakdown
                  </p>
                  <FormattedContent content={entry.proposal} />
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
  const meaningfulEvents = timeline.filter(
    (t) => ['high', 'critical'].includes(t.impact) || t.event === 'ARENA_PHASE_CHANGED'
  );

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-[var(--border-bright)]" />

      <div className="space-y-5">
        {meaningfulEvents.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative"
          >
            {/* Timeline dot */}
            <div
              className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-[var(--surface)]"
              style={{
                borderColor:
                  entry.impact === 'critical'
                    ? 'var(--danger)'
                    : entry.impact === 'high'
                    ? 'var(--warning)'
                    : 'var(--accent)',
              }}
            />

            <div className="card p-3 rounded-lg border-[var(--border-color)] bg-[var(--surface)]">
              <div className="flex items-center justify-between mb-1">
                {entry.agentName ? (
                  <span className="badge badge-accent text-[10px]">{entry.agentName}</span>
                ) : (
                  <span className="badge badge-info text-[10px]">Phase Shift</span>
                )}
                <span className="text-[9px] text-[var(--muted)] font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-[var(--foreground)] leading-relaxed">{entry.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---- Voting Summary ----
function VotingSummary({
  events,
}: {
  events: { agentId: string; agentName: string; vote: 'approve' | 'reject'; reason: string }[];
}) {
  const approvals = events.filter((e) => e.vote === 'approve');
  const rejections = events.filter((e) => e.vote === 'reject');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-bright)]">
        <div className="flex items-center gap-2.5 text-[var(--success)]">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-2xl font-bold">{approvals.length}</span>
          <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
        </div>
        <div className="h-8 w-px bg-[var(--border-color)]" />
        <div className="flex items-center gap-2.5 text-[var(--danger)]">
          <XCircle className="w-5 h-5" />
          <span className="text-2xl font-bold">{rejections.length}</span>
          <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {events.map((ev, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border ${
              ev.vote === 'approve'
                ? 'border-[var(--success)]/30 bg-[var(--success)]/5'
                : 'border-[var(--danger)]/30 bg-[var(--danger)]/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[var(--foreground)]">{ev.agentName}</span>
              <span
                className={`badge text-[10px] uppercase font-bold flex items-center gap-1 ${
                  ev.vote === 'approve' ? 'badge-success' : 'badge-danger'
                }`}
              >
                {ev.vote === 'approve' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {ev.vote}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{ev.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main Results Page ----
export default function ResultsPage() {
  const router = useRouter();
  const { result, config, events, reset } = useArenaStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'leaderboard' | 'voting'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!result || !config) {
      router.push('/arena/new');
    }
  }, [result, config, router]);

  if (!result || !config) return null;

  // Extract voting events
  const votingEvent = events.find((e) => e.type === 'ARENA_VOTING_COMPLETED') as
    | { votes: Array<{ agentId: string; agentName: string; vote: 'approve' | 'reject'; reason: string }> }
    | undefined;

  const tabs = [
    { id: 'overview' as const, label: 'Overview & Findings', icon: Target },
    { id: 'timeline' as const, label: 'Evolution Timeline', icon: Clock },
    ...(config.mode === 'competitive' && result.leaderboard
      ? [{ id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy }]
      : []),
    ...(votingEvent ? [{ id: 'voting' as const, label: 'Agent Voting', icon: Users }] : []),
  ];

  const handleCopySummary = () => {
    const text = `AGENT ARENA VERDICT\nChallenge: ${config.challenge}\nConfidence: ${result.confidence}%\n\nRECOMMENDATION:\n${result.recommendation}\n\nKEY FINDINGS:\n${result.keyFindings.join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Hero Header */}
      <section className="border-b border-[var(--border-color)] px-6 py-10 bg-[var(--surface)]/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-dim)] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--accent)]">
                  {config.mode.toUpperCase()} ARENA CONVERGENCE
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]">
                Synthesis & Strategic Verdict
              </h1>
              <p className="text-xs md:text-sm text-[var(--muted)] max-w-xl line-clamp-2">
                {config.challenge}
              </p>
            </div>

            {/* Confidence Gauge */}
            <div className="flex items-center gap-4 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border-bright)] shadow-lg flex-shrink-0">
              <ConfidenceRing confidence={result.confidence} />
              <div className="text-left space-y-1">
                <div className="text-xs text-[var(--muted)]">Status</div>
                <div className="badge badge-success text-xs font-semibold">Converged</div>
                <div className="text-[10px] text-[var(--muted)]">{result.agentScores.length} Agents Evaluated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="border-b border-[var(--border-color)] px-6 bg-[var(--surface)] sticky top-14 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopySummary}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Copy formatted summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <section className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ============================================================ */}
          {/* OVERVIEW TAB */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Final Recommendation Card */}
              <div className="card glow-accent border-[var(--accent)]/40 p-6 rounded-2xl bg-gradient-to-b from-[var(--surface-hover)] to-[var(--surface)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-bright)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)]">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-[var(--foreground)] uppercase">
                        Final Recommendation
                      </h3>
                      <p className="text-[11px] text-[var(--muted)]">Synthesized by Decision & Judge Agents</p>
                    </div>
                  </div>
                  <span className="badge badge-accent text-xs font-semibold">
                    {result.confidence}% Confidence
                  </span>
                </div>

                <div className="pt-1">
                  <FormattedContent content={result.recommendation} />
                </div>
              </div>

              {/* Key Findings Section */}
              {result.keyFindings.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--foreground)] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                      Key Findings & Domain Breakdown
                    </h3>
                    <span className="badge badge-info text-[10px]">{result.keyFindings.length} Insights</span>
                  </div>

                  <div className="space-y-4">
                    {result.keyFindings.map((finding, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card p-5 rounded-xl border-[var(--border-bright)] hover:border-[var(--accent)]/40 transition-colors"
                      >
                        <FormattedContent content={finding} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks & Mitigation Section */}
              {result.risks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--warning)] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                      Critical Risks & Adversarial Critiques
                    </h3>
                    <span className="badge badge-warning text-[10px]">{result.risks.length} Flagged Risks</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.risks.map((risk, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card p-4 rounded-xl border-[var(--warning)]/30 bg-[var(--warning)]/5 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-[var(--warning)] font-semibold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Vulnerability #{i + 1}</span>
                        </div>
                        <FormattedContent content={risk} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions Section */}
              {result.assumptions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--info)] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--info)]" />
                      Key Hypotheses & Working Assumptions
                    </h3>
                    <span className="badge badge-info text-[10px]">{result.assumptions.length} Verified</span>
                  </div>

                  <div className="card p-4 rounded-xl border-[var(--border-color)] bg-[var(--surface)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.assumptions.map((assumption, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-[var(--background)] border border-[var(--border-color)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--info)] mt-2 flex-shrink-0" />
                          <p className="text-xs text-[var(--foreground)] opacity-90 leading-relaxed">{assumption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Performance Scorecards */}
              {result.agentScores.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--foreground)] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                      Agent Performance & Contribution
                    </h3>
                    <span className="text-[10px] text-[var(--muted)] font-mono">Weighted Contribution (0-100)</span>
                  </div>

                  <div className="card p-5 rounded-xl border-[var(--border-bright)] space-y-3">
                    <div className="space-y-3">
                      {result.agentScores.map((score, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-xs font-medium text-[var(--foreground)] w-36 truncate flex-shrink-0">
                            {score.agentName}
                          </span>
                          <div className="flex-1 score-bar">
                            <motion.div
                              className="score-bar-fill bg-[var(--accent)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${score.contribution}%` }}
                              transition={{ delay: i * 0.08, duration: 0.8 }}
                            />
                          </div>
                          <span className="text-xs font-mono font-semibold w-10 text-right text-[var(--accent)]">
                            {Math.round(score.contribution)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* TIMELINE TAB */}
          {/* ============================================================ */}
          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                Decision Evolution Timeline
              </h3>
              <EvolutionTimeline timeline={result.timeline} />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* LEADERBOARD TAB */}
          {/* ============================================================ */}
          {activeTab === 'leaderboard' && result.leaderboard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                Competitive Team Rankings & Scores
              </h3>
              <Leaderboard entries={result.leaderboard} />
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* VOTING TAB */}
          {/* ============================================================ */}
          {activeTab === 'voting' && votingEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                Autonomous Agent Consensus Votes
              </h3>
              <VotingSummary events={votingEvent.votes} />
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom Navigation */}
      <section className="border-t border-[var(--border-color)] px-6 py-6 bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              reset();
              router.push('/arena/new');
            }}
            className="btn-primary text-xs py-2 px-5 glow-accent flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Launch Another Arena
          </button>

          <button
            onClick={() => {
              reset();
              router.push('/');
            }}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
        </div>
      </section>
    </main>
  );
}
