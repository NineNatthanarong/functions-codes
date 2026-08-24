'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, ArrowUpRight, Clock3, ShieldCheck, WifiOff, HeartHandshake } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { TOOLS, getTool, type ToolKey, type ToolDef, type ToolCategory } from '@/lib/tools';
import { useRecentTools } from '@/lib/useRecentTools';
import { cn } from '@/lib/utils';
import { FLOOR_ID, FLOOR_ORDER, roomCode, type FloorKey } from '@/lib/office';
import Skyline from '@/components/office/Skyline';
import LobbyClock from '@/components/office/LobbyClock';
import { ElevatorDoors, ElevatorPanel, useElevatorRide } from '@/components/office/Elevator';

type CardText = { title: string; desc: string };

function toolText(locale: 'th' | 'en', slug: string): CardText {
  return (translations[locale].tools as Record<string, CardText>)[slug] ?? { title: slug, desc: '' };
}

function normalize(s: string): string {
  return s.normalize('NFC').toLowerCase();
}

function buildSearchEntries() {
  return TOOLS.map((tool) => {
    const th = toolText('th', tool.slug);
    const en = toolText('en', tool.slug);
    const haystack = normalize(
      [
        tool.slug,
        tool.slug.replace(/-/g, ' '),
        th.title, th.desc,
        en.title, en.desc,
        ...tool.aliases,
      ].join(' ')
    );
    return { key: tool.slug as ToolKey, haystack };
  });
}

const SEARCH_ENTRIES = buildSearchEntries();

function tokenize(q: string): string[] {
  const norm = normalize(q.trim());
  if (!norm) return [];
  const matches = norm.match(/[฀-๿]+|[a-z0-9_./%-]+/g);
  return matches ? matches.filter(Boolean) : [];
}

type Listed = {
  key: ToolKey;
  def: ToolDef;
  href: string;
  title: string;
  desc: string;
  category: ToolCategory;
  room: string;
};

