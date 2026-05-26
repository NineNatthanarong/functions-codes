'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Menu, X, Languages, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Navbar() {
    const pathname = usePathname();
    const { locale, toggle, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const links = [
        { href: '/file-converter', label: t.nav.fileConverter },
        { href: '/bgrm', label: t.nav.bgrm },
        { href: '/qr-generator', label: t.nav.qr },
    ];

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                scrolled
                    ? 'glass border-b border-[var(--color-line)]'
                    : 'bg-transparent border-b border-transparent'
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span
                            aria-hidden
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-ink-2)] text-[var(--color-accent)]"
                        >
                            <Mark />
                        </span>
                        <span className="flex items-baseline gap-2 leading-none">
                            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-ink-2)]">
                                functions
                            </span>
                            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-accent)]">
                                .codes
                            </span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                        {links.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'relative px-3.5 py-1.5 text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-300',
                                        active
                                            ? 'text-[var(--color-ink-2)]'
                                            : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'
                                    )}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="navbar-pill"
                                            className="absolute inset-0 bg-[var(--color-surface-2)] rounded-full -z-0"
                                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative z-10">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        {pathname !== '/' && (
                            <Link
                                href="/"
                                title={t.common.home}
                                aria-label={t.common.home}
                                className="hidden sm:inline-flex w-9 h-9 rounded-full border border-[var(--color-line)] bg-white items-center justify-center text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300"
                            >
                                <Home className="w-3.5 h-3.5" strokeWidth={2.2} />
                            </Link>
                        )}
                        <LanguageToggle locale={locale} onToggle={toggle} />
                        <button
                            onClick={() => setOpen((v) => !v)}
                            className="md:hidden w-9 h-9 rounded-full border border-[var(--color-line)] bg-white flex items-center justify-center text-[var(--color-ink-2)] hover:border-[var(--color-accent)] transition-all duration-300"
                            aria-label={open ? 'Close menu' : 'Open menu'}
                        >
                            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
                        className="md:hidden overflow-hidden border-t border-[var(--color-line)] bg-white"
                    >
                        <div className="px-4 py-3 flex flex-col gap-0.5">
                            {links.map((link) => {
                                const active = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            'px-4 py-3 rounded-xl text-[14px] font-medium tracking-[-0.01em] transition-colors duration-200',
                                            active
                                                ? 'bg-[var(--color-surface-2)] text-[var(--color-ink-2)]'
                                                : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-2)]'
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function Mark() {
    return (
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h10v2.4H6v2.4h5.6v2.4H6V13H3V3z" fill="currentColor" />
        </svg>
    );
}

function LanguageToggle({ locale, onToggle }: { locale: 'th' | 'en'; onToggle: () => void }) {
    return (
        <motion.button
            onClick={onToggle}
            whileTap={{ scale: 0.96 }}
            className="relative inline-flex items-center gap-2 h-9 px-3 rounded-full bg-[var(--color-ink-2)] text-white hover:bg-[var(--color-ink)] transition-colors duration-300"
            aria-label="Switch language"
            title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
            <Languages className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">
                {locale === 'th' ? 'TH' : 'EN'}
            </span>
        </motion.button>
    );
}
