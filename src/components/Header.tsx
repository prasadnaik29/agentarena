'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Key, Swords, Plus, Sparkles } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { getSavedKey } from '@/lib/keys';
import type { LLMProviderType } from '@/types/arena';

export function Header() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configuredCount, setConfiguredCount] = useState(0);

  // Check how many keys are configured
  useEffect(() => {
    const updateKeysStatus = () => {
      let count = 0;
      const providers: LLMProviderType[] = ['openai', 'gemini', 'claude', 'groq', 'openrouter', 'deepseek'];
      for (const p of providers) {
        if (getSavedKey(p)) count++;
      }
      setConfiguredCount(count);
    };

    updateKeysStatus();
    window.addEventListener('storage', updateKeysStatus);
    return () => window.removeEventListener('storage', updateKeysStatus);
  }, [isModalOpen]);

  // Don't show header in full screen live view if preferred, or keep a slim version
  const isLivePage = pathname.includes('/arena/live');

  return (
    <>
      <header className="h-14 border-b border-[var(--border-color)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition-transform">
            <Swords className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-sm">
            <span className="text-[var(--foreground)]">AGENT</span>
            <span className="text-[var(--accent)]">ARENA</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-3">
          <Link
            href="/arena/new"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === '/arena/new'
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/30'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Arena</span>
          </Link>

          {/* API Key / Provider Settings Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-bright)] bg-[var(--surface-hover)] hover:border-[var(--accent)] hover:text-[var(--foreground)] text-[var(--muted)] transition-all shadow-sm group"
          >
            <Key className="w-3.5 h-3.5 text-[var(--accent)] group-hover:rotate-12 transition-transform" />
            <span>API Keys</span>
            {configuredCount > 0 ? (
              <span className="badge badge-success text-[9px] px-1.5 py-0.5">
                {configuredCount} active
              </span>
            ) : (
              <span className="badge badge-accent text-[9px] px-1.5 py-0.5">
                Free Mode
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* Global API Key Modal */}
      <ApiKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
