'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, Image as ImageIcon, Scissors, QrCode, Lock, Palette, Braces,
  Type, ArrowRightLeft, Minimize2, ArrowUpRight, Mic, Edit, Sparkles, BookOpenText,
  ShieldCheck, WifiOff, HeartHandshake, PenLine, Compass,
  Crop, Pipette, Stamp, Shuffle, Disc3, Languages, X,
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

const toolIcons: Record<ToolKey, React.ReactNode> = {
  'file-converter': <FileText className="w-5 h-5" strokeWidth={2.1} />,
  'bgrm': <Scissors className="w-5 h-5" strokeWidth={2.1} />,
  'image-compressor': <ImageIcon className="w-5 h-5" strokeWidth={2.1} />,
  'qr-generator': <QrCode className="w-5 h-5" strokeWidth={2.1} />,
  'json-formatter': <Braces className="w-5 h-5" strokeWidth={2.1} />,
  'password-generator': <Lock className="w-5 h-5" strokeWidth={2.1} />,
  'color-palette': <Palette className="w-5 h-5" strokeWidth={2.1} />,
  'lorem-ipsum': <Type className="w-5 h-5" strokeWidth={2.1} />,
  'diff-viewer': <ArrowRightLeft className="w-5 h-5" strokeWidth={2.1} />,
  'unit-converter': <Minimize2 className="w-5 h-5" strokeWidth={2.1} />,
  'pdf-tools': <FileText className="w-5 h-5" strokeWidth={2.1} />,
  'audio-editor': <Mic className="w-5 h-5" strokeWidth={2.1} />,
  'markdown-editor': <Edit className="w-5 h-5" strokeWidth={2.1} />,
  'exif-stripper': <ShieldCheck className="w-5 h-5" strokeWidth={2.1} />,
  'image-cropper': <Crop className="w-5 h-5" strokeWidth={2.1} />,
  'color-picker': <Pipette className="w-5 h-5" strokeWidth={2.1} />,
  'color-tools': <Palette className="w-5 h-5" strokeWidth={2.1} />,
  'watermark': <Stamp className="w-5 h-5" strokeWidth={2.1} />,
  'random-picker': <Shuffle className="w-5 h-5" strokeWidth={2.1} />,
  'spin-wheel': <Disc3 className="w-5 h-5" strokeWidth={2.1} />,
  'thai-keyboard': <Languages className="w-5 h-5" strokeWidth={2.1} />,
};

const orderedKeys: ToolKey[] = [
  'file-converter', 'bgrm', 'image-cropper', 'image-compressor',
  'exif-stripper', 'watermark', 'color-picker', 'color-tools',
  'color-palette', 'qr-generator', 'json-formatter', 'password-generator',
  'pdf-tools', 'markdown-editor', 'thai-keyboard', 'diff-viewer',
  'unit-converter', 'audio-editor', 'lorem-ipsum', 'random-picker', 'spin-wheel',
];

