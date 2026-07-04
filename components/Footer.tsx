'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { TOOLS, type ToolCategory } from '@/lib/tools';

const CATEGORY_ORDER: ToolCategory[] = ['file', 'image', 'dev', 'write', 'audio', 'fun'];

export default function Footer() {
    const { t, locale } = useLanguage();

    const categoryLabels: Record<ToolCategory, string> = {
        file: t.home.categoryFile,
        image: t.home.categoryImage,
        dev: t.home.categoryDev,
        write: t.home.categoryWrite,
        audio: t.home.categoryAudio,
        fun: t.home.categoryFun,
    };

    // every tool, grouped by category — derived from the central registry
    const sections = CATEGORY_ORDER
        .map((cat) => ({
            label: categoryLabels[cat],
            items: TOOLS
                .filter((tool) => tool.category === cat)
                .map((tool) => ({
                    href: '/' + tool.slug,
                    label:
                        (translations[locale].tools as Record<string, { title?: string }>)[tool.slug]?.title
                        ?? tool.slug,
                })),
        }))
        .filter((s) => s.items.length > 0);

    return (
        <footer className="relative mt-24 border-t border-[var(--color-line)] bg-white">
            {/* thin accent bar */}
            <div className="h-0.5 w-full bg-[var(--color-accent)]" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-16 lg:gap-24">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-ink-2)] text-[var(--color-accent)]">
                                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                                    <path d="M3 3h10v2.4H6v2.4h5.6v2.4H6V13H3V3z" fill="currentColor" />
                                </svg>
                            </span>
                            <span className="flex items-baseline gap-1.5 leading-none">
                                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-ink-2)]">
                                    functions
                                </span>
                                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-accent)]">
                                    .codes
                                </span>
                            </span>
                        </Link>

                        <p className="mt-8 text-[15px] text-[var(--color-ink-2)] leading-[1.55] tracking-[-0.005em] max-w-md">
                            {t.footer.tagline}
                        </p>

                        <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)] text-[12px] text-[var(--color-ink)] tracking-[-0.005em]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
                            {t.footer.privacyTitle}
                        </div>

                        <div className="mt-12 max-w-md">
                            <p className="kicker text-[var(--color-ink-3)] mb-3">
                                {t.footer.aboutHeading}
                            </p>
                            <p className="text-[14px] text-[var(--color-ink-2)] leading-[1.6] tracking-[-0.005em]">
                                {t.footer.aboutBody}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-12">
                        {sections.map((section) => (
                            <div key={section.label}>
                                <p className="kicker text-[var(--color-ink-3)] mb-5">
                                    {section.label}
                                </p>
                                <ul className="space-y-3">
                                    {section.items.map((it) => (
                                        <li key={it.href}>
                                            <Link
                                                href={it.href}
                                                className="group inline-flex items-center text-[14px] text-[var(--color-ink-2)] hover:text-[var(--color-accent)] tracking-[-0.005em] transition-colors duration-200"
                                            >
                                                <span className="relative">
                                                    {it.label}
                                                    <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-[var(--color-accent)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-[var(--color-line)] flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <p className="text-[12.5px] text-[var(--color-ink-3)] tracking-[-0.005em]">
                        © {new Date().getFullYear()} functions.codes — {t.footer.copyright}
                    </p>

                    <div className="flex items-center gap-5">
                        <motion.a
                            href="https://www.linkedin.com/in/natthanarong-tiangjit/"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors duration-200"
                        >
                            {t.footer.followLinkedIn}
                            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </motion.a>

                        <span className="hidden md:inline-block w-px h-3.5 bg-[var(--color-line-strong)]" aria-hidden />

                        <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-ink-3)] tracking-[-0.005em]">
                            {t.footer.builtBy}
                            <Heart className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                            <span className="font-medium text-[var(--color-ink)]">{t.footer.author}</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
