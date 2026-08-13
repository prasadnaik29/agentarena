'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, Swords, Sparkles, Plus, Minus, Cpu, Key, Globe } from 'lucide-react';
import { useArenaStore } from '@/lib/store';
import { SAMPLE_CHALLENGES, type LLMProviderType } from '@/types/arena';

function ArenaCreatorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setConfig, setAgents } = useArenaStore();

  const [challenge, setChallenge] = useState(searchParams.get('challenge') || '');
  const [mode, setMode] = useState<'collaborative' | 'competitive'>('collaborative');
  const [agentCount, setAgentCount] = useState(6);
  const [domain, setDomain] = useState('');
  const [constraints, setConstraints] = useState('');
  const [provider, setProvider] = useState<LLMProviderType>('mock');
  const [model, setModel] = useState<string>('mock-dynamic');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect configured provider from server env vars
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.defaultProvider && data.defaultProvider !== 'mock') {
          setProvider(data.defaultProvider as LLMProviderType);
          setModel(data.defaultModel || 'gemini-2.5-flash');
        }
      })
      .catch(() => { /* stay on mock if config endpoint fails */ });
  }, []);

  const modelOptions: Record<LLMProviderType, Array<{ id: string; label: string }>> = {
    mock: [
      { id: 'mock-dynamic', label: 'Dynamic Multi-Agent Simulator (Free / Offline)' },
    ],
    openai: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-Effective)' },
      { id: 'gpt-4o', label: 'GPT-4o (High Reasoning)' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { id: 'o3-mini', label: 'o3-Mini (Reasoning Benchmark)' },
    ],
    gemini: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast & Smart)' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Reasoning)' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Legacy)' },
    ],
    claude: [
      { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
    ollama: [
      { id: 'llama3', label: 'Llama 3 (Local)' },
      { id: 'mistral', label: 'Mistral 7B (Local)' },
      { id: 'codellama', label: 'CodeLlama (Local)' },
      { id: 'phi3', label: 'Phi-3 (Local Small)' },
    ],
  };

  const handleProviderChange = (p: LLMProviderType) => {
    setProvider(p);
    const defaults = modelOptions[p];
    if (defaults && defaults[0]) {
      setModel(defaults[0].id);
    }
  };

  const handleBuild = async () => {
    if (challenge.trim().length < 10) return;

    setLoading(true);
    setError(null);
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
          provider,
          model: model || undefined,
          apiKey: apiKey.trim() || undefined,
          baseUrl: baseUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfig(data.config);
      setAgents(data.agents);
      router.push('/arena/configure');
    } catch (err) {
      const message = (err as Error).message || 'Failed to build arena';
      setError(message);
      console.error('Failed to build arena:', err);
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

        {/* AI Engine & Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="card mb-8 space-y-4 border-[var(--border-bright)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--accent)]" />
              AI Model & Provider Configuration
            </h3>
            {provider === 'mock' && (
              <span className="badge badge-accent text-[10px]">Free Mode (No API Key Required)</span>
            )}
          </div>

          {/* Provider Selector Badges */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-2">Select Provider</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(
                [
                  { id: 'mock', name: 'Free Simulator', icon: '⚡' },
                  { id: 'openai', name: 'OpenAI', icon: '🟢' },
                  { id: 'gemini', name: 'Gemini', icon: '🔵' },
                  { id: 'claude', name: 'Claude', icon: '🟣' },
                  { id: 'ollama', name: 'Ollama', icon: '🦙' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                    provider === p.id
                      ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modelSelect" className="block text-xs font-medium text-[var(--muted)] mb-1">
                Model Family / Version
              </label>
              <select
                id="modelSelect"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                {(modelOptions[provider] || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Base URL (for Ollama, Agent Router, OpenRouter, or custom proxy) */}
            {provider !== 'mock' && (
              <div>
                <label htmlFor="baseUrlInput" className="block text-xs font-medium text-[var(--muted)] mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[var(--accent)]" />
                  Base URL / API Gateway (optional)
                </label>
                <input
                  id="baseUrlInput"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={provider === 'ollama' ? 'http://localhost:11434/v1' : 'e.g. https://agentrouter.org/v1'}
                  className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
                />
              </div>
            )}
          </div>

          {/* API Key Input */}
          {provider !== 'mock' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2 border-t border-[var(--border-color)]"
            >
              <label htmlFor="apiKeyInput" className="block text-xs font-medium text-[var(--muted)] mb-1 flex items-center gap-1">
                <Key className="w-3 h-3 text-[var(--warning)]" />
                Custom API Key (optional — falls back to server env)
              </label>
              <input
                id="apiKeyInput"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Paste your API Key (sk-...)`}
                className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                🔒 Key is passed securely for this session only and never logged.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
          >
            <p className="font-semibold mb-1">❌ Arena Build Failed</p>
            <p className="text-xs opacity-90">{error}</p>
          </motion.div>
        )}

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
