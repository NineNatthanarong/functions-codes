'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, MotionValue } from 'framer-motion';
import {
  Search, FileText, Image as ImageIcon, Scissors, QrCode, Lock, Palette, Braces,
  Type, ArrowRightLeft, Minimize2, ArrowUpRight, Mic, Edit, ShieldCheck, WifiOff,
  HeartHandshake, Crop, Pipette, Stamp, Shuffle, Disc3, Languages, X,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { translations } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

type ToolKey =
  | 'file-converter' | 'bgrm' | 'image-compressor' | 'qr-generator'
  | 'json-formatter' | 'password-generator' | 'color-palette' | 'lorem-ipsum'
  | 'diff-viewer' | 'unit-converter' | 'pdf-tools' | 'audio-editor' | 'markdown-editor'
  | 'exif-stripper' | 'image-cropper' | 'color-picker' | 'color-tools'
  | 'watermark' | 'random-picker' | 'spin-wheel' | 'thai-keyboard';

type Category = 'all' | 'file' | 'image' | 'dev' | 'write' | 'audio' | 'fun';

const EASE = [0.25, 1, 0.5, 1] as const;

const toolIcons: Record<ToolKey, React.ReactNode> = {
  'file-converter': <FileText className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'bgrm': <Scissors className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'image-compressor': <ImageIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'qr-generator': <QrCode className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'json-formatter': <Braces className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'password-generator': <Lock className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'color-palette': <Palette className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'lorem-ipsum': <Type className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'diff-viewer': <ArrowRightLeft className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'unit-converter': <Minimize2 className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'pdf-tools': <FileText className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'audio-editor': <Mic className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'markdown-editor': <Edit className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'exif-stripper': <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'image-cropper': <Crop className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'color-picker': <Pipette className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'color-tools': <Palette className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'watermark': <Stamp className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'random-picker': <Shuffle className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'spin-wheel': <Disc3 className="w-[18px] h-[18px]" strokeWidth={1.8} />,
  'thai-keyboard': <Languages className="w-[18px] h-[18px]" strokeWidth={1.8} />,
};

const orderedKeys: ToolKey[] = [
  'file-converter', 'bgrm', 'image-cropper', 'image-compressor',
  'exif-stripper', 'watermark', 'color-picker', 'color-tools',
  'color-palette', 'qr-generator', 'json-formatter', 'password-generator',
  'pdf-tools', 'markdown-editor', 'thai-keyboard', 'diff-viewer',
  'unit-converter', 'audio-editor', 'lorem-ipsum', 'random-picker', 'spin-wheel',
];

const aliases: Record<ToolKey, string[]> = {
  'file-converter': ['convert', 'converter', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'document', 'แปลง', 'แปลงไฟล์', 'แปลงรูป', 'แปลงเอกสาร', 'เอกสาร', 'ไฟล์', 'รูป', 'พีดีเอฟ'],
  'bgrm': ['background', 'remover', 'remove bg', 'transparent', 'cutout', 'ลบ', 'ลบพื้นหลัง', 'ตัดพื้นหลัง', 'พื้นหลัง', 'พื้นหลังโปร่ง', 'โปร่งใส'],
  'image-compressor': ['compress', 'compressor', 'shrink', 'smaller', 'reduce', 'optimize', 'บีบ', 'บีบอัด', 'ย่อ', 'ย่อรูป', 'ลดขนาด', 'ลดขนาดรูป', 'ลดน้ำหนัก'],
  'qr-generator': ['qr', 'qrcode', 'qr code', 'barcode', 'generate qr', 'คิวอาร์', 'คิวอาร์โค้ด', 'สร้างคิวอาร์', 'สร้างqr', 'qrโค้ด'],
  'json-formatter': ['json', 'pretty', 'minify', 'beautify', 'validate', 'format', 'จัดรูปแบบ', 'จัดเจสัน', 'จัดjson', 'jsonสวย', 'เจสัน'],
  'password-generator': ['password', 'pass', 'pwd', 'random password', 'secure', 'รหัส', 'รหัสผ่าน', 'พาส', 'พาสเวิร์ด', 'สร้างรหัส', 'รหัสปลอดภัย'],
  'color-palette': ['palette', 'theme', 'colors', 'extract', 'พาเลตต์', 'พาเลท', 'สี', 'สีจากรูป', 'ดึงสี', 'สกัดสี'],
  'lorem-ipsum': ['lorem', 'ipsum', 'placeholder', 'dummy', 'dummy text', 'fake', 'ตัวอย่าง', 'ข้อความตัวอย่าง', 'lorem ipsum', 'ข้อความหลอก'],
  'diff-viewer': ['diff', 'compare', 'changes', 'เปรียบเทียบ', 'เทียบ', 'ความต่าง', 'หาต่าง', 'เทียบข้อความ'],
  'unit-converter': ['css', 'unit', 'px', 'rem', 'em', 'percent', '%', 'แปลงหน่วย', 'หน่วย', 'หน่วยซีเอสเอส', 'พิกเซล'],
  'pdf-tools': ['pdf', 'merge', 'split', 'compress pdf', 'combine', 'พีดีเอฟ', 'รวม', 'รวมpdf', 'รวมไฟล์', 'แยก', 'แยกหน้า', 'บีบpdf', 'รวมเอกสาร'],
  'audio-editor': ['audio', 'mp3', 'wav', 'sound', 'trim', 'cut audio', 'เสียง', 'ตัดเสียง', 'ตัดต่อเสียง', 'ไฟล์เสียง', 'เพลง', 'คลื่นเสียง', 'wave'],
  'markdown-editor': ['markdown', 'md', 'note', 'editor', 'docs', 'มาร์กดาวน์', 'เขียนโน้ต', 'เขียนเอกสาร', 'มาร์คดาวน์'],
  'exif-stripper': ['exif', 'metadata', 'gps', 'privacy', 'strip', 'clean', 'ลบเมตา', 'เมตา', 'เมตาดาต้า', 'ลบจีพีเอส', 'จีพีเอส', 'ข้อมูลแฝง', 'ข้อมูลไฟล์', 'ความเป็นส่วนตัว'],
  'image-cropper': ['crop', 'cropper', 'resize', 'rotate', 'flip', 'trim image', 'ครอบรูป', 'ครอบ', 'ตัดรูป', 'ปรับขนาด', 'ปรับขนาดรูป', 'หมุน', 'หมุนรูป', 'พลิก'],
  'color-picker': ['picker', 'pick color', 'eyedropper', 'dropper', 'color from screen', 'หยดสี', 'เลือกสี', 'อายดรอปเปอร์', 'ดูดสี', 'ดูดเฉดสี'],
  'color-tools': ['color converter', 'gradient', 'hex', 'rgb', 'hsl', 'oklch', 'css gradient', 'แปลงสี', 'ไล่สี', 'ไล่ระดับ', 'ไล่ระดับสี', 'เกรเดียนต์', 'เฮ็กซ์', 'อาร์จีบี'],
  'watermark': ['watermark', 'stamp', 'logo', 'overlay', 'sign image', 'ลายน้ำ', 'ติดลายน้ำ', 'ใส่ลายน้ำ', 'โลโก้', 'แสตมป์'],
  'random-picker': ['random', 'pick', 'lottery', 'name picker', 'shuffle', 'draw', 'สุ่ม', 'สุ่มชื่อ', 'สุ่มรายการ', 'จับฉลาก', 'จับสลาก', 'แรนดอม'],
  'spin-wheel': ['wheel', 'spin', 'lucky draw', 'roulette', 'fortune wheel', 'วงล้อ', 'หมุนวงล้อ', 'หมุน', 'ล้อสุ่ม', 'จับฉลาก', 'จับสลาก'],
  'thai-keyboard': ['kedmanee', 'layout', 'keyboard', 'mistype', 'wrong layout', 'thai keyboard', 'แป้นพิมพ์', 'แป้น', 'คีย์บอร์ด', 'พิมพ์ผิด', 'พิมพ์ภาษาผิด', 'แก้ภาษา', 'พิมพ์ไทย', 'l;ylfu', 'สวัสดี', 'เกษมณี'],
};

function normalize(s: string): string {
  return s.normalize('NFC').toLowerCase();
}

function buildSearchEntries() {
  return orderedKeys.map((key) => {
    const th = translations.th.tools[key];
    const en = translations.en.tools[key];
    const haystack = normalize(
      [
        key,
        key.replace(/-/g, ' '),
        th.title, th.desc,
        en.title, en.desc,
        ...(aliases[key] ?? []),
      ].join(' ')
    );
    return { key, haystack };
  });
}

const SEARCH_ENTRIES = buildSearchEntries();

function tokenize(q: string): string[] {
  const norm = normalize(q.trim());
  if (!norm) return [];
  const matches = norm.match(/[฀-๿]+|[a-z0-9_./%-]+/g);
  return matches ? matches.filter(Boolean) : [];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function Home() {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Parallax layers — different speeds for depth
  const heroBgY = useTransform(heroProgress, [0, 1], ['0%', '40%']);
  const heroMidY = useTransform(heroProgress, [0, 1], ['0%', '20%']);
  const heroFgY = useTransform(heroProgress, [0, 1], ['0%', '-8%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.94]);

  const tools = useMemo(() => {
    const tokens = tokenize(searchQuery);

    const matchedKeys = new Set<ToolKey>(
      tokens.length === 0
        ? orderedKeys
        : SEARCH_ENTRIES.filter((e) => tokens.every((tok) => e.haystack.includes(tok))).map((e) => e.key as ToolKey)
    );

    return orderedKeys
      .filter((key) => matchedKeys.has(key))
      .map((key) => ({ key, ...t.tools[key], href: '/' + key }))
      .filter((tool) => category === 'all' || tool.category === category);
  }, [searchQuery, category, t]);

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: t.home.categoryAll },
    { key: 'file', label: t.home.categoryFile },
    { key: 'image', label: t.home.categoryImage },
    { key: 'dev', label: t.home.categoryDev },
    { key: 'write', label: t.home.categoryWrite },
    { key: 'audio', label: t.home.categoryAudio },
    { key: 'fun', label: locale === 'th' ? 'สนุก' : 'Fun' },
  ];

  return (
    <div className="relative">
      {/* ──────── HERO with parallax ──────── */}
      <section
        ref={heroRef}
        className="relative h-[calc(100vh-4rem)] min-h-[640px] flex items-center justify-center overflow-hidden parallax-stage"
      >
        <ParallaxAmbient bgY={heroBgY} midY={heroMidY} />

        <motion.div
          style={{ y: heroFgY, opacity: heroOpacity, scale: heroScale }}
          className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex justify-center mb-3"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] text-[11.5px] font-medium tracking-[0.04em] text-[var(--color-ink)]">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-[var(--color-accent)] animate-ping opacity-60" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              </span>
              {t.home.kicker}
            </span>
          </motion.div>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className={cn(
              'display-1 text-[var(--color-ink)]',
              locale === 'th'
                ? 'text-[2.75rem] sm:text-[3.75rem] lg:text-[5rem] leading-[1.15]'
                : 'text-[3.75rem] sm:text-[5.25rem] lg:text-[7rem] leading-[1.0]'
            )}>
              <AnimatedHeadline locale={locale} t={t.home} />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
              className="mt-5 text-[17px] sm:text-[19px] text-[var(--color-ink-3)] max-w-2xl mx-auto leading-[1.55] tracking-[-0.005em]"
            >
              {t.home.lead}
            </motion.p>

            <HeroSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t.home.searchPlaceholder}
              resultCount={tools.length}
              locale={locale}
              t={t}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.05, duration: 0.6 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              <PrincipleChip icon={<ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />} label={t.home.badge1} />
              <PrincipleChip icon={<WifiOff className="w-3.5 h-3.5" strokeWidth={2.2} />} label={t.home.badge2} />
              <PrincipleChip icon={<HeartHandshake className="w-3.5 h-3.5" strokeWidth={2.2} />} label={t.home.badge3} />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ──────── MARQUEE ──────── */}
      <Marquee items={t.home.marquee} />

      {/* ──────── TOOLS ──────── */}
      <ToolsSection
        t={t}
        locale={locale}
        tools={tools}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        category={category}
        setCategory={setCategory}
        categories={categories}
      />

      {/* ──────── PRIVACY ──────── */}
      <PrivacySection t={t} locale={locale} />
    </div>
  );
}

