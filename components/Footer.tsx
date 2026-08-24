'use client';

import Link from 'next/link';
import { Heart, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { TOOLS, type ToolCategory } from '@/lib/tools';
import { FLOOR_ID } from '@/lib/office';
import BuildingMark from '@/components/office/BuildingMark';

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

  const sections = CATEGORY_ORDER
    .map((cat) => ({
      id: FLOOR_ID[cat],
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
    <footer className="relative mt-0 bg-[var(--color-tower)] text-[#f4f6fa]">
      <div className="h-1 w-full bg-[var(--color-accent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2fr] gap-14 lg:gap-20">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 bg-[var(--color-accent)] text-[var(--color-ink-2)]">
                <BuildingMark />
              </span>
              <span className="flex items-baseline gap-1 leading-none">
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">functions</span>
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-accent)]">.codes</span>
              </span>
            </Link>

            <p className="mt-7 text-[15px] text-[var(--color-lobby-mist)] leading-[1.6] max-w-md">
              {t.footer.tagline}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 border border-[var(--color-lobby-line)] text-[12px] text-[var(--color-lobby-mist)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
              {t.footer.privacyTitle}
            </div>

            <p className="mt-10 max-w-md text-[14px] text-[var(--color-lobby-mist)] leading-[1.6]">
              {t.footer.aboutBody}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="font-mono text-[11px] text-[var(--color-accent)] mb-4 tracking-[0.04em]">
                  {section.id} · {section.label}
                </p>
                <ul className="space-y-2.5">
                  {section.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className="text-[14px] text-[var(--color-lobby-mist)] hover:text-white"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-[var(--color-lobby-line)] flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <p className="text-[12.5px] text-[var(--color-lobby-mist)]">
            © {new Date().getFullYear()} functions.codes — {t.footer.copyright}
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <a
              href="https://www.linkedin.com/in/natthanarong-tiangjit/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-lobby-mist)] hover:text-[var(--color-accent)]"
            >
              {t.footer.followLinkedIn}
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
            </a>
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-lobby-mist)]">
              {t.footer.builtBy}
              <Heart className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" />
              <span className="font-medium text-white">{t.footer.author}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
