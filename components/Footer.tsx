'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, ExternalLink, BookOpenText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Footer() {
    const { t, locale } = useLanguage();

    const sections: { label: string; items: { href: string; label: string }[] }[] = [
        {
            label: locale === 'th' ? 'ไฟล์และเอกสาร' : 'Files & docs',
            items: [
                { href: '/file-converter', label: t.tools['file-converter'].title },
                { href: '/pdf-tools', label: t.tools['pdf-tools'].title },
                { href: '/markdown-editor', label: t.tools['markdown-editor'].title },
            ],
        },
        {
            label: locale === 'th' ? 'รูปและสี' : 'Image & color',
            items: [
                { href: '/bgrm', label: t.tools['bgrm'].title },
                { href: '/image-compressor', label: t.tools['image-compressor'].title },
                { href: '/color-palette', label: t.tools['color-palette'].title },
            ],
        },
        {
            label: locale === 'th' ? 'นักพัฒนา' : 'Developer',
            items: [
                { href: '/json-formatter', label: t.tools['json-formatter'].title },
                { href: '/diff-viewer', label: t.tools['diff-viewer'].title },
                { href: '/unit-converter', label: t.tools['unit-converter'].title },
                { href: '/qr-generator', label: t.tools['qr-generator'].title },
            ],
        },
    ];

    return (
        <footer className="relative mt-12 bg-[var(--color-wine-700)] text-[var(--color-cream)] overflow-hidden">
            <div className="absolute inset-0 paper-grid opacity-[0.05] pointer-events-none" aria-hidden />

            {/* Top edge stitch */}
            <div className="relative h-3 bg-[var(--color-wine-600)] flex">
                {Array.from({ length: 24 }).map((_, i) => (
                    <span
                        key={i}
                        className="flex-1 border-r border-[var(--color-wine-800)]/40 last:border-r-0"
                    />
                ))}
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_2fr] gap-10">
                    {/* Brand block */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[var(--color-cream)] text-[var(--color-wine-700)] shadow-soft">
                                <BookOpenText className="w-5 h-5" strokeWidth={2.2} />
                            </span>
                            <span className="flex flex-col leading-tight">
                                <span className="text-base font-semibold tracking-tight">functions.codes</span>
                                <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-wine-200)]">
                                    {locale === 'th' ? 'ห้องเรียนเครื่องมือฟรี' : 'a free toolbox'}
                                </span>
                            </span>
                        </Link>

                        <p className="mt-5 text-sm text-[var(--color-wine-100)]/85 leading-relaxed max-w-md">
                            {t.footer.tagline}
                        </p>

                        <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--color-wine-800)]/60 border border-[var(--color-wine-600)] text-[12.5px] text-[var(--color-wine-100)]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-wine-200)]" />
                            {t.footer.privacyTitle}
                        </div>

                        <div className="mt-8 space-y-2.5">
                            <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-200)] font-semibold">
                                {t.footer.aboutHeading}
                            </p>
                            <p className="text-sm text-[var(--color-wine-100)]/85 leading-relaxed max-w-md">
                                {t.footer.aboutBody}
                            </p>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {sections.map((section) => (
                            <div key={section.label}>
                                <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-200)] font-semibold mb-4">
                                    {section.label}
                                </p>
                                <ul className="space-y-2.5">
                                    {section.items.map((it) => (
                                        <li key={it.href}>
                                            <Link
                                                href={it.href}
                                                className="group inline-flex items-center text-[14px] text-[var(--color-cream)]/90 hover:text-[var(--color-cream)] transition-colors"
                                            >
                                                <span className="relative">
                                                    {it.label}
                                                    <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-[var(--color-wine-200)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom row */}
                <div className="mt-14 pt-6 border-t border-[var(--color-wine-600)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <p className="text-[12.5px] text-[var(--color-wine-100)]/80">
                        © {new Date().getFullYear()} functions.codes — {t.footer.copyright}
                    </p>

                    <div className="flex items-center gap-4">
                        <motion.a
                            href="https://www.linkedin.com/in/natthanarong-tiangjit/"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-cream)] hover:text-white transition-colors"
                        >
                            {t.footer.followLinkedIn}
                            <ExternalLink className="w-3.5 h-3.5" />
                        </motion.a>

                        <span className="hidden md:inline-block w-px h-4 bg-[var(--color-wine-500)]" aria-hidden />

                        <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-wine-100)]/85">
                            {t.footer.builtBy}
                            <motion.span
                                animate={{ scale: [1, 1.18, 1] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                                className="inline-flex"
                                aria-hidden
                            >
                                <Heart className="w-3 h-3 fill-[var(--color-wine-200)] text-[var(--color-wine-200)]" />
                            </motion.span>
                            <span className="font-medium text-[var(--color-cream)]">{t.footer.author}</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