// Aliases — extra search keywords for each tool. Lets users find tools by
// what they want to do, not just the title we picked. Both TH + EN, lower-cased.
const aliases: Record<ToolKey, string[]> = {
  'file-converter': [
    'convert', 'converter', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'document',
    'แปลง', 'แปลงไฟล์', 'แปลงรูป', 'แปลงเอกสาร', 'เอกสาร', 'ไฟล์', 'รูป', 'พีดีเอฟ',
  ],
  'bgrm': [
    'background', 'remover', 'remove bg', 'transparent', 'cutout',
    'ลบ', 'ลบพื้นหลัง', 'ตัดพื้นหลัง', 'พื้นหลัง', 'พื้นหลังโปร่ง', 'โปร่งใส',
  ],
  'image-compressor': [
    'compress', 'compressor', 'shrink', 'smaller', 'reduce', 'optimize',
    'บีบ', 'บีบอัด', 'ย่อ', 'ย่อรูป', 'ลดขนาด', 'ลดขนาดรูป', 'ลดน้ำหนัก',
  ],
  'qr-generator': [
    'qr', 'qrcode', 'qr code', 'barcode', 'generate qr',
    'คิวอาร์', 'คิวอาร์โค้ด', 'สร้างคิวอาร์', 'สร้างqr', 'qrโค้ด',
  ],
  'json-formatter': [
    'json', 'pretty', 'minify', 'beautify', 'validate', 'format',
    'จัดรูปแบบ', 'จัดเจสัน', 'จัดjson', 'jsonสวย', 'เจสัน',
  ],
  'password-generator': [
    'password', 'pass', 'pwd', 'random password', 'secure',
    'รหัส', 'รหัสผ่าน', 'พาส', 'พาสเวิร์ด', 'สร้างรหัส', 'รหัสปลอดภัย',
  ],
  'color-palette': [
    'palette', 'theme', 'colors', 'extract',
    'พาเลตต์', 'พาเลท', 'สี', 'สีจากรูป', 'ดึงสี', 'สกัดสี',
  ],
  'lorem-ipsum': [
    'lorem', 'ipsum', 'placeholder', 'dummy', 'dummy text', 'fake',
    'ตัวอย่าง', 'ข้อความตัวอย่าง', 'lorem ipsum', 'ข้อความหลอก',
  ],
  'diff-viewer': [
    'diff', 'compare', 'changes',
    'เปรียบเทียบ', 'เทียบ', 'ความต่าง', 'หาต่าง', 'เทียบข้อความ',
  ],
  'unit-converter': [
    'css', 'unit', 'px', 'rem', 'em', 'percent', '%',
    'แปลงหน่วย', 'หน่วย', 'หน่วยซีเอสเอส', 'พิกเซล',
  ],
  'pdf-tools': [
    'pdf', 'merge', 'split', 'compress pdf', 'combine',
    'พีดีเอฟ', 'รวม', 'รวมpdf', 'รวมไฟล์', 'แยก', 'แยกหน้า', 'บีบpdf', 'รวมเอกสาร',
  ],
  'audio-editor': [
    'audio', 'mp3', 'wav', 'sound', 'trim', 'cut audio',
    'เสียง', 'ตัดเสียง', 'ตัดต่อเสียง', 'ไฟล์เสียง', 'เพลง', 'คลื่นเสียง', 'wave',
  ],
  'markdown-editor': [
    'markdown', 'md', 'note', 'editor', 'docs',
    'มาร์กดาวน์', 'เขียนโน้ต', 'เขียนเอกสาร', 'มาร์คดาวน์',
  ],
  'exif-stripper': [
    'exif', 'metadata', 'gps', 'privacy', 'strip', 'clean',
    'ลบเมตา', 'เมตา', 'เมตาดาต้า', 'ลบจีพีเอส', 'จีพีเอส', 'ข้อมูลแฝง', 'ข้อมูลไฟล์', 'ความเป็นส่วนตัว',
  ],
  'image-cropper': [
    'crop', 'cropper', 'resize', 'rotate', 'flip', 'trim image',
    'ครอบรูป', 'ครอบ', 'ตัดรูป', 'ปรับขนาด', 'ปรับขนาดรูป', 'หมุน', 'หมุนรูป', 'พลิก',
  ],
  'color-picker': [
    'picker', 'pick color', 'eyedropper', 'dropper', 'color from screen',
    'หยดสี', 'เลือกสี', 'อายดรอปเปอร์', 'ดูดสี', 'ดูดเฉดสี',
  ],
  'color-tools': [
    'color converter', 'gradient', 'hex', 'rgb', 'hsl', 'oklch', 'css gradient',
    'แปลงสี', 'ไล่สี', 'ไล่ระดับ', 'ไล่ระดับสี', 'เกรเดียนต์', 'เฮ็กซ์', 'อาร์จีบี',
  ],
  'watermark': [
    'watermark', 'stamp', 'logo', 'overlay', 'sign image',
    'ลายน้ำ', 'ติดลายน้ำ', 'ใส่ลายน้ำ', 'โลโก้', 'แสตมป์',
  ],
  'random-picker': [
    'random', 'pick', 'lottery', 'name picker', 'shuffle', 'draw',
    'สุ่ม', 'สุ่มชื่อ', 'สุ่มรายการ', 'จับฉลาก', 'จับสลาก', 'แรนดอม',
  ],
  'spin-wheel': [
    'wheel', 'spin', 'lucky draw', 'roulette', 'fortune wheel',
    'วงล้อ', 'หมุนวงล้อ', 'หมุน', 'ล้อสุ่ม', 'จับฉลาก', 'จับสลาก',
  ],
  'thai-keyboard': [
    'kedmanee', 'layout', 'keyboard', 'mistype', 'wrong layout', 'thai keyboard',
    'แป้นพิมพ์', 'แป้น', 'คีย์บอร์ด', 'พิมพ์ผิด', 'พิมพ์ภาษาผิด', 'แก้ภาษา', 'พิมพ์ไทย',
    'l;ylfu', 'สวัสดี', 'เกษมณี',
  ],
};

/** NFC-normalize and lower-case so Thai input variations match the corpus. */
function normalize(s: string): string {
  return s.normalize('NFC').toLowerCase();
}

/** Build per-tool search corpus from BOTH languages + aliases + slug. */
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

/** Tokenize a query.
 *  - Splits Latin words on whitespace (so "compress pdf" → ["compress","pdf"]).
 *  - Keeps Thai runs together (Thai has no spaces between words). Each
 *    contiguous Thai run is one token, so "ลบพื้นหลัง" stays whole instead of
 *    being broken into characters that match every tool. */
