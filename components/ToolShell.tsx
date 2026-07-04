'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useLanguage, useT } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { getRelatedTools } from '@/lib/tools';
import { recordToolVisit } from '@/lib/useRecentTools';

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

const EASE = [0.25, 1, 0.5, 1] as const;

export default function ToolShell({
  icon, title, subtitle, kicker, width = 'wide', children, actions,
}: ToolShellProps) {
  const t = useT();
  const pathname = usePathname();
  const slug = pathname?.replace(/^\//, '') ?? '';

  useEffect(() => {
    if (slug) recordToolVisit(slug);
  }, [slug]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
  const decoY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const decoRot = useTransform(scrollYProgress, [0, 1], [0, 22]);

  return (
    <div className="relative pt-8 sm:pt-12 pb-24 overflow-hidden">
      <div className={`relative ${widthMap[width]} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="mb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[-0.01em] text-[var(--color-ink-3)] hover:text-[var(--color-accent)] transition-colors duration-300"
          >
            <motion.span
              whileHover={{ x: -2 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
              {t.common.home}
            </motion.span>
          </Link>
        </div>

        <motion.div
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mb-12 sm:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8"
        >
          {/* parallax decoration behind the title */}
          <motion.div
            aria-hidden
            style={{ y: decoY, rotate: decoRot }}
            className="pointer-events-none absolute -top-6 -right-2 hidden md:block w-24 h-24 rounded-2xl border border-[var(--color-line-strong)]"
          />

          <div className="relative flex items-start gap-5">
            <motion.span
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-ink-2)] text-[var(--color-accent)] flex-shrink-0"
            >
              {icon}
            </motion.span>
            <div className="flex-1 min-w-0">
              {kicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="kicker text-[var(--color-ink-3)] mb-3"
                >
                  {kicker}
                </motion.div>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="display-2 text-[2rem] sm:text-[2.75rem] text-[var(--color-ink-2)]"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
                className="mt-4 text-[15px] sm:text-[16px] text-[var(--color-ink-3)] max-w-2xl leading-[1.55] tracking-[-0.005em]"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>
          {actions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
              className="relative flex items-center gap-2 flex-shrink-0"
            >
              {actions}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55, ease: EASE }}
        >
          {children}
        </motion.div>

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
      <p className="kicker text-[var(--color-ink-3)] mb-6">{t.common.relatedTools}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map((tool) => {
          const text = (translations[locale].tools as Record<string, { title?: string; desc?: string }>)[tool.slug] ?? {};
          const Icon = tool.icon;
          return (
            <Link
              key={tool.slug}
              href={'/' + tool.slug}
              className="group flex items-center gap-3.5 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-ink-2)] transition-colors duration-300"
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
      className={`relative bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-6 sm:p-8 ${className}`}
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
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-ink-2)] text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-[var(--color-accent-deep)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300 ${className}`}
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
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white text-[var(--color-ink-2)] text-[13px] font-semibold tracking-[-0.01em] border border-[var(--color-line-strong)] hover:border-[var(--color-ink-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300 ${className}`}
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
    <div className="inline-flex p-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold tracking-[-0.01em] transition-colors duration-300 ${active ? 'text-white' : 'text-[var(--color-ink)] hover:text-[var(--color-ink-2)]'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-pill-${id}`}
                className="absolute inset-0 rounded-full bg-[var(--color-ink-2)] -z-0"
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
