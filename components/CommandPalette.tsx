'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock3, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { TOOLS, getTool, type ToolDef } from '@/lib/tools';
import { useRecentTools } from '@/lib/useRecentTools';

export const OPEN_PALETTE_EVENT = 'fc-open-palette';

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
}

type CardText = { title?: string; desc?: string };

function toolText(locale: 'th' | 'en', slug: string): CardText {
  return (translations[locale].tools as Record<string, CardText>)[slug] ?? {};
}

function normalize(s: string): string {
  return s.normalize('NFC').toLowerCase();
}

function tokenize(q: string): string[] {
  const norm = normalize(q.trim());
  if (!norm) return [];
  return norm.match(/[฀-๿]+|[a-z0-9_./%-]+/g)?.filter(Boolean) ?? [];
}

const HAYSTACKS = new Map<string, string>(
  TOOLS.map((tool) => {
    const th = toolText('th', tool.slug);
    const en = toolText('en', tool.slug);
    return [
      tool.slug,
      normalize([
        tool.slug,
        tool.slug.replace(/-/g, ' '),
        th.title ?? '', th.desc ?? '',
        en.title ?? '', en.desc ?? '',
        ...tool.aliases,
      ].join(' ')),
    ];
  })
);

export default function CommandPalette() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const recents = useRecentTools();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K anywhere; custom event from Navbar button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  // reset + focus on open, lock scroll
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape closes no matter where focus is
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  const results = useMemo<{ recent: ToolDef[]; matched: ToolDef[] }>(() => {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
      const recentTools = recents.map((slug) => getTool(slug)).filter((x): x is ToolDef => Boolean(x));
      const recentSet = new Set(recentTools.map((x) => x.slug));
      return { recent: recentTools, matched: TOOLS.filter((x) => !recentSet.has(x.slug)) };
    }
    return {
      recent: [],
      matched: TOOLS.filter((tool) =>
        tokens.every((tok) => HAYSTACKS.get(tool.slug)?.includes(tok))
      ),
    };
  }, [query, recents]);

  const flat = useMemo(() => [...results.recent, ...results.matched], [results]);

  useEffect(() => setActiveIndex(0), [query]);

  const go = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push('/' + slug);
    },
    [router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flat[activeIndex];
      if (target) go(target.slug);
    }
  };

  // keep active row visible
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-[var(--color-ink)]/30 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={t.common.searchTools}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-[var(--color-line-strong)] shadow-deep"
          >
            <div className="flex items-center gap-3 px-4 border-b border-[var(--color-line)]">
              <Search className="w-4 h-4 text-[var(--color-ink-3)] flex-shrink-0" strokeWidth={2.2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.common.searchTools}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full h-14 bg-transparent text-[15px] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)] focus:outline-none tracking-[-0.005em]"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)] font-mono text-[10.5px] text-[var(--color-ink-3)]">
                esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto overscroll-contain py-2">
              {flat.length === 0 && (
                <p className="px-5 py-8 text-center text-[13.5px] text-[var(--color-ink-3)]">
                  {t.common.noToolFound} &ldquo;{query}&rdquo;
                </p>
              )}

              {results.recent.length > 0 && (
                <PaletteSection label={t.common.recentTools} icon={<Clock3 className="w-3 h-3" strokeWidth={2.2} />} />
              )}
              {results.recent.map((tool, i) => (
                <PaletteRow
                  key={`recent-${tool.slug}`}
                  tool={tool}
                  locale={locale}
                  index={i}
                  active={activeIndex === i}
                  onHover={() => setActiveIndex(i)}
                  onSelect={() => go(tool.slug)}
                />
              ))}

              {results.recent.length > 0 && results.matched.length > 0 && (
                <PaletteSection label={t.common.allTools} />
              )}
              {results.matched.map((tool, i) => {
                const index = results.recent.length + i;
                return (
                  <PaletteRow
                    key={tool.slug}
                    tool={tool}
                    locale={locale}
                    index={index}
                    active={activeIndex === index}
                    onHover={() => setActiveIndex(index)}
                    onSelect={() => go(tool.slug)}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-surface)] text-[11px] text-[var(--color-ink-3)]">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-line)] bg-white font-mono text-[10px]">↑↓</kbd>
                {locale === 'th' ? 'เลื่อน' : 'navigate'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--color-line)] bg-white font-mono text-[10px]">
                  <CornerDownLeft className="w-2.5 h-2.5" />
                </kbd>
                {locale === 'th' ? 'เปิด' : 'open'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaletteSection({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 px-5 pt-3 pb-1.5 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[var(--color-ink-4)]">
      {icon}
      {label}
    </p>
  );
}

function PaletteRow({
  tool, locale, index, active, onHover, onSelect,
}: {
  tool: ToolDef;
  locale: 'th' | 'en';
  index: number;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const text = toolText(locale, tool.slug);
  const Icon = tool.icon;
  return (
    <button
      type="button"
      data-index={index}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3.5 px-4 py-2.5 mx-1 rounded-xl text-left transition-colors duration-100',
        active ? 'bg-[var(--color-surface-2)]' : 'bg-transparent'
      )}
      style={{ width: 'calc(100% - 0.5rem)' }}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-lg border flex-shrink-0 transition-colors duration-100',
          active
            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-ink-2)]'
            : 'bg-[var(--color-surface-2)] border-[var(--color-line)] text-[var(--color-ink)]'
        )}
      >
        <Icon className="w-4 h-4" strokeWidth={1.9} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)] truncate">
          {text.title ?? tool.slug}
        </span>
        {text.desc && (
          <span className="block text-[12px] text-[var(--color-ink-3)] truncate">{text.desc}</span>
        )}
      </span>
      {active && (
        <CornerDownLeft className="w-3.5 h-3.5 text-[var(--color-ink-3)] flex-shrink-0" strokeWidth={2.2} />
      )}
    </button>
  );
}
