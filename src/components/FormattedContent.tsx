'use client';

import React from 'react';
import {
  BarChart2,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react';

interface FormattedContentProps {
  content: string;
  className?: string;
  variant?: 'card' | 'plain' | 'compact';
  accentColor?: string;
}

// Helper to detect category icon for subproblems/sections
function getSectionIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('market') || lower.includes('growth') || lower.includes('demand')) {
    return <TrendingUp className="w-3.5 h-3.5 text-blue-400" />;
  }
  if (lower.includes('pricing') || lower.includes('cost') || lower.includes('financ') || lower.includes('revenue') || lower.includes('budget')) {
    return <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />;
  }
  if (lower.includes('supply') || lower.includes('vehicle') || lower.includes('model') || lower.includes('infra') || lower.includes('tech')) {
    return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
  }
  if (lower.includes('regulat') || lower.includes('policy') || lower.includes('incentive') || lower.includes('legal')) {
    return <Info className="w-3.5 h-3.5 text-amber-400" />;
  }
  return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
}

// Formats inline text: **bold**, (Source: ...), metrics, and plain text
function formatInlineText(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold patterns: **bold text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2).trim();
      return (
        <strong key={idx} className="font-semibold text-[var(--foreground)] text-[12.5px]">
          {inner}
        </strong>
      );
    }

    // Highlight citations like (Source: XYZ)
    const sourceRegex = /\((Source:[^)]+)\)/gi;
    if (sourceRegex.test(part)) {
      const sourceParts = part.split(/(\(Source:[^)]+\))/gi);
      return (
        <React.Fragment key={idx}>
          {sourceParts.map((sp, spIdx) => {
            if (sp.startsWith('(Source:') && sp.endsWith(')')) {
              const citation = sp.slice(1, -1);
              return (
                <span
                  key={spIdx}
                  className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border-bright)] text-[10px] font-mono text-[var(--muted)]"
                >
                  <Tag className="w-2.5 h-2.5 opacity-70" />
                  {citation}
                </span>
              );
            }
            return sp;
          })}
        </React.Fragment>
      );
    }

    return part;
  });
}

// Parses raw markdown block into structured sections and items
interface ParsedSection {
  title?: string;
  items: Array<{
    label?: string;
    body: string;
    isBullet: boolean;
  }>;
}

function parseMarkdownContent(raw: string): ParsedSection[] {
  if (!raw) return [];

  // Normalize line endings and clean excessive asterisks/pluses
  const cleaned = raw
    .replace(/\r\n/g, '\n')
    // Fix squashed markdown headers like "**Section 1)** * **Item:**"
    .replace(/\)\*\*\s*\*\s*\*\*/g, ')\n* **')
    .replace(/\)\*\*\s*\*\*/g, ')\n**')
    .replace(/\*\*\s*\*\s*\*\*/g, '**\n* **')
    .replace(/\+\s*\*\*/g, '\n* **')
    .replace(/\s*\+\s+(As of|The|Existing|Revenue|Pricing|Government|These|Suitable|A partnership)/g, '\n* $1');

  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { items: [] };

  for (const line of lines) {
    // Check if line is a major Section Header:
    // e.g. "**Market Size and Growth Potential (Subproblem 1)**" or "### Subproblem 1" or "**Key Findings & Recommendations:**"
    const sectionMatch = line.match(/^(\*{2,3}|#{2,4})\s*(.*?)\s*(\*{2,3}|:)?$/);
    const isSubproblemHeader = line.toLowerCase().includes('subproblem') || line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('optimistic assumption');

    if (sectionMatch && (isSubproblemHeader || line.length < 80)) {
      const cleanTitle = sectionMatch[2]
        .replace(/\*\*/g, '')
        .replace(/^#+\s*/, '')
        .replace(/:$/, '')
        .trim();

      if (cleanTitle.length > 3) {
        if (currentSection.items.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = {
          title: cleanTitle,
          items: [],
        };
        continue;
      }
    }

    // Check if line is a bullet item (* or + or - or 1.)
    const bulletMatch = line.match(/^(\*|\+|-|•|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const rawItem = bulletMatch[2].trim();
      // Check if bullet has a label like "**Current Market Size:** 340,000..."
      const labelMatch = rawItem.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      if (labelMatch) {
        currentSection.items.push({
          label: labelMatch[1].trim(),
          body: labelMatch[2].trim(),
          isBullet: true,
        });
      } else {
        currentSection.items.push({
          body: rawItem,
          isBullet: true,
        });
      }
      continue;
    }

    // Plain text / paragraph item
    // Check if starts with a bold key without bullet: "**Current Market Size:** ..."
    const labelMatch = line.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
    if (labelMatch && labelMatch[2].length > 0) {
      currentSection.items.push({
        label: labelMatch[1].trim(),
        body: labelMatch[2].trim(),
        isBullet: false,
      });
    } else {
      currentSection.items.push({
        body: line,
        isBullet: false,
      });
    }
  }

  if (currentSection.items.length > 0 || currentSection.title) {
    sections.push(currentSection);
  }

  return sections;
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  if (!content) return null;

  const sections = parseMarkdownContent(content);

  // If simple text with no special structure, render directly with inline markdown formatting
  if (sections.length === 0 || (sections.length === 1 && !sections[0].title && sections[0].items.length <= 1)) {
    return (
      <div className={`text-xs text-[var(--foreground)] leading-relaxed space-y-1.5 ${className}`}>
        <p>{formatInlineText(content)}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section, sIdx) => {
        const hasTitle = !!section.title;

        return (
          <div
            key={sIdx}
            className={`rounded-xl transition-all ${
              hasTitle
                ? 'p-4 bg-[var(--surface)]/90 border border-[var(--border-bright)] shadow-sm'
                : 'space-y-2'
            }`}
          >
            {/* Section Header */}
            {hasTitle && (
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[var(--border-color)]">
                <div className="p-1 rounded-md bg-[var(--surface-hover)] border border-[var(--border-bright)] flex items-center justify-center">
                  {getSectionIcon(section.title!)}
                </div>
                <h4 className="text-xs font-semibold tracking-wide text-[var(--foreground)] uppercase">
                  {section.title}
                </h4>
              </div>
            )}

            {/* Section Items */}
            <div className="space-y-2.5">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="text-xs leading-relaxed flex items-start gap-2.5">
                  {item.isBullet ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0" />
                  ) : item.label ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] mt-0.5 flex-shrink-0 opacity-80" />
                  ) : null}

                  <div className="flex-1 min-w-0">
                    {item.label && (
                      <span className="font-semibold text-[var(--foreground)] mr-1.5 text-xs inline-block">
                        {item.label}:
                      </span>
                    )}
                    <span className="text-[var(--foreground)] opacity-90">
                      {formatInlineText(item.body)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