function tokenize(q: string): string[] {
  const norm = normalize(q.trim());
  if (!norm) return [];
  // Match either Latin/digit runs OR Thai-character runs as separate tokens.
  const matches = norm.match(/[฀-๿]+|[a-z0-9_./%-]+/g);
  return matches ? matches.filter(Boolean) : [];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 240, damping: 22 } },
};

export default function Home() {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');

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
      <BackdropArt />

      {/* HERO */}
      <section className="relative pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-wine-100)] border border-[var(--color-wine-200)] text-[var(--color-wine-700)] text-xs sm:text-[13px] font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              {t.home.kicker}
            </span>
          </motion.div>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-[var(--color-wine-700)]">
              <AnimatedHeadline locale={locale} t={t.home} />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 text-base sm:text-lg text-[var(--color-smoke-600)] max-w-2xl mx-auto leading-relaxed"
            >
              {t.home.lead}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              <Pill icon={<ShieldCheck className="w-3.5 h-3.5" />} label={t.home.badge1} variant="filled" />
              <Pill icon={<WifiOff className="w-3.5 h-3.5" />} label={t.home.badge2} variant="outline" />
              <Pill icon={<HeartHandshake className="w-3.5 h-3.5" />} label={t.home.badge3} variant="outline" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <Marquee items={t.home.marquee} />

      {/* TOOLS BROWSER */}
      <section className="relative pt-12 sm:pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-600)] font-semibold mb-2">
                <Compass className="w-3.5 h-3.5" />
                {t.home.browseLabel}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-wine-700)]">
                <span className="ink-underline px-0.5">
                  {locale === 'th' ? 'เครื่องมือทั้งหมด' : 'Every tool, in one place'}
                </span>
              </h2>
            </div>

            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={t.home.searchPlaceholder} />
          </div>

          <CategoryTabs categories={categories} active={category} onChange={setCategory} />

          <motion.div
            key={`${category}-${searchQuery}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-8"
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
              className="mt-10 max-w-md mx-auto text-center bg-white/70 border border-[var(--color-wine-100)] rounded-3xl p-8"
            >
              <p className="text-base text-[var(--color-wine-700)] font-medium">
                {t.common.noResults} &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-sm text-[var(--color-smoke-600)] mt-2">{t.common.noResultsHint}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* PRIVACY / NOTEBOOK CARD */}
      <section className="relative pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotebookCard t={t} locale={locale} />
        </div>
      </section>
    </div>
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
          initial={{ opacity: 0, y: 28, rotate: i % 2 === 0 ? -1 : 1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.1 + i * 0.12, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          className="block"
        >
          {i === 1 ? (
            <span className="relative inline-block">
              <span className="relative z-10">{line}</span>
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-1 h-3 sm:h-4 bg-[var(--color-wine-200)]/70 rounded-sm -z-0"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6, ease: [0.33, 0, 0.2, 1] }}
              />
            </span>
          ) : (
            line
          )}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="block mt-4 text-base sm:text-lg font-medium text-[var(--color-smoke-600)] tracking-normal"
      >
        — {t.tagline}
      </motion.span>
    </span>
  );
}

function Pill({ icon, label, variant }: { icon: React.ReactNode; label: string; variant: 'filled' | 'outline' }) {
  return (
    <motion.span
      whileHover={{ y: -2, rotate: variant === 'filled' ? -1 : 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border',
        variant === 'filled'
          ? 'bg-[var(--color-wine-700)] text-[var(--color-cream)] border-[var(--color-wine-700)]'
          : 'bg-white/70 text-[var(--color-wine-700)] border-[var(--color-wine-200)]'
      )}
    >
      {icon}
      {label}
    </motion.span>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full md:w-[26rem]"
    >
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-wine-400)]">
        <Search className="w-4 h-4" />
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
        className="w-full h-12 pl-11 pr-11 rounded-full bg-white border-[1.5px] border-[var(--color-wine-100)] text-sm text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/70 focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all shadow-soft"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] transition-colors"
        >
          <X className="w-4 h-4" />
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
    <div className="flex flex-wrap gap-2 mt-2">
      {categories.map((c) => {
        const on = c.key === active;
        return (
          <motion.button
            key={c.key}
            onClick={() => onChange(c.key)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'relative px-4 py-2 rounded-full text-[13px] font-medium border transition-colors',
              on
                ? 'bg-[var(--color-wine-700)] text-[var(--color-cream)] border-[var(--color-wine-700)]'
                : 'bg-white/70 text-[var(--color-wine-700)] border-[var(--color-wine-200)] hover:bg-[var(--color-wine-50)]'
            )}
          >
            {on && (
              <motion.span
                layoutId="cat-indicator"
                className="absolute inset-0 rounded-full bg-[var(--color-wine-700)] -z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
  const tilt = (index % 4) - 1.5;
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6, rotate: tilt * 0.4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="group"
    >
      <Link
        href={href}
        className="relative h-full flex flex-col p-6 sm:p-7 rounded-3xl bg-white border-[1.5px] border-[var(--color-wine-100)] shadow-soft overflow-hidden transition-shadow duration-300 hover:shadow-lift"
      >
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[var(--color-wine-50)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-start justify-between mb-6">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 280 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-wine-100)] text-[var(--color-wine-700)] border border-[var(--color-wine-200)]"
          >
            {icon}
          </motion.span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-smoke-600)]/80 mt-2">
            №{String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <h3 className="relative text-lg sm:text-xl font-semibold text-[var(--color-wine-700)] mb-2">
          {title}
        </h3>
        <p className="relative text-[14px] text-[var(--color-smoke-600)] leading-relaxed flex-grow">
          {desc}
        </p>

        <div className="relative mt-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-wine-700)] group-hover:text-[var(--color-wine-600)] transition-colors">
            {tryLabel}
            <motion.span
              aria-hidden
              className="inline-block"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </motion.span>
          </span>
          <span className="h-px flex-1 ml-4 bg-gradient-to-r from-transparent to-[var(--color-wine-200)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  );
}

function Marquee({ items }: { items: readonly string[] }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[var(--color-wine-100)] bg-[var(--color-wine-700)] text-[var(--color-cream)] py-3">
      <div className="marquee-track gap-10 px-6">
        {repeated.map((label, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-sm tracking-wide whitespace-nowrap">
            <PenLine className="w-3.5 h-3.5 opacity-70" />
            {label}
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-wine-300)]" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

function NotebookCard({ t, locale }: { t: ReturnType<typeof useLanguage>['t']; locale: 'th' | 'en' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      className="relative rounded-[28px] bg-white border-[1.5px] border-[var(--color-wine-100)] shadow-soft overflow-hidden"
    >
      <div className="absolute inset-0 paper-lines opacity-60 pointer-events-none" aria-hidden />

      <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-0">
        <div className="p-8 sm:p-10 lg:p-12">
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-600)] font-semibold mb-4">
            <BookOpenText className="w-3.5 h-3.5" />
            {t.home.privacyTitle}
          </span>
          <h3 className="text-2xl sm:text-3xl font-semibold text-[var(--color-wine-700)] leading-snug">
            {locale === 'th'
              ? 'ทุกอย่างเกิดขึ้นในเบราว์เซอร์ของคุณ'
              : 'Everything stays inside your browser.'}
          </h3>
          <p className="mt-4 text-[15px] text-[var(--color-smoke-600)] leading-relaxed max-w-md">
            {t.home.privacyBody}
          </p>

          <ul className="mt-6 space-y-2.5 text-[14px] text-[var(--color-wine-700)]">
            {[
              locale === 'th' ? 'ไม่มีบัญชีให้สมัคร' : 'No accounts to sign up for',
              locale === 'th' ? 'ไม่มีคุกกี้ติดตาม' : 'No tracking cookies',
              locale === 'th' ? 'เปิดได้เร็ว ใช้ได้ทันที' : 'Loads fast, works instantly',
            ].map((line, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="flex items-start gap-3"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-wine-600)] flex-shrink-0" />
                <span>{line}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative p-8 sm:p-10 lg:p-12 bg-[var(--color-wine-700)] text-[var(--color-cream)]">
          <div className="absolute inset-0 paper-grid opacity-10 pointer-events-none" aria-hidden />
          <div className="relative">
            <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-200)] font-semibold">
              {t.home.ctaTitle}
            </span>
            <p className="mt-3 text-lg sm:text-xl leading-relaxed">
              {t.home.ctaBody}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#tools"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-cream)] text-[var(--color-wine-700)] text-sm font-semibold hover:bg-white transition-colors"
              >
                {t.common.tryNow}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/file-converter"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-wine-300)] text-[var(--color-cream)] text-sm font-semibold hover:bg-[var(--color-wine-800)] transition-colors"
              >
                {t.nav.fileConverter}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BackdropArt() {
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 h-[640px] overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 paper-grid opacity-[0.07]" />
      <motion.div
        animate={{ rotate: [0, 6, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-[42%_58%_55%_45%] bg-[var(--color-wine-100)] blur-3xl opacity-60"
      />
      <motion.div
        animate={{ rotate: [0, -8, 0], y: [0, 14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -left-24 w-[460px] h-[420px] rounded-[60%_40%_45%_55%] bg-[var(--color-wine-200)]/40 blur-3xl"
      />
    </div>
  );
}
