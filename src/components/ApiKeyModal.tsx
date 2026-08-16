'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Trash2,
  Lock,
} from 'lucide-react';
import type { LLMProviderType } from '@/types/arena';
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

export interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider?: (provider: LLMProviderType, key: string, model: string, baseUrl?: string) => void;
}

interface ProviderMeta {
  id: LLMProviderType;
  name: string;
  badge: string;
  color: string;
  icon: string;
  keyPrefix: string;
  keyPlaceholder: string;
  defaultModel: string;
  models: Array<{ id: string; label: string }>;
  defaultBaseUrl?: string;
  docsUrl: string;
  docsLabel: string;
  isFree?: boolean;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'mock',
    name: 'Free Simulator',
    badge: 'Offline / Free',
    color: '#10b981',
    icon: '⚡',
    keyPrefix: '',
    keyPlaceholder: 'No API key needed',
    defaultModel: 'mock-dynamic',
    models: [{ id: 'mock-dynamic', label: 'Dynamic Multi-Agent Simulator (Offline / Instant)' }],
    docsUrl: '#',
    docsLabel: 'Built-in high performance simulation engine',
    isFree: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Free Tier Available',
    color: '#3b82f6',
    icon: '🔵',
    keyPrefix: 'AIzaSy...',
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
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Industry Standard',
    color: '#10b981',
    icon: '🟢',
    keyPrefix: 'sk-...',
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
  {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'High Reasoning',
    color: '#a855f7',
    icon: '🟣',
    keyPrefix: 'sk-ant-...',
    keyPlaceholder: 'sk-ant-api03-...',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest)' },
      { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (v1)' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Get API Key from Anthropic Console',
  },
  {
    id: 'groq',
    name: 'Groq (Ultra-Fast)',
    badge: 'Free Tier Available',
    color: '#f97316',
    icon: '⚡',
    keyPrefix: 'gsk_...',
    keyPlaceholder: 'gsk_...',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Fast & High Quality)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra Fast)' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    docsUrl: 'https://console.groq.com/keys',
    docsLabel: 'Get free high-speed key from Groq Console',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'All Models in One',
    color: '#ec4899',
    icon: '🌐',
    keyPrefix: 'sk-or-...',
    keyPlaceholder: 'sk-or-v1-...',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct' },
    ],
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/keys',
    docsLabel: 'Get unified key from OpenRouter',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'Reasoning & Coding',
    color: '#06b6d4',
    icon: '🐋',
    keyPrefix: 'sk-...',
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
  {
    id: 'ollama',
    name: 'Ollama (Local AI)',
    badge: '100% Local & Private',
    color: '#8b5cf6',
    icon: '🦙',
    keyPrefix: '',
    keyPlaceholder: 'No key needed for local server',
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
    docsLabel: 'Download Ollama for local offline execution',
    isFree: true,
  },
];

