'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Users,
  Swords,
  Sparkles,
  Plus,
  Minus,
  Cpu,
  Key,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useArenaStore } from '@/lib/store';
import { SAMPLE_CHALLENGES, type LLMProviderType } from '@/types/arena';
import {
  getSavedKey,
  saveKey,
  getSavedBaseUrl,
  saveBaseUrl,
  getSavedModel,
  saveModel,
  validateApiKey,
  type KeyValidationResult,
} from '@/lib/keys';

const PROVIDER_METADATA: Record<
  LLMProviderType,
  {
    name: string;
    icon: string;
    badge: string;
    keyPlaceholder: string;
    defaultModel: string;
    models: Array<{ id: string; label: string }>;
    defaultBaseUrl?: string;
    docsUrl?: string;
    docsLabel?: string;
    isFree?: boolean;
  }
> = {
  mock: {
    name: 'Free Simulator',
    icon: '⚡',
    badge: 'Offline / Free',
    keyPlaceholder: 'No API key needed',
    defaultModel: 'mock-dynamic',
    models: [{ id: 'mock-dynamic', label: 'Dynamic Multi-Agent Simulator (Instant / Free)' }],
    isFree: true,
  },
  gemini: {
    name: 'Google Gemini',
    icon: '🔵',
    badge: 'Free Tier Available',
    keyPlaceholder: 'AIzaSy...',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast & Smart — Recommended)' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Reasoning)' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    ],
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    docsLabel: 'Get free Gemini API Key from Google AI Studio',
  },
  openai: {
    name: 'OpenAI',
    icon: '🟢',
    badge: 'Industry Standard',
    keyPlaceholder: 'sk-proj-...',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-Effective)' },
      { id: 'gpt-4o', label: 'GPT-4o (High Intelligence)' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { id: 'o3-mini', label: 'o3-Mini (Reasoning Benchmark)' },
      { id: 'o1-mini', label: 'o1-Mini' },
    ],
    defaultBaseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'Get API Key from OpenAI Platform',
  },
  claude: {
    name: 'Anthropic Claude',
    icon: '🟣',
    badge: 'High Reasoning',
    keyPlaceholder: 'sk-ant-api03-...',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest)' },
      { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (v1)' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Get API Key from Anthropic Console',
  },
  groq: {
    name: 'Groq (Ultra-Fast)',
    icon: '⚡',
    badge: 'Free Tier Available',
    keyPlaceholder: 'gsk_...',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (High Quality)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra Fast)' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    docsUrl: 'https://console.groq.com/keys',
    docsLabel: 'Get free fast key from Groq Console',
  },
  openrouter: {
    name: 'OpenRouter',
    icon: '🌐',
    badge: 'All Models in One',
    keyPlaceholder: 'sk-or-v1-...',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/keys',
    docsLabel: 'Get unified key from OpenRouter',
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🐋',
    badge: 'Deep Reasoning',
    keyPlaceholder: 'sk-...',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek V3 (Chat)' },
      { id: 'deepseek-reasoner', label: 'DeepSeek R1 (Reasoner)' },
    ],
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    docsLabel: 'Get API Key from DeepSeek Platform',
  },
  ollama: {
    name: 'Ollama (Local)',
    icon: '🦙',
    badge: 'Private & Local',
    keyPlaceholder: 'No key needed',
    defaultModel: 'llama3',
    models: [
      { id: 'llama3', label: 'Llama 3' },
      { id: 'llama3.2', label: 'Llama 3.2' },
      { id: 'mistral', label: 'Mistral 7B' },
      { id: 'qwen2.5', label: 'Qwen 2.5' },
      { id: 'phi3', label: 'Phi-3' },
    ],
    defaultBaseUrl: 'http://localhost:11434/v1',
    docsUrl: 'https://ollama.ai',
    docsLabel: 'Download Ollama for local execution',
    isFree: true,
  },
};

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
  
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key testing state
  const [testingKey, setTestingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<KeyValidationResult | null>(null);

  // Initialize from saved localStorage & check server config
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverKeys) {
          setServerKeys(data.serverKeys);
        }

        // Check if user has a saved key in localStorage first
        const savedGemini = getSavedKey('gemini');
        const savedOpenAI = getSavedKey('openai');
        const savedClaude = getSavedKey('claude');
        const savedGroq = getSavedKey('groq');

        if (savedGemini) {
          setProvider('gemini');
          setApiKey(savedGemini);
          setModel(getSavedModel('gemini') || 'gemini-2.5-flash');
          setBaseUrl(getSavedBaseUrl('gemini'));
        } else if (savedOpenAI) {
          setProvider('openai');
          setApiKey(savedOpenAI);
          setModel(getSavedModel('openai') || 'gpt-4o-mini');
          setBaseUrl(getSavedBaseUrl('openai'));
        } else if (savedGroq) {
          setProvider('groq');
          setApiKey(savedGroq);
          setModel(getSavedModel('groq') || 'llama-3.3-70b-versatile');
        } else if (data.defaultProvider && data.defaultProvider !== 'mock') {
          // If server env has a configured key
          setProvider(data.defaultProvider as LLMProviderType);
          setModel(data.defaultModel || 'gpt-4o-mini');
        }
      })
      .catch(() => {});
  }, []);

  const handleProviderChange = (p: LLMProviderType) => {
    setProvider(p);
    setKeyValidation(null);
    setError(null);

    // Load saved settings for this provider if any
    const savedKey = getSavedKey(p);
    const savedUrl = getSavedBaseUrl(p);
    const savedM = getSavedModel(p);

    setApiKey(savedKey);
    setBaseUrl(savedUrl);
    setModel(savedM || PROVIDER_METADATA[p].defaultModel);
  };

  const handleKeyInput = (val: string) => {
    setApiKey(val);
    saveKey(provider, val);
    setKeyValidation(null);
    setError(null);
  };

  const handleBaseUrlInput = (val: string) => {
    setBaseUrl(val);
    saveBaseUrl(provider, val);
    setKeyValidation(null);
  };

  const handleModelChange = (val: string) => {
    setModel(val);
    saveModel(provider, val);
    setKeyValidation(null);
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setKeyValidation(null);
    setError(null);

    try {
      const res = await validateApiKey({
        provider,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        model: model || undefined,
      });

      setKeyValidation(res);
    } catch (err) {
      setKeyValidation({
        valid: false,
        error: (err as Error).message,
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleBuild = async () => {
    if (challenge.trim().length < 10) return;

    setLoading(true);
    setError(null);
    try {
      // Save current choices
      saveKey(provider, apiKey);
      saveBaseUrl(provider, baseUrl);
      saveModel(provider, model);

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

  const currentMeta = PROVIDER_METADATA[provider] || PROVIDER_METADATA.mock;
  const hasServerKey = !!serverKeys[provider];

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Arena</h1>
          <p className="text-sm text-[var(--muted)]">
            Define a complex problem, select an AI engine, and launch autonomous specialized agents.
          </p>
        </motion.div>

        {/* Challenge Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label htmlFor="challenge" className="block text-sm font-medium mb-2">
            Challenge Description
          </label>
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
                type="button"
                onClick={() => {
                  setChallenge(sample.challenge);
                  setDomain(sample.domain);
                }}
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
              type="button"
              onClick={() => {
                setMode('collaborative');
                setAgentCount(6);
              }}
              className={`card card-interactive text-left ${mode === 'collaborative' ? 'border-[var(--accent)] glow-accent' : ''}`}
            >
              <Users className={`w-5 h-5 mb-2 ${mode === 'collaborative' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <h3 className="text-sm font-semibold">Collaborative</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Agents work together toward one unified solution.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('competitive');
                setAgentCount(9);
              }}
              className={`card card-interactive text-left ${mode === 'competitive' ? 'border-[var(--accent)] glow-accent' : ''}`}
            >
              <Swords className={`w-5 h-5 mb-2 ${mode === 'competitive' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <h3 className="text-sm font-semibold">Competitive</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Multiple teams compete; an impartial Judge scores each.</p>
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
              type="button"
              onClick={() => setAgentCount(Math.max(3, agentCount - 1))}
              className="w-8 h-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
              aria-label="Decrease agent count"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xl font-mono w-8 text-center">{agentCount}</span>
            <button
              type="button"
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
            <label htmlFor="domain" className="block text-sm font-medium mb-2">
              Domain (optional)
            </label>
            <input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., EdTech / Startup"
              className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
            />
          </div>
          <div>
            <label htmlFor="constraints" className="block text-sm font-medium mb-2">
              Constraints (optional)
            </label>
            <input
              id="constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g., ₹10L budget, 6 months"
              className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
            />
          </div>
        </motion.div>

        {/* AI Engine & API Key Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="card mb-8 space-y-5 border-[var(--border-bright)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--accent)]" />
              AI Model & Provider Setup
            </h3>
            {provider === 'mock' ? (
              <span className="badge badge-success text-[10px]">Free Mode (No Key Needed)</span>
            ) : hasServerKey ? (
              <span className="badge badge-info text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Server Key Active
              </span>
            ) : (
              <span className="badge badge-accent text-[10px]">{currentMeta.badge}</span>
            )}
          </div>

          {/* Provider Selector Badges */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-2">
              Choose Engine / Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'mock', name: 'Free Simulator', icon: '⚡' },
                  { id: 'gemini', name: 'Gemini', icon: '🔵' },
                  { id: 'openai', name: 'OpenAI', icon: '🟢' },
                  { id: 'claude', name: 'Claude', icon: '🟣' },
                  { id: 'groq', name: 'Groq', icon: '⚡' },
                  { id: 'openrouter', name: 'OpenRouter', icon: '🌐' },
                  { id: 'deepseek', name: 'DeepSeek', icon: '🐋' },
                  { id: 'ollama', name: 'Ollama', icon: '🦙' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    provider === p.id
                      ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--border-color)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-bright)]'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model & Base URL Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modelSelect" className="block text-xs font-medium text-[var(--muted)] mb-1">
                Model Family
              </label>
              <select
                id="modelSelect"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                {currentMeta.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Base URL */}
            {!currentMeta.isFree && (
              <div>
                <label htmlFor="baseUrlInput" className="block text-xs font-medium text-[var(--muted)] mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[var(--accent)]" />
                  Base URL / Gateway (optional)
                </label>
                <input
                  id="baseUrlInput"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => handleBaseUrlInput(e.target.value)}
                  placeholder={currentMeta.defaultBaseUrl || 'Default gateway'}
                  className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)] font-mono"
                />
              </div>
            )}
          </div>

          {/* API Key Input and Inline Test */}
          {!currentMeta.isFree && (
            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="apiKeyInput" className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[var(--accent)]" />
                  API Key
                </label>
                {currentMeta.docsUrl && (
                  <a
                    href={currentMeta.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    {currentMeta.docsLabel}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="apiKeyInput"
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleKeyInput(e.target.value)}
                  placeholder={currentMeta.keyPlaceholder}
                  className="flex-1 bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)]"
                />
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey || (!apiKey.trim() && !hasServerKey)}
                  className="btn-secondary text-xs py-2 px-3 flex-shrink-0"
                >
                  {testingKey ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.div>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-[var(--warning)]" />
                      Test Key
                    </>
                  )}
                </button>
              </div>

              {/* Validation Status */}
              {keyValidation && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    keyValidation.valid
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {keyValidation.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-[11px]">
                    {keyValidation.valid
                      ? `🟢 ${keyValidation.message} — ${keyValidation.model}`
                      : `🔴 ${keyValidation.error}`}
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Error Display with Quick Fallback */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm space-y-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Arena Creation Error</p>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-red-500/20 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleProviderChange('mock');
                  setError(null);
                }}
                className="btn-secondary text-xs py-1.5 px-3 border-red-500/40 text-red-200 hover:bg-red-500/20"
              >
                Switch to Free Simulator (Works 100% Offline)
              </button>
            </div>
          </motion.div>
        )}

        {/* Build Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button
            type="button"
            onClick={handleBuild}
            disabled={challenge.trim().length < 10 || loading}
            className="btn-primary w-full justify-center text-base py-3.5 glow-accent"
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
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
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted)]">Loading...</div>
        </main>
      }
    >
      <ArenaCreatorForm />
    </Suspense>
  );
}