/* ─────────── sections with their own parallax ─────────── */

function ToolsSection({
  t, locale, tools, searchQuery, setSearchQuery, category, setCategory, categories,
}: {
  t: ReturnType<typeof useLanguage>['t'];
  locale: 'th' | 'en';
  tools: { key: ToolKey; href: string; title: string; desc: string }[];
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  category: Category;
  setCategory: (c: Category) => void;
  categories: { key: Category; label: string }[];
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], ['60px', '-60px']);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.6]);

  return (
    <section ref={ref} id="tools" className="relative pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-12"
        >
          <div className="max-w-2xl">
            <p className="kicker text-[var(--color-ink-3)] mb-5">
              {t.home.browseLabel}
            </p>
            <h2 className="display-2 text-[2.25rem] sm:text-[3rem] text-[var(--color-ink)]">
              {locale === 'th' ? 'เครื่องมือทุกอย่าง' : 'Every tool,'}
              <span className="block text-[var(--color-ink-3)]">
                {locale === 'th' ? 'ในที่เดียว' : 'in one place.'}
              </span>
            </h2>
          </div>

          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={t.home.searchPlaceholder} />
        </motion.div>

        <CategoryTabs categories={categories} active={category} onChange={setCategory} />

        <motion.div
          key={`${category}-${searchQuery}`}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px mt-10 bg-[var(--color-line)] rounded-3xl overflow-hidden border border-[var(--color-line)] shadow-soft"
        >
          {tools.map((tool, idx) => (
            <ToolCard
              key={tool.key}
              index={idx}
              href={tool.href}
              title={tool.title}
              desc={tool.desc}
              icon={toolIcons[tool.key]}
              tryLabel={t.common.tryNow}
            />
          ))}
        </motion.div>

        {tools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-12 max-w-md mx-auto text-center bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl p-10"
          >
            <p className="text-[15px] text-[var(--color-ink)] font-semibold tracking-[-0.01em]">
              {t.common.noResults} &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-[13.5px] text-[var(--color-ink-3)] mt-2 tracking-[-0.005em]">{t.common.noResultsHint}</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function PrivacySection({ t, locale }: { t: ReturnType<typeof useLanguage>['t']; locale: 'th' | 'en' }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const blockY = useTransform(scrollYProgress, [0, 1], ['80px', '-40px']);
  const decoY1 = useTransform(scrollYProgress, [0, 1], ['-30px', '60px']);
  const decoY2 = useTransform(scrollYProgress, [0, 1], ['40px', '-80px']);
  const decoRotate = useTransform(scrollYProgress, [0, 1], [0, 18]);

  return (
    <section ref={ref} className="relative pb-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* parallax decorations */}
        <motion.div
          aria-hidden
          style={{ y: decoY1, rotate: decoRotate }}
          className="pointer-events-none absolute -top-12 -left-8 w-32 h-32 rounded-3xl border border-[var(--color-line-strong)]"
        />
        <motion.div
          aria-hidden
          style={{ y: decoY2 }}
          className="pointer-events-none absolute top-20 -right-12 w-24 h-24 rounded-full bg-[var(--color-accent-soft)] blur-2xl"
        />

        <motion.div style={{ y: blockY }}>
          <PrivacyBlock t={t} locale={locale} />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────── pieces ─────────── */

function AnimatedHeadline({ locale, t }: { locale: 'th' | 'en'; t: { heading1: string; heading2: string; heading3: string; tagline: string } }) {
  const lines = [t.heading1, t.heading2, t.heading3];
  return (
    <span className="block">
      {lines.map((line, i) => (
        <motion.span
          key={`${locale}-${i}`}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.1, duration: 0.7, ease: EASE }}
          className={cn(
            'block',
            i === 1 && 'text-[var(--color-ink-3)]',
          )}
        >
          {line}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="block mt-4 text-[15px] sm:text-[17px] font-medium text-[var(--color-ink-3)] tracking-[-0.005em]"
        style={{ letterSpacing: '0' }}
      >
        — {t.tagline}
      </motion.span>
    </span>
  );
}

function PrincipleChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-[var(--color-ink-2)] tracking-[-0.005em]">
      <span className="text-[var(--color-ink)]">{icon}</span>
      {label}
    </span>
  );
}

function HeroSearch({
  value, onChange, placeholder, resultCount, locale, t,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  resultCount: number;
  locale: 'th' | 'en';
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [focused, setFocused] = useState(false);

  const quick: { label: string; query: string }[] = [
    { label: t.tools['file-converter'].title, query: locale === 'th' ? 'แปลงไฟล์' : 'convert' },
    { label: t.tools['bgrm'].title, query: locale === 'th' ? 'ลบพื้นหลัง' : 'background' },
    { label: t.tools['qr-generator'].title, query: 'qr' },
    { label: t.tools['pdf-tools'].title, query: 'pdf' },
    { label: t.tools['password-generator'].title, query: locale === 'th' ? 'รหัสผ่าน' : 'password' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.65, ease: EASE }}
      className="relative mt-5 sm:mt-6 max-w-2xl mx-auto"
    >
      {/* glow halo when focused */}
      <motion.div
        aria-hidden
        animate={{
          opacity: focused ? 0.7 : 0.35,
          scale: focused ? 1.04 : 1,
        }}
        transition={{ duration: 0.5, ease: EASE }}
        className="absolute -inset-4 -z-10 rounded-full bg-[var(--color-accent-soft)] blur-2xl"
      />
      <motion.div
        aria-hidden
        animate={{
          opacity: focused ? 1 : 0,
        }}
        transition={{ duration: 0.4 }}
        className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent)] to-[var(--color-accent-deep)] blur-md"
      />

      <div
        className={cn(
          'relative flex items-center bg-white rounded-full border transition-all duration-300',
          focused
            ? 'border-[var(--color-ink-2)] shadow-deep'
            : 'border-[var(--color-line-strong)] shadow-lift'
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none text-[var(--color-ink-2)]">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
        </div>
        <input
          type="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onChange('');
            if (e.key === 'Enter' && value) {
              const target = document.getElementById('tools');
              target?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          placeholder={placeholder}
          className="w-full h-14 sm:h-16 pl-14 sm:pl-16 pr-4 rounded-full bg-transparent text-[15px] sm:text-[16px] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-3)] focus:outline-none focus-visible:outline-none tracking-[-0.005em]"
          style={{ outline: 'none' }}
        />

        {/* result count + clear */}
        <div className="flex items-center gap-1 pr-2.5">
          <AnimatePresence mode="popLayout">
            {value && (
              <motion.span
                key="count"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="hidden sm:inline-flex items-center gap-1.5 mr-1 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-2)] text-[12px] font-mono font-medium tracking-[0.04em]"
              >
                <span className="font-semibold tabular-nums">{resultCount}</span>
                <span className="text-[var(--color-ink-3)]">
                  {locale === 'th' ? 'ผลลัพธ์' : resultCount === 1 ? 'result' : 'results'}
                </span>
              </motion.span>
            )}
          </AnimatePresence>

          {value ? (
            <motion.button
              key="clear"
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.2} />
            </motion.button>
          ) : (
            <Link
              href="#tools"
              aria-label="Browse tools"
              className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 mr-1 rounded-full bg-[var(--color-accent)] text-[var(--color-ink-2)] hover:bg-[var(--color-accent-deep)] transition-colors duration-300"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </div>

      {/* quick-pick chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5, ease: EASE }}
        className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5"
      >
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-ink-3)] mr-1">
          {locale === 'th' ? 'ลอง' : 'Try'}
        </span>
        {quick.map((q) => (
          <button
            key={q.query}
            onClick={() => onChange(q.query)}
            className="px-3 py-1.5 rounded-full bg-white border border-[var(--color-line)] text-[12.5px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink-2)] hover:text-[var(--color-ink-2)] transition-all duration-300"
          >
            {q.label}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative w-full lg:w-[26rem]"
    >
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-ink-3)]">
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
        }}
        placeholder={placeholder}
        className="w-full h-12 pl-11 pr-11 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 transition-all duration-300"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--color-ink-3)] hover:text-[var(--color-accent)] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
        </button>
      )}
    </motion.div>
  );
}

function CategoryTabs({
  categories, active, onChange,
}: {
  categories: { key: Category; label: string }[];
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((c) => {
        const on = c.key === active;
        return (
          <motion.button
            key={c.key}
            onClick={() => onChange(c.key)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'relative px-4 py-2 rounded-full text-[13px] font-medium tracking-[-0.01em] transition-colors duration-300',
              on
                ? 'text-white'
                : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
            )}
          >
            {on && (
              <motion.span
                layoutId="cat-indicator"
                className="absolute inset-0 rounded-full bg-[var(--color-ink)] -z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{c.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function ToolCard({
  index, href, title, desc, icon, tryLabel,
}: {
  index: number;
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  tryLabel: string;
}) {
  return (
    <motion.div
      variants={item}
      className="group relative bg-white hover:bg-[var(--color-ink)] transition-colors duration-500"
    >
      <Link
        href={href}
        className="relative h-full flex flex-col p-7 sm:p-8"
      >
        <div className="relative flex items-start justify-between mb-10">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-line)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-ink-2)] group-hover:border-[var(--color-accent)] transition-all duration-500">
            {icon}
          </span>
          <span className="font-mono text-[10.5px] tracking-[0.18em] text-[var(--color-ink-4)] group-hover:text-[var(--color-accent)] mt-2 transition-colors duration-500">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <h3 className="relative text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-[var(--color-ink)] group-hover:text-white mb-2.5 transition-colors duration-500">
          {title}
        </h3>
        <p className="relative text-[13.5px] text-[var(--color-ink-3)] group-hover:text-white/65 leading-[1.55] tracking-[-0.005em] flex-grow transition-colors duration-500">
          {desc}
        </p>

        <div className="relative mt-8 flex items-center gap-1.5 text-[12.5px] font-semibold tracking-[-0.01em] text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors duration-500">
          {tryLabel}
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.2} />
        </div>
      </Link>
    </motion.div>
  );
}

function Marquee({ items }: { items: readonly string[] }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-ink)] py-5">
      <div className="marquee-track gap-12 px-6">
        {repeated.map((label, i) => (
          <span key={i} className="inline-flex items-center gap-4 text-[13px] font-medium tracking-[-0.005em] whitespace-nowrap text-white">
            {label}
            <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

function PrivacyBlock({ t, locale }: { t: ReturnType<typeof useLanguage>['t']; locale: 'th' | 'en' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative overflow-hidden rounded-3xl bg-[var(--color-ink)] text-[var(--color-base)] grain"
    >
      <div className="absolute inset-0 gradient-ink" aria-hidden />
      <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-0">
        <div className="p-10 sm:p-14 lg:p-16 border-b md:border-b-0 md:border-r border-white/10">
          <p className="kicker text-[var(--color-accent)] mb-5">
            {t.home.privacyTitle}
          </p>
          <h3 className="display-2 text-[2rem] sm:text-[2.5rem] leading-[1.05] text-white">
            {locale === 'th'
              ? 'ทุกอย่างทำงานในเบราว์เซอร์ของคุณ'
              : 'Everything runs inside your browser.'}
          </h3>
          <p className="mt-6 text-[15px] text-white/70 leading-[1.6] tracking-[-0.005em] max-w-md">
            {t.home.privacyBody}
          </p>

          <ul className="mt-10 space-y-4 text-[14px]">
            {[
              locale === 'th' ? 'ไม่มีบัญชีให้สมัคร' : 'No accounts. Ever.',
              locale === 'th' ? 'ไม่มีคุกกี้ติดตาม' : 'No tracking cookies.',
              locale === 'th' ? 'เปิดได้เร็ว ใช้ได้ทันที' : 'Loads fast. Works instantly.',
            ].map((line, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.45, ease: EASE }}
                className="flex items-center gap-4 text-white/85 tracking-[-0.005em]"
              >
                <span className="text-[var(--color-accent)] font-mono text-[10.5px] tracking-[0.16em]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="w-6 h-px bg-white/30" />
                <span>{line}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative p-10 sm:p-14 lg:p-16 flex flex-col justify-between">
          <div>
            <p className="kicker text-[var(--color-accent)] mb-5">
              {t.home.ctaTitle}
            </p>
            <p className="text-[19px] sm:text-[22px] leading-[1.4] tracking-[-0.015em] font-medium text-white">
              {t.home.ctaBody}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            <Link
              href="#tools"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-ink-2)] text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-[var(--color-accent-deep)] transition-colors duration-300"
            >
              {t.common.tryNow}
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
            </Link>
            <Link
              href="/file-converter"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-white text-[13.5px] font-semibold tracking-[-0.01em] hover:border-white hover:bg-white/5 transition-colors duration-300"
            >
              {t.nav.fileConverter}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ParallaxAmbient({ bgY, midY }: { bgY: MotionValue<string>; midY: MotionValue<string> }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* deep layer — slowest, very subtle warm tint */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0"
      >
        <div className="absolute top-[10%] left-[8%] w-[420px] h-[420px] rounded-full bg-[var(--color-accent-soft)] blur-[140px] opacity-60" />
        <div className="absolute bottom-[5%] right-[10%] w-[480px] h-[480px] rounded-full bg-[var(--color-surface-2)] blur-[140px] opacity-90" />
      </motion.div>

      {/* mid layer */}
      <motion.div
        style={{ y: midY }}
        className="absolute inset-0"
      >
        <div className="absolute top-[30%] right-[20%] w-[280px] h-[280px] rounded-full bg-[var(--color-accent-soft)] blur-[120px] opacity-50" />
      </motion.div>

      {/* foreground geometric accents */}
      <motion.div
        style={{ y: midY }}
        className="absolute top-24 right-12 hidden lg:block"
      >
        <div className="w-16 h-16 rounded-2xl border border-[var(--color-line-strong)] rotate-12" />
      </motion.div>
      <motion.div
        style={{ y: bgY }}
        className="absolute bottom-32 left-16 hidden lg:block"
      >
        <div className="w-12 h-12 rounded-full border border-[var(--color-accent)]/40" />
      </motion.div>
    </div>
  );
}