export function ApiKeyModal({ isOpen, onClose, onSelectProvider }: ApiKeyModalProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderType>('gemini');
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string>>({});
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({});

  const [testing, setTesting] = useState(false);
  const [validationResult, setValidationResult] = useState<KeyValidationResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load saved keys from localStorage and server status
  useEffect(() => {
    if (!isOpen) return;

    const initialKeys: Record<string, string> = {};
    const initialBaseUrls: Record<string, string> = {};
    const initialModels: Record<string, string> = {};

    for (const p of PROVIDERS) {
      initialKeys[p.id] = getSavedKey(p.id);
      initialBaseUrls[p.id] = getSavedBaseUrl(p.id);
      initialModels[p.id] = getSavedModel(p.id) || p.defaultModel;
    }

    setKeys(initialKeys);
    setBaseUrls(initialBaseUrls);
    setModels(initialModels);
    setValidationResult(null);
    setSaveMessage(null);

    // Fetch server status
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverKeys) {
          setServerKeys(data.serverKeys);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProvider = PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0];
  const currentKey = keys[selectedProviderId] || '';
  const currentBaseUrl = baseUrls[selectedProviderId] || '';
  const currentModel = models[selectedProviderId] || currentProvider.defaultModel;
  const hasServerKey = !!serverKeys[selectedProviderId];

  const handleKeyChange = (val: string) => {
    setKeys((prev) => ({ ...prev, [selectedProviderId]: val }));
    setValidationResult(null);
    setSaveMessage(null);
  };

  const handleBaseUrlChange = (val: string) => {
    setBaseUrls((prev) => ({ ...prev, [selectedProviderId]: val }));
    setValidationResult(null);
  };

  const handleModelChange = (val: string) => {
    setModels((prev) => ({ ...prev, [selectedProviderId]: val }));
    setValidationResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setValidationResult(null);
    setSaveMessage(null);

    try {
      const res = await validateApiKey({
        provider: selectedProviderId,
        apiKey: currentKey.trim() || undefined,
        baseUrl: currentBaseUrl.trim() || undefined,
        model: currentModel || undefined,
      });

      setValidationResult(res);
    } catch (err) {
      setValidationResult({
        valid: false,
        error: (err as Error).message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    // Save to localStorage
    saveKey(selectedProviderId, currentKey);
    saveBaseUrl(selectedProviderId, currentBaseUrl);
    saveModel(selectedProviderId, currentModel);

    setSaveMessage(`Settings saved for ${currentProvider.name}!`);

    if (onSelectProvider) {
      onSelectProvider(selectedProviderId, currentKey, currentModel, currentBaseUrl);
    }

    setTimeout(() => {
      setSaveMessage(null);
    }, 2500);
  };

  const handleClear = () => {
    saveKey(selectedProviderId, '');
    saveBaseUrl(selectedProviderId, '');
    saveModel(selectedProviderId, '');
    setKeys((prev) => ({ ...prev, [selectedProviderId]: '' }));
    setBaseUrls((prev) => ({ ...prev, [selectedProviderId]: '' }));
    setValidationResult(null);
    setSaveMessage(`Cleared saved key for ${currentProvider.name}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border-bright)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--surface-hover)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                AI Provider & API Key Settings
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Configure your API keys or switch between AI providers for Agent Arena
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Badges */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2.5">
              Select Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDERS.map((p) => {
                const isSelected = selectedProviderId === p.id;
                const isSaved = !!keys[p.id];
                const hasEnv = !!serverKeys[p.id];

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProviderId(p.id);
                      setValidationResult(null);
                      setSaveMessage(null);
                    }}
                    className={`relative px-3 py-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-dim)] shadow-sm'
                        : 'border-[var(--border-color)] bg-[var(--background)] hover:border-[var(--border-bright)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{p.icon}</span>
                      {(isSaved || hasEnv) && (
                        <span className="w-2 h-2 rounded-full bg-[var(--success)]" title="Key configured" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">{p.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{p.badge}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Configuration Panel */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--background)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentProvider.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {currentProvider.name} Configuration
                  </h3>
                  <p className="text-xs text-[var(--muted)]">{currentProvider.badge}</p>
                </div>
              </div>

              {hasServerKey && (
                <span className="badge badge-success text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Server Env Active
                </span>
              )}
            </div>

            {/* Free Mode Info or API Key Input */}
            {currentProvider.isFree && currentProvider.id === 'mock' ? (
              <div className="p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 text-xs text-[var(--success)]">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> 100% Free & Ready to Use
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  The Free Multi-Agent Simulator generates full contextual agent dialogues, tool calls, debate rounds,
                  critiques, and synthesized verdicts without requiring any API keys or network requests.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="modalApiKeyInput" className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[var(--accent)]" />
                    API Key
                  </label>
                  {currentProvider.docsUrl !== '#' && (
                    <a
                      href={currentProvider.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
                    >
                      {currentProvider.docsLabel}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="modalApiKeyInput"
                    type="password"
                    value={currentKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder={currentProvider.keyPlaceholder}
                    className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors pr-20"
                  />
                  {currentKey && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--danger)] p-1 transition-colors"
                      title="Clear saved key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-1 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Stored locally in your browser session for direct execution.
                </p>
              </div>
            )}

            {/* Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="modalModelSelect" className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Model Version
                </label>
                <select
                  id="modalModelSelect"
                  value={currentModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  {currentProvider.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base URL (Optional) */}
              {!currentProvider.isFree && (
                <div>
                  <label htmlFor="modalBaseUrlInput" className="block text-xs font-medium text-[var(--muted)] mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[var(--accent)]" /> Base URL (optional)
                  </label>
                  <input
                    id="modalBaseUrlInput"
                    type="url"
                    value={currentBaseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder={currentProvider.defaultBaseUrl || 'Default provider gateway'}
                    className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted)] font-mono"
                  />
                </div>
              )}
            </div>

            {/* Validation Feedback */}
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border text-xs ${
                  validationResult.valid
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {validationResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {validationResult.valid ? 'Key is Active & Valid!' : 'Connection Failed'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {validationResult.valid ? validationResult.message : validationResult.error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Save Message Notification */}
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-dim)] text-xs text-[var(--accent)] flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[var(--border-color)] bg-[var(--surface-hover)] flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || (!currentProvider.isFree && !currentKey.trim() && !hasServerKey)}
            className="btn-secondary text-xs py-2 px-3.5"
          >
            {testing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
                Testing Connection...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-[var(--warning)]" />
                Test Key Connection
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary text-xs py-2 px-5 glow-accent"
            >
              Save & Use
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
