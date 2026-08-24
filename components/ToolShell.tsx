'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { getRelatedTools, getTool } from '@/lib/tools';
import { recordToolVisit } from '@/lib/useRecentTools';
import { FLOOR_ID, floorKeyForSlug, roomCode } from '@/lib/office';

type ToolShellProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  /** Optional decorative kicker — short label above the title */
  kicker?: string;
  /** Page max-width: narrow / wide / xwide */
  width?: 'narrow' | 'wide' | 'xwide';
  children: ReactNode;
  /** Optional toolbar slot rendered on the right of the hero */
  actions?: ReactNode;
};

const widthMap = {
  narrow: 'max-w-3xl',
  wide: 'max-w-6xl',
  xwide: 'max-w-7xl',
};

export default function ToolShell({
  icon, title, subtitle, kicker, width = 'wide', children, actions,
}: ToolShellProps) {
  const t = useT();
  const { locale } = useLanguage();
  const pathname = usePathname();
  const slug = pathname?.replace(/^\//, '') ?? '';
  const tool = getTool(slug);
  const floorKey = tool ? floorKeyForSlug(tool.slug) : 'all';
  const floorNames: Record<string, string> = {
    all: t.common.lobby,
    file: t.home.categoryFile,
    image: t.home.categoryImage,
    dev: t.home.categoryDev,
    write: t.home.categoryWrite,
    audio: t.home.categoryAudio,
    fun: t.home.categoryFun,
  };

  useEffect(() => {
    if (slug) recordToolVisit(slug);
  }, [slug]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);

  return (
    <div className="relative pt-8 sm:pt-12 pb-24">
      <div className={`relative ${widthMap[width]} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 min-h-11 text-[13px] font-medium text-[var(--color-ink-3)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
            {t.common.lobby}
          </Link>
          <span className="font-mono text-[11px] text-[var(--color-ink-3)] tracking-[0.04em]">
            {FLOOR_ID[floorKey]} · {floorNames[floorKey]}
            {tool ? ` · ${roomCode(tool.slug)}` : ''}
          </span>
        </div>

        <motion.div
          ref={heroRef}
          style={{ y: heroY }}
          className="relative mb-10 sm:mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8"
        >
          <div className="relative flex items-start gap-5">
            <span className="hidden sm:inline-flex items-center justify-center w-12 h-12 bg-[var(--color-ink-2)] text-[var(--color-accent)] flex-shrink-0">
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              {(kicker || tool) && (
                <p className="kicker text-[var(--color-ink-3)] mb-3">
                  {kicker ?? floorNames[floorKey]}
                </p>
              )}
              <h1 className="display-2 text-[2rem] sm:text-[2.5rem] text-[var(--color-ink-2)]">
                {title}
              </h1>
              <p className="mt-4 text-[15px] sm:text-[16px] text-[var(--color-ink-3)] max-w-2xl leading-[1.6]">
                {subtitle}
              </p>
            </div>
          </div>
          {actions && (
            <div className="relative flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </motion.div>

        <div>
          {children}
        </div>

        <RelatedTools slug={slug} />
      </div>
    </div>
  );
}

function RelatedTools({ slug }: { slug: string }) {
  const { t, locale } = useLanguage();
  const related = getRelatedTools(slug, 3);
  if (related.length === 0) return null;

  return (
    <div className="mt-20 pt-10 border-t border-[var(--color-line)]">
      <p className="kicker text-[var(--color-ink-3)] mb-6">{t.common.onThisFloor}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--color-line)] border border-[var(--color-line)]">
        {related.map((tool) => {
          const text = (translations[locale].tools as Record<string, { title?: string; desc?: string }>)[tool.slug] ?? {};
          const Icon = tool.icon;
          return (
            <Link
              key={tool.slug}
              href={'/' + tool.slug}
              className="group flex items-center gap-3.5 p-4 bg-[var(--color-surface)] hover:bg-white min-h-16"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-[var(--color-line)] text-[var(--color-ink)] group-hover:bg-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-ink-2)] transition-colors duration-300 flex-shrink-0">
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
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-ink-4)] group-hover:text-[var(--color-accent)] transition-colors duration-300 flex-shrink-0" strokeWidth={2.2} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── shared sub-pieces ─── */

export function ToolCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative bg-[var(--color-surface)] border border-[var(--color-line)] p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children, onClick, disabled, type = 'button', className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-3 min-h-11 bg-[var(--color-accent)] text-[var(--color-ink-2)] text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-[var(--color-accent-deep)] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children, onClick, disabled, className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 bg-white text-[var(--color-ink-2)] text-[13px] font-semibold tracking-[-0.01em] border border-[var(--color-line-strong)] hover:border-[var(--color-ink-2)] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children, onClick, disabled, className = '', tone = 'default',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  tone?: 'default' | 'danger';
}) {
  const toneCls =
    tone === 'danger'
      ? 'text-[#d62828] hover:bg-[#fde5e5]'
      : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium ${toneCls} disabled:opacity-40 transition-colors duration-200 ${className}`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <label className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]">
        {children}
      </label>
      {hint && <span className="text-[11.5px] text-[var(--color-ink-3)]">{hint}</span>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-4 rounded-xl bg-white border border-[var(--color-line)] text-[14px] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 transition-all duration-300 ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-line)] text-[14px] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 transition-all duration-300 resize-none ${props.className ?? ''}`}
    />
  );
}

export function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="inline-flex p-1 bg-[var(--color-surface-2)] border border-[var(--color-line)]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3.5 py-1.5 min-h-11 text-[12.5px] font-semibold tracking-[-0.01em] ${active ? 'text-white' : 'text-[var(--color-ink)] hover:text-[var(--color-ink-2)]'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-pill-${id}`}
                className="absolute inset-0 bg-[var(--color-ink-2)] -z-0"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
