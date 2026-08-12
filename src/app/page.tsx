'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Users, Brain, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SAMPLE_CHALLENGES } from '@/types/arena';

// Animated node for the hero preview
function AgentNode({ name, emoji, delay, x, y }: { name: string; emoji: string; delay: number; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 200 }}
      className="absolute flex flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border-bright)] flex items-center justify-center text-xl shadow-lg"
      >
        {emoji}
      </motion.div>
      <span className="text-[10px] text-[var(--muted)] font-mono whitespace-nowrap">{name}</span>
    </motion.div>
  );
}

// Connection line between nodes
function ConnectionLine({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  return (
    <motion.line
      x1={`${x1}%`} y1={`${y1}%`}
      x2={`${x2}%`} y2={`${y2}%`}
      stroke="var(--border-bright)"
      strokeWidth="1"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.5 }}
      transition={{ delay, duration: 0.8 }}
    />
  );
}

// Animated message bubble
function MessageBubble({ message, delay }: { message: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay }}
      className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-color)] text-xs text-[var(--muted)] font-mono"
    >
      {message}
    </motion.div>
  );
}

export default function LandingPage() {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    '🔬 Research Agent: Analyzing market assumptions...',
    '💰 Finance Agent: Revenue projections appear optimistic.',
    '🎯 Strategy Agent: Proposing phased launch strategy...',
    '⚔️ Critic Agent: Customer acquisition cost is underestimated.',
    '💰 Finance Agent: Agreed. Revising projection...',
    '⚖️ Decision Agent: Synthesizing final recommendation...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
        {/* Subtle grid background */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        
        {/* Radial gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Logo badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-bright)] bg-[var(--surface)] mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-xs font-medium text-[var(--muted)]">Multi-Agent Decision Intelligence</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
          >
            <span className="text-[var(--foreground)]">AGENT</span>
            <span className="text-[var(--accent)]"> ARENA</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--muted)] mb-12 max-w-xl mx-auto"
          >
            Where AI agents think together. Collaborate. Debate. Decide.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/arena/new"
              className="btn-primary text-base px-8 py-3.5 glow-accent"
            >
              ENTER ARENA
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Agent Network Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="relative w-full max-w-2xl h-52 mt-16"
        >
          <svg className="absolute inset-0 w-full h-full">
            <ConnectionLine x1={50} y1={10} x2={25} y2={45} delay={0.8} />
            <ConnectionLine x1={50} y1={10} x2={75} y2={45} delay={0.9} />
            <ConnectionLine x1={25} y1={45} x2={50} y2={65} delay={1.0} />
            <ConnectionLine x1={75} y1={45} x2={50} y2={65} delay={1.1} />
            <ConnectionLine x1={50} y1={65} x2={50} y2={85} delay={1.2} />
          </svg>
          <AgentNode name="Research" emoji="🔬" delay={0.7} x={46} y={0} />
          <AgentNode name="Strategy" emoji="🎯" delay={0.8} x={20} y={35} />
          <AgentNode name="Finance" emoji="💰" delay={0.9} x={70} y={35} />
          <AgentNode name="Critic" emoji="⚔️" delay={1.0} x={46} y={55} />
          <AgentNode name="Judge" emoji="⚖️" delay={1.1} x={46} y={78} />
        </motion.div>

        {/* Live Message Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            <MessageBubble key={messageIndex} message={messages[messageIndex]} delay={0} />
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Features Row */}
      <section className="border-t border-[var(--border-color)] px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card"
          >
            <Users className="w-5 h-5 text-[var(--accent)] mb-3" />
            <h3 className="text-sm font-semibold mb-1">Specialized Agents</h3>
            <p className="text-xs text-[var(--muted)]">
              Researcher, Strategist, Finance, Risk, Critic, and Judge — each with distinct expertise and perspective.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <Zap className="w-5 h-5 text-[var(--warning)] mb-3" />
            <h3 className="text-sm font-semibold mb-1">Live Debate & Critique</h3>
            <p className="text-xs text-[var(--muted)]">
              Watch agents challenge assumptions, debate strategies, and refine proposals in real-time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <Trophy className="w-5 h-5 text-[var(--success)] mb-3" />
            <h3 className="text-sm font-semibold mb-1">Competitive Mode</h3>
            <p className="text-xs text-[var(--muted)]">
              Multiple teams compete to solve the challenge. A Judge evaluates and scores each solution.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sample Challenges */}
      <section className="border-t border-[var(--border-color)] px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-6">Try a Challenge</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_CHALLENGES.map((sample, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/arena/new?challenge=${encodeURIComponent(sample.challenge)}`}
                  className="card card-interactive block group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="badge badge-accent mb-2">{sample.domain}</span>
                      <p className="text-sm mt-2 group-hover:text-[var(--accent)] transition-colors">
                        {sample.challenge}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors mt-1 flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[var(--muted)]">
          <span>Agent Arena — Multi-Agent Decision Intelligence</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </main>
  );
}
