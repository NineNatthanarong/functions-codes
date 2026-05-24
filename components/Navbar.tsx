'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, Languages, BookOpenText, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Navbar() {
    const pathname = usePathname();
    const { locale, toggle, t } = useLanguage();
    const [open, setOpen] = useState(false);

    const links = [
        { href: '/file-converter', label: t.nav.fileConverter },
        { href: '/bgrm', label: t.nav.bgrm },
        { href: '/qr-generator', label: t.nav.qr },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-smoke-100)]/85 backdrop-blur-xl border-b border-[var(--color-wine-100)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <motion.div
                        whileHover={{ rotate: -2, scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                        className="flex items-center gap-2.5"
                    >
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <motion.span
                                aria-hidden
                                className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--color-wine-600)] text-[var(--color-cream)] shadow-soft"
                                whileHover={{ rotate: -8 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <BookOpenText className="w-5 h-5" strokeWidth={2.2} />
                            </motion.span>
                            <span className="flex flex-col leading-tight">
                                <span className="text-[15px] font-semibold tracking-tight text-[var(--color-wine-700)]">
                                    functions.codes
                                </span>
                                <span className="text-[10.5px] tracking-[0.18em] uppercase text-[var(--color-smoke-600)]">
                                    {locale === 'th' ? 'เครื่องมือฟรีในเบราว์เซอร์' : 'free browser tools'}
                                </span>
                            </span>
                        </Link>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'relative px-4 py-2 text-sm font-medium transition-colors rounded-full',
                                        active
                                            ? 'text-[var(--color-wine-700)]'
                                            : 'text-[var(--color-smoke-600)] hover:text-[var(--color-wine-600)]'
                                    )}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="navbar-pill"
                                            className="absolute inset-0 bg-[var(--color-wine-100)] rounded-full -z-0"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
                                className="hidden sm:inline-flex w-10 h-10 rounded-2xl border border-[var(--color-wine-200)] bg-white/60 items-center justify-center text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] transition-colors"
                            >
                                <Home className="w-4 h-4" />
                            </Link>
                        )}
                        <LanguageToggle locale={locale} onToggle={toggle} />
                        <button
                            onClick={() => setOpen((v) => !v)}
                            className="md:hidden w-10 h-10 rounded-2xl border border-[var(--color-wine-200)] bg-white/60 flex items-center justify-center text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] transition-colors"
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
                        transition={{ duration: 0.25, ease: [0.33, 0, 0.2, 1] }}
                        className="md:hidden overflow-hidden border-t border-[var(--color-wine-100)] bg-[var(--color-smoke-50)]"
                    >
                        <div className="px-4 py-4 flex flex-col gap-1">
                            {links.map((link) => {
                                const active = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            'px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                                            active
                                                ? 'bg-[var(--color-wine-100)] text-[var(--color-wine-700)]'
                                                : 'text-[var(--color-smoke-600)] hover:bg-[var(--color-wine-50)] hover:text-[var(--color-wine-700)]'
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

function LanguageToggle({ locale, onToggle }: { locale: 'th' | 'en'; onToggle: () => void }) {
    return (
        <motion.button
            onClick={onToggle}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            className="relative inline-flex items-center gap-2 h-10 px-1.5 rounded-full bg-[var(--color-wine-700)] text-[var(--color-cream)] shadow-soft border border-[var(--color-wine-800)]"
            aria-label="Switch language"
            title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
            <Languages className="w-3.5 h-3.5 ml-2 text-[var(--color-wine-200)]" />
            <span className="relative flex items-center text-[11.5px] font-semibold tracking-wider uppercase pr-2.5">
                <span className={cn('w-7 text-center transition-opacity', locale === 'th' ? 'opacity-100' : 'opacity-40')}>TH</span>
                <span className="relative w-9 h-6 mx-0.5 rounded-full bg-[var(--color-wine-900)]/40">
                    <motion.span
                        layout
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-[var(--color-cream)]"
                        animate={{ left: locale === 'th' ? 2 : 14 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </span>
                <span className={cn('w-7 text-center transition-opacity', locale === 'en' ? 'opacity-100' : 'opacity-40')}>EN</span>
            </span>
        </motion.button>
    );
}
