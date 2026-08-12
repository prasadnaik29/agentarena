'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, Swords, Sparkles, Plus, Minus } from 'lucide-react';
import { useArenaStore } from '@/lib/store';
import { SAMPLE_CHALLENGES } from '@/types/arena';

function ArenaCreatorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setConfig, setAgents } = useArenaStore();

  const [challenge, setChallenge] = useState(searchParams.get('challenge') || '');
  const [mode, setMode] = useState<'collaborative' | 'competitive'>('collaborative');
  const [agentCount, setAgentCount] = useState(6);
  const [domain, setDomain] = useState('');
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuild = async () => {
    if (challenge.trim().length < 10) return;

    setLoading(true);
    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: challenge.trim(),
          mode,
          agentCount,
          domain: domain || undefined,
          constraints: constraints || undefined,
          teamCount: mode === 'competitive' ? 3 : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfig(data.config);
      setAgents(data.agents);
      router.push('/arena/configure');
    } catch (error) {
      console.error('Failed to build arena:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-2">Create Arena</h1>
          <p className="text-sm text-[var(--muted)]">
            Define a complex challenge and let specialized AI agents collaborate to solve it.
          </p>
        </motion.div>

        {/* Challenge Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label htmlFor="challenge" className="block text-sm font-medium mb-2">Challenge</label>
          <textarea
            id="challenge"
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            placeholder="e.g., Should a startup launch an AI-powered education platform for Indian college students with a ₹10 lakh initial budget?"
            rows={4}
            className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none placeholder:text-[var(--muted)]"
          />
          <p className="text-xs text-[var(--muted)] mt-1">{challenge.length}/500 characters</p>
        </motion.div>

        {/* Quick Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <p className="text-xs text-[var(--muted)] mb-2">Quick start:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CHALLENGES.map((sample, i) => (
              <button
                key={i}
                onClick={() => { setChallenge(sample.challenge); setDomain(sample.domain); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium mb-3">Arena Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setMode('collaborative'); setAgentCount(6); }}
              className={`card card-interactive text-left ${mode === 'collaborative' ? 'border-[var(--accent)] glow-accent' : ''}`}
            >
              <Users className={`w-5 h-5 mb-2 ${mode === 'collaborative' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <h3 className="text-sm font-semibold">Collaborative</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Agents work together toward one solution.</p>
            </button>

            <button
              onClick={() => { setMode('competitive'); setAgentCount(9); }}
              className={`card card-interactive text-left ${mode === 'competitive' ? 'border-[var(--accent)] glow-accent' : ''}`}
            >
              <Swords className={`w-5 h-5 mb-2 ${mode === 'competitive' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <h3 className="text-sm font-semibold">Competitive</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Multiple teams compete. A Judge scores each.</p>
            </button>
          </div>
        </motion.div>

        {/* Agent Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium mb-2">Agent Count</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAgentCount(Math.max(3, agentCount - 1))}
              className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
              aria-label="Decrease agent count"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xl font-mono w-8 text-center">{agentCount}</span>
            <button
              onClick={() => setAgentCount(Math.min(12, agentCount + 1))}
              className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
              aria-label="Increase agent count"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-xs text-[var(--muted)] ml-2">agents</span>
          </div>
        </motion.div>

        {/* Optional Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div>
            <label htmlFor="domain" className="block text-sm font-medium mb-2">Domain (optional)</label>
            <input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., EdTech"
              className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
            />
          </div>
          <div>
            <label htmlFor="constraints" className="block text-sm font-medium mb-2">Constraints (optional)</label>
            <input
              id="constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g., ₹10L budget, 6 months"
              className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
            />
          </div>
        </motion.div>

        {/* Build Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button
            onClick={handleBuild}
            disabled={challenge.trim().length < 10 || loading}
            className="btn-primary w-full justify-center text-base py-3.5"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Building Arena...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                BUILD ARENA
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </main>
  );
}

export default function ArenaCreatorPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading...</div>
      </main>
    }>
      <ArenaCreatorForm />
    </Suspense>
  );
}
