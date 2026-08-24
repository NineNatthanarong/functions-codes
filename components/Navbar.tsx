'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Menu, X, Languages, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { openCommandPalette } from '@/components/CommandPalette';
import { getTool } from '@/lib/tools';
import { FLOOR_ID, floorKeyForSlug, roomCode } from '@/lib/office';
import BuildingMark from '@/components/office/BuildingMark';

export default function Navbar() {
  const pathname = usePathname();
  const { locale, toggle, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const onLobby = pathname === '/' && !scrolled && !open;
  const slug = pathname?.replace(/^\//, '') ?? '';
  const tool = slug ? getTool(slug) : undefined;
  const floorKey = tool ? floorKeyForSlug(tool.slug) : 'all';
  const toolTitle = tool
    ? ((translations[locale].tools as Record<string, { title?: string }>)[tool.slug]?.title ?? tool.slug)
    : t.common.lobby;

  const floorLabels: Record<string, string> = {
    all: t.common.lobby,
    file: t.home.categoryFile,
    image: t.home.categoryImage,
    dev: t.home.categoryDev,
    write: t.home.categoryWrite,
    audio: t.home.categoryAudio,
    fun: t.home.categoryFun,
  };

  const links = [
    { href: '/', label: t.common.lobby },
    { href: '/file-converter', label: t.nav.fileConverter },
    { href: '/bgrm', label: t.nav.bgrm },
    { href: '/qr-generator', label: t.nav.qr },
  ];

  return (
    <nav className={cn('nav-shell', onLobby ? 'is-lobby' : 'is-stone')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 min-h-11">
            <span
              aria-hidden
              className={cn(
                'flex items-center justify-center w-8 h-8',
                onLobby
                  ? 'bg-[var(--color-accent)] text-[var(--color-ink-2)]'
                  : 'bg-[var(--color-ink-2)] text-[var(--color-accent)]'
              )}
            >
              <BuildingMark />
            </span>
            <span className="flex items-baseline gap-1 leading-none">
              <span className={cn('text-[15px] font-semibold tracking-[-0.02em]', onLobby ? 'text-white' : 'text-[var(--color-ink-2)]')}>
                functions
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-accent)]">
                .codes
              </span>
            </span>
          </Link>

          <p
            className={cn(
              'floor-readout hidden md:flex items-center gap-2 max-w-[28rem] truncate',
              onLobby ? 'text-[var(--color-lobby-mist)]' : 'text-[var(--color-ink)]'
            )}
            aria-live="polite"
          >
            <span className="text-[var(--color-accent)]">{FLOOR_ID[floorKey]}</span>
            {tool && <span>{roomCode(tool.slug)}</span>}
            <span className={onLobby ? 'text-white' : 'text-[var(--color-ink)]'}>
              {tool ? toolTitle : floorLabels[floorKey]}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={openCommandPalette}
              aria-label={t.common.concierge}
              title={t.common.concierge}
              className={cn(
                'inline-flex items-center gap-2 h-11 px-3 border min-w-11',
                onLobby
                  ? 'border-[var(--color-lobby-line)] bg-[var(--color-tower-mid)] text-[var(--color-lobby-mist)] hover:border-[var(--color-accent)] hover:text-white'
                  : 'border-[var(--color-line)] bg-white text-[var(--color-ink-3)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink-2)]'
              )}
            >
              <Search className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline text-[12px] font-medium tracking-[-0.01em]">
                {t.common.concierge}
              </span>
              <kbd
                className={cn(
                  'hidden md:inline-flex items-center px-1.5 py-0.5 border font-mono text-[10px]',
                  onLobby
                    ? 'border-[var(--color-lobby-line)] text-[var(--color-lobby-mist)]'
                    : 'border-[var(--color-line)] text-[var(--color-ink-3)]'
                )}
              >
                ⌘K
              </kbd>
            </button>

            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative inline-flex items-center gap-2 h-11 px-3 min-w-11',
                onLobby
                  ? 'bg-[var(--color-accent)] text-[var(--color-ink-2)]'
                  : 'bg-[var(--color-ink-2)] text-white'
              )}
              aria-label="Switch language"
              title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-[0.08em]">
                {locale === 'th' ? 'TH' : 'EN'}
              </span>
            </motion.button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                'md:hidden w-11 h-11 border flex items-center justify-center',
                onLobby
                  ? 'border-[var(--color-lobby-line)] bg-[var(--color-tower-mid)] text-white'
                  : 'border-[var(--color-line)] bg-white text-[var(--color-ink-2)]'
              )}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="md:hidden overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-base)]"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'px-4 py-3 text-[15px] font-medium min-h-11',
                      active
                        ? 'bg-[var(--color-ink-2)] text-white'
                        : 'text-[var(--color-ink)] hover:bg-white'
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