export default function Home() {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const ride = useElevatorRide('all');
  const reduced = useReducedMotion();

  const floorLabels: Record<FloorKey, string> = {
    all: t.common.lobby,
    file: t.home.categoryFile,
    image: t.home.categoryImage,
    dev: t.home.categoryDev,
    write: t.home.categoryWrite,
    audio: t.home.categoryAudio,
    fun: t.home.categoryFun,
  };

  const tools = useMemo<Listed[]>(() => {
    const tokens = tokenize(searchQuery);
    const matchedKeys = new Set<ToolKey>(
      tokens.length === 0
        ? TOOLS.map((tool) => tool.slug as ToolKey)
        : SEARCH_ENTRIES.filter((e) => tokens.every((tok) => e.haystack.includes(tok))).map((e) => e.key)
    );

    return TOOLS
      .filter((tool) => matchedKeys.has(tool.slug as ToolKey))
      .filter((tool) => ride.floor === 'all' || tool.category === ride.floor)
      .map((tool) => ({
        key: tool.slug as ToolKey,
        def: tool as ToolDef,
        ...toolText(locale, tool.slug),
        category: tool.category as ToolCategory,
        href: '/' + tool.slug,
        room: roomCode(tool.slug),
      }));
  }, [searchQuery, ride.floor, locale]);

  const grouped = useMemo(() => {
    if (ride.floor !== 'all' || searchQuery.trim()) return null;
    return FLOOR_ORDER.filter((k) => k !== 'all').map((key) => ({
      key,
      id: FLOOR_ID[key],
      label: floorLabels[key],
      items: tools.filter((t) => t.category === key),
    })).filter((g) => g.items.length > 0);
  }, [ride.floor, searchQuery, tools, floorLabels]);

  const featured = !searchQuery.trim() && ride.floor !== 'all' ? tools[0] : undefined;
  const rest = featured ? tools.slice(1) : tools;
  const shownFloorKey = (FLOOR_ORDER.find((k) => FLOOR_ID[k] === ride.shown) ?? ride.floor);

  return (
    <div className="relative">
      <a
        href="#directory"
        className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-[80] focus:bg-white focus:px-3 focus:py-2"
      >
        {t.common.directory}
      </a>

      <section className="lobby-atrium -mt-16">
        <div className="lobby-stage">
          <div className="lobby-copy">
            <span className="lobby-plaque">
              <span className="lobby-plaque-lamp" />
              {t.home.kicker}
            </span>

            <h1
              className={cn(
                'display-1 text-white mt-6',
                locale === 'th'
                  ? 'text-[2rem] sm:text-[2.5rem] lg:text-[3.25rem] leading-[1.2]'
                  : 'text-[2.25rem] sm:text-[2.75rem] lg:text-[3.5rem] leading-[1.08]'
              )}
            >
              <span className="block">{t.home.heading1}</span>
              <span className="block">{t.home.heading2}</span>
              {t.home.heading3 ? <span className="block">{t.home.heading3}</span> : null}
            </h1>

            <p className="lobby-lead mt-4 max-w-[46ch] text-[16px] sm:text-[17px] leading-[1.65]">
              {t.home.lead}
            </p>

            <ConciergeSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t.home.searchPlaceholder}
              resultCount={tools.length}
              locale={locale}
              t={t}
            />

            <ul className="lobby-trust mt-8">
              <li>
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
                {t.home.badge1}
              </li>
              <li>
                <WifiOff className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
                {t.home.badge2}
              </li>
              <li>
                <HeartHandshake className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
                {t.home.badge3}
              </li>
            </ul>
          </div>

          <div className="lobby-window" aria-hidden>
            <Skyline />
            <div className="lobby-window-meta">
              <LobbyClock />
              <span className="lobby-hours">{t.common.alwaysOpen}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="directory" className="work-floor pt-0 md:pt-10 pb-20">
        <div className="max-w-7xl mx-auto md:px-6 lg:px-8 md:grid md:grid-cols-[13.5rem_1fr] md:gap-8 lg:gap-12">
          <aside className="elevator-rail z-sticky md:self-start bg-[var(--color-tower)] md:bg-transparent">
            <ElevatorPanel
              floor={ride.floor}
              shown={ride.shown}
              shut={ride.shut}
              onChange={(f) => {
                ride.go(f);
                if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
                  document.getElementById('directory')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
                }
              }}
              labels={floorLabels}
              ariaLabel={t.common.elevator}
            />
          </aside>

          <div className="px-4 sm:px-6 md:px-0 pt-6 md:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <p className="font-mono text-[11px] text-[var(--color-ink-3)] tracking-[0.04em]">
                  {t.common.nowOn} {ride.shown} · {floorLabels[shownFloorKey]}
                </p>
                <h2 className="display-2 text-[1.75rem] sm:text-[2.15rem] text-[var(--color-ink)] mt-1">
                  {t.common.directory}
                </h2>
              </div>
              <p className="font-mono text-[12px] text-[var(--color-ink-3)] tabular-nums">
                {tools.length} {t.common.rooms}
              </p>
            </div>

            <RecentRooms locale={locale} t={t} />

            <div className="directory-stage">
              <ElevatorDoors
                shut={ride.shut}
                shown={ride.shown}
                label={floorLabels[shownFloorKey]}
              />

              {tools.length === 0 && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-line)] p-10 text-center">
                  <p className="text-[15px] font-semibold text-[var(--color-ink)]">
                    {t.common.vacantFloor} “{searchQuery}”
                  </p>
                  <p className="text-[13.5px] text-[var(--color-ink-3)] mt-2">{t.common.vacantHint}</p>
                </div>
              )}

              {featured && (
                <SuiteRow item={featured} enterLabel={t.common.enterRoom} newLabel={t.common.newBadge} />
              )}

              {grouped
                ? grouped.map((g) => (
                    <div key={g.key} className="mb-2">
                      <div className="dir-floor-head">
                        <span className="dir-floor-id">{g.id}</span>
                        <span className="dir-floor-name">{g.label}</span>
                        <span className="dir-floor-count">
                          {g.items.length} {t.common.rooms}
                        </span>
                      </div>
                      {g.items.map((item) => (
                        <DirRow key={item.key} item={item} newLabel={t.common.newBadge} />
                      ))}
                    </div>
                  ))
                : rest.map((item) => (
                    <DirRow key={item.key} item={item} newLabel={t.common.newBadge} />
                  ))}
            </div>
          </div>
        </div>
      </section>

      <section className="security-desk">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid md:grid-cols-[1.2fr_1fr] gap-12">
          <div>
            <h2 className="display-2 text-[2rem] sm:text-[2.5rem] text-white">
              {t.home.privacyTitle}
            </h2>
            <p className="mt-5 max-w-md text-[15px] text-[var(--color-lobby-mist)] leading-[1.6]">
              {t.home.privacyBody}
            </p>
          </div>
          <ul className="space-y-5 self-center">
            {[
              locale === 'th' ? 'ไม่ต้องสมัครครับ' : 'No account to create.',
              locale === 'th' ? 'ไฟล์ไม่ออกจากเครื่อง' : 'Your files don’t go anywhere.',
              locale === 'th' ? 'ใช้ได้เลยทันที' : 'Ready when you are.',
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-[15px] text-[#f4f6fa]">
                <span className="security-lamp" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function ConciergeSearch({
  value, onChange, placeholder, resultCount, locale, t,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  resultCount: number;
  locale: 'th' | 'en';
  t: ReturnType<typeof useLanguage>['t'];
}) {
  return (
    <div className="relative mt-6 w-full max-w-lg">
      <div className="reception-desk">
        <div className="pl-4 sm:pl-5 text-[var(--color-ink-3)] pointer-events-none">
          <Search className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <input
          type="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onChange('');
            if (e.key === 'Enter') {
              document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          placeholder={placeholder}
          className="w-full h-14 sm:h-16 px-3 bg-transparent text-[15px] sm:text-[16px] focus:outline-none"
          aria-label={t.common.search}
        />
        <div className="flex items-center gap-1 pr-2">
          {value && (
            <span className="hidden sm:inline font-mono text-[11px] text-[var(--color-ink-3)] pr-2 tabular-nums">
              {resultCount} {t.common.rooms}
            </span>
          )}
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="inline-flex items-center justify-center w-11 h-11 text-[var(--color-ink-3)] hover:text-[var(--color-ink)]"
            >
              <X className="w-4 h-4" strokeWidth={2.2} />
            </button>
          ) : (
            <a
              href="#directory"
              className="inline-flex items-center justify-center w-11 h-11 mr-1 bg-[var(--color-accent)] text-[var(--color-ink-2)] hover:bg-[var(--color-accent-deep)]"
              aria-label={t.common.directory}
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentRooms({ t, locale }: { t: ReturnType<typeof useLanguage>['t']; locale: 'th' | 'en' }) {
  const recents = useRecentTools();
  const tools = recents
    .map((slug) => getTool(slug))
    .filter((x): x is ToolDef => Boolean(x))
    .slice(0, 5);
  if (tools.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-ink-3)] mr-1">
        <Clock3 className="w-3.5 h-3.5" strokeWidth={2.2} />
        {t.common.lastRooms}
      </span>
      {tools.map((tool) => (
        <Link
          key={tool.slug}
          href={'/' + tool.slug}
          className="inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 bg-white border border-[var(--color-line)] text-[12.5px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)] min-h-11 sm:min-h-0"
        >
          <span className="font-mono text-[10px] text-[var(--color-ink-3)]">{roomCode(tool.slug)}</span>
          {toolText(locale, tool.slug).title}
        </Link>
      ))}
    </div>
  );
}

function DirRow({ item, newLabel }: { item: Listed; newLabel: string }) {
  const Icon = item.def.icon;
  return (
    <Link href={item.href} className="dir-row group">
      <span className="dir-code">{item.room}</span>
      <span className="min-w-0">
        <span className="dir-name">
          {item.title}
          {(item.def as { isNew?: boolean }).isNew && (
            <span className="ml-2 font-mono text-[10px] text-[var(--color-accent-deep)]">{newLabel}</span>
          )}
        </span>
        <span className="dir-desc truncate">{item.desc}</span>
      </span>
      <span className="inline-flex items-center gap-3">
        <Icon className="w-4 h-4 text-[var(--color-ink-3)] hidden sm:block" strokeWidth={1.8} />
        <span className="dir-lamp" />
      </span>
    </Link>
  );
}

function SuiteRow({
  item, enterLabel, newLabel,
}: {
  item: Listed;
  enterLabel: string;
  newLabel: string;
}) {
  const Icon = item.def.icon;
  return (
    <Link href={item.href} className="dir-suite group">
      <span className="dir-icon">
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="dir-code">{item.room}</span>
        <span className="dir-name mt-1">
          {item.title}
          {(item.def as { isNew?: boolean }).isNew && (
            <span className="ml-2 font-mono text-[10px] text-[var(--color-accent)]">{newLabel}</span>
          )}
        </span>
        <span className="dir-desc">{item.desc}</span>
      </span>
      <span className="dir-enter inline-flex items-center gap-1.5">
        {enterLabel}
        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
      </span>
    </Link>
  );
}
