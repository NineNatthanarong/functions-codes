'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n/LanguageProvider';

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

  return (
    <div className="relative pt-6 sm:pt-10 pb-20">
      <ToolBackdrop />
      <div className={`relative ${widthMap[width]} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] transition-colors group"
          >
            <motion.span
              whileHover={{ x: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.common.home}
            </motion.span>
          </Link>
        </div>

        <div className="mb-10 sm:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <motion.span
              initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-wine-700)] text-[var(--color-cream)] shadow-soft border-[1.5px] border-[var(--color-wine-800)]"
            >
              {icon}
            </motion.span>
            <div className="flex-1">
              {kicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-600)] font-semibold mb-1.5"
                >
                  {kicker}
                </motion.div>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-wine-700)] leading-tight"
              >
                <span className="relative inline-block">
                  <span className="relative z-10">{title}</span>
                  <motion.span
                    aria-hidden
                    className="absolute inset-x-0 bottom-1 h-2.5 sm:h-3 bg-[var(--color-wine-200)]/70 rounded-sm -z-0"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.55, ease: [0.33, 0, 0.2, 1] }}
                  />
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-2 text-[15px] text-[var(--color-smoke-600)] max-w-2xl leading-relaxed"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function ToolBackdrop() {
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 paper-grid opacity-[0.06]" />
      <motion.div
        animate={{ rotate: [0, 5, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -right-32 w-[380px] h-[380px] rounded-[42%_58%_55%_45%] bg-[var(--color-wine-100)] blur-3xl opacity-60"
      />
    </div>
  );
}

/* ─── shared sub-pieces ─── */

export function ToolCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative bg-white rounded-3xl border-[1.5px] border-[var(--color-wine-100)] shadow-soft p-6 sm:p-8 ${className}`}
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
      whileHover={disabled ? undefined : { scale: 1.015, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[var(--color-wine-700)] text-[var(--color-cream)] text-[14px] font-semibold border-[1.5px] border-[var(--color-wine-800)] shadow-soft hover:bg-[var(--color-wine-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
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
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-[var(--color-wine-700)] text-[13.5px] font-semibold border-[1.5px] border-[var(--color-wine-200)] hover:bg-[var(--color-wine-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
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
      ? 'text-[#a4364c] hover:bg-[#fbe3e7]'
      : 'text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)]';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium ${toneCls} disabled:opacity-50 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
        {children}
      </label>
      {hint && <span className="text-[11.5px] text-[var(--color-smoke-600)]">{hint}</span>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-4 rounded-2xl bg-white border-[1.5px] border-[var(--color-wine-100)] text-[14px] text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60 focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all shadow-[inset_0_1px_2px_rgba(85,40,52,0.04)] ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-2xl bg-white border-[1.5px] border-[var(--color-wine-100)] text-[14px] text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60 focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none shadow-[inset_0_1px_2px_rgba(85,40,52,0.04)] ${props.className ?? ''}`}
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
  return (
    <div className="inline-flex p-1 rounded-2xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-colors ${active ? 'text-[var(--color-cream)]' : 'text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)]'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${opt.label}-${options.length}`}
                className="absolute inset-0 rounded-xl bg-[var(--color-wine-700)] -z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
