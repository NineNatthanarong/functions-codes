'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardPaste, Gauge, Hash, Sigma, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, {
    FieldLabel,
    GhostButton,
    SecondaryButton,
    TextArea,
    ToolCard,
} from '@/components/ToolShell';
import { computeTextStats } from './text-stats';

const EASE = [0.25, 1, 0.5, 1] as const;

const fmt = (n: number) => n.toLocaleString('en-US');

const LIMITS = [
    { label: 'Twitter / X', limit: 280 },
    { label: 'Instagram caption', limit: 2200 },
    { label: 'SEO meta description', limit: 160 },
] as const;

const STRINGS = {
    th: {
        kicker: 'Text · Realtime',
        title: 'นับคำ & ตัวอักษร',
        subtitle:
            'พิมพ์หรือวางข้อความ แล้วดูจำนวนคำ ตัวอักษร ประโยค ย่อหน้า พร้อมเวลาอ่านแบบสด ๆ รองรับการตัดคำภาษาไทยเต็มรูปแบบ — ทุกอย่างทำงานในเบราว์เซอร์ ข้อความไม่ถูกส่งไปไหน',
        inputLabel: 'ข้อความของคุณ',
        inputHint: (n: number) => `${fmt(n)} ตัวอักษร`,
        placeholder: 'พิมพ์หรือวางข้อความที่นี่... เรียงความ แคปชั่น หรือโพสต์ก็ได้',
        paste: 'วางข้อความ',
        clear: 'ล้าง',
        pasted: 'วางข้อความเรียบร้อย',
        pasteFailed: 'อ่านคลิปบอร์ดไม่ได้ — ลองกด Ctrl+V ในช่องข้อความแทน',
        pasteEmpty: 'คลิปบอร์ดยังว่างอยู่',
        cleared: 'ล้างข้อความแล้ว',
        characters: 'ตัวอักษร',
        charsNoSpaces: 'ไม่รวมช่องว่าง',
        words: 'คำ',
        sentences: 'ประโยค',
        paragraphs: 'ย่อหน้า',
        readingTime: 'เวลาอ่าน',
        speakingTime: 'เวลาพูด',
        readingHint: '~200 คำ/นาที',
        speakingHint: '~130 คำ/นาที',
        minUnit: 'นาที',
        secUnit: 'วิ',
        limitsTitle: 'ลิมิตยอดฮิต',
        limitsHint: 'นับรวมช่องว่าง',
        left: (n: number) => `เหลืออีก ${fmt(n)} ตัวอักษร`,
        over: (n: number) => `เกินมา ${fmt(n)} ตัวอักษร`,
        keywordsTitle: 'คำที่ใช้บ่อย',
        keywordsHint: 'ท็อป 8 · ไม่นับคำ 1 ตัวอักษร',
        keywordsEmpty: 'พิมพ์ข้อความก่อน แล้วคำที่ใช้บ่อยจะมาโผล่ตรงนี้',
    },
    en: {
        kicker: 'Text · Realtime',
        title: 'Word & Character Counter',
        subtitle:
            'Type or paste your text and watch words, characters, sentences, paragraphs, and reading time update live. Full Thai word segmentation included — everything runs in your browser, nothing gets uploaded.',
        inputLabel: 'Your text',
        inputHint: (n: number) => `${fmt(n)} characters`,
        placeholder: 'Type or paste your text here... an essay, a caption, or a post',
        paste: 'Paste',
        clear: 'Clear',
        pasted: 'Pasted from clipboard',
        pasteFailed: 'Could not read clipboard — try pressing Ctrl+V in the text box instead',
        pasteEmpty: 'Clipboard is empty',
        cleared: 'Text cleared',
        characters: 'Characters',
        charsNoSpaces: 'without spaces',
        words: 'Words',
        sentences: 'Sentences',
        paragraphs: 'Paragraphs',
        readingTime: 'Reading time',
        speakingTime: 'Speaking time',
        readingHint: '~200 wpm',
        speakingHint: '~130 wpm',
        minUnit: 'min',
        secUnit: 'sec',
        limitsTitle: 'Popular limits',
        limitsHint: 'characters incl. spaces',
        left: (n: number) => `${fmt(n)} characters left`,
        over: (n: number) => `${fmt(n)} over the limit`,
        keywordsTitle: 'Top words',
        keywordsHint: 'top 8 · 1-char words excluded',
        keywordsEmpty: 'Start typing and your most-used words will show up here',
    },
} as const;

type Strings = (typeof STRINGS)[keyof typeof STRINGS];

function formatDuration(totalSeconds: number, s: Strings): string {
    if (totalSeconds <= 0) return `0 ${s.secUnit}`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `~${secs} ${s.secUnit}`;
    if (secs === 0) return `~${mins} ${s.minUnit}`;
    return `~${mins} ${s.minUnit} ${secs} ${s.secUnit}`;
}

export default function WordCounter() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [input, setInput] = useState('');
    const stats = useMemo(() => computeTextStats(input), [input]);

    const pasteFromClipboard = async () => {
        try {
            if (!navigator.clipboard?.readText) {
                toast.error(s.pasteFailed);
                return;
            }
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast.error(s.pasteEmpty);
                return;
            }
            setInput((prev) => (prev ? `${prev}\n${text}` : text));
            toast.success(s.pasted);
        } catch {
            toast.error(s.pasteFailed);
        }
    };

    const clearAll = () => {
        if (!input) return;
        setInput('');
        toast.success(s.cleared);
    };

    const statCards: { label: string; value: string; sub?: string }[] = [
        {
            label: s.characters,
            value: fmt(stats.chars),
            sub: `${s.charsNoSpaces}: ${fmt(stats.charsNoSpace)}`,
        },
        { label: s.words, value: fmt(stats.words) },
        { label: s.sentences, value: fmt(stats.sentences) },
        { label: s.paragraphs, value: fmt(stats.paragraphs) },
        { label: s.readingTime, value: formatDuration(stats.readingSeconds, s), sub: s.readingHint },
        { label: s.speakingTime, value: formatDuration(stats.speakingSeconds, s), sub: s.speakingHint },
    ];

    return (
        <ToolShell
            icon={<Sigma className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="xwide"
            actions={
                <>
                    <SecondaryButton onClick={pasteFromClipboard}>
                        <ClipboardPaste className="w-4 h-4" />
                        {s.paste}
                    </SecondaryButton>
                    <GhostButton tone="danger" onClick={clearAll} disabled={!input}>
                        <Trash2 className="w-3.5 h-3.5" />
                        {s.clear}
                    </GhostButton>
                </>
            }
        >
            {/* live stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                {statCards.map((card, i) => (
                    <StatCard key={card.label} {...card} delay={i * 0.04} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {/* input */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <ToolCard>
                        <FieldLabel hint={s.inputHint(stats.chars)}>{s.inputLabel}</FieldLabel>
                        <TextArea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={s.placeholder}
                            className="min-h-[340px] sm:min-h-[460px] text-[15px] leading-[1.75]"
                        />
                    </ToolCard>
                </motion.div>

                {/* sidebar: limits + keyword density */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
                    className="flex flex-col gap-5"
                >
                    <ToolCard>
                        <div className="flex items-baseline justify-between gap-3 mb-5">
                            <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]">
                                <Gauge className="w-3.5 h-3.5 text-[var(--color-accent-deep)]" strokeWidth={2.2} />
                                {s.limitsTitle}
                            </span>
                            <span className="text-[11px] text-[var(--color-ink-4)]">{s.limitsHint}</span>
                        </div>
                        <div className="flex flex-col gap-5">
                            {LIMITS.map((l) => {
                                const used = stats.chars;
                                const pct = Math.min(100, (used / l.limit) * 100);
                                const over = used > l.limit;
                                const warn = !over && used >= l.limit * 0.9;
                                const barColor = over
                                    ? '#d62828'
                                    : warn
                                        ? 'var(--color-accent-deep)'
                                        : 'var(--color-accent)';
                                return (
                                    <div key={l.label}>
                                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                            <span className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                                                {l.label}
                                            </span>
                                            <span
                                                className={cn(
                                                    'font-mono text-[11.5px] tabular-nums',
                                                    over
                                                        ? 'text-[#d62828] font-semibold'
                                                        : 'text-[var(--color-ink-3)]'
                                                )}
                                            >
                                                {fmt(used)} / {fmt(l.limit)}
                                            </span>
                                        </div>
                                        <div
                                            role="progressbar"
                                            aria-label={l.label}
                                            aria-valuemin={0}
                                            aria-valuemax={l.limit}
                                            aria-valuenow={Math.min(used, l.limit)}
                                            className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden"
                                        >
                                            <div
                                                className="h-full rounded-full transition-[width,background-color] duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: barColor }}
                                            />
                                        </div>
                                        <p
                                            className={cn(
                                                'mt-1.5 text-[11px]',
                                                over ? 'text-[#d62828]' : 'text-[var(--color-ink-4)]'
                                            )}
                                        >
                                            {over ? s.over(used - l.limit) : s.left(l.limit - used)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </ToolCard>

                    <ToolCard>
                        <div className="flex items-baseline justify-between gap-3 mb-5">
                            <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]">
                                <Hash className="w-3.5 h-3.5 text-[var(--color-accent-deep)]" strokeWidth={2.2} />
                                {s.keywordsTitle}
                            </span>
                            <span className="text-[11px] text-[var(--color-ink-4)]">{s.keywordsHint}</span>
                        </div>
                        {stats.keywords.length === 0 ? (
                            <p className="text-[13px] leading-[1.6] text-[var(--color-ink-4)]">
                                {s.keywordsEmpty}
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {stats.keywords.map((k) => (
                                    <span
                                        key={k.word}
                                        className="inline-flex max-w-full items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)]"
                                    >
                                        <span className="truncate text-[12.5px] font-medium tracking-[-0.01em] text-[var(--color-ink-2)]">
                                            {k.word}
                                        </span>
                                        <span className="inline-flex items-center justify-center min-w-[24px] h-[20px] px-1.5 rounded-full bg-[var(--color-accent-soft)] font-mono text-[10.5px] font-semibold tabular-nums text-[var(--color-accent-deep)]">
                                            {k.count}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </ToolCard>
                </motion.div>
            </div>
        </ToolShell>
    );
}

function StatCard({
    label, value, sub, delay,
}: {
    label: string;
    value: string;
    sub?: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay }}
            className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-line)] p-4"
        >
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-3)] truncate">
                {label}
            </p>
            <p className="mt-1.5 text-[20px] sm:text-[22px] font-bold tracking-[-0.02em] leading-tight text-[var(--color-ink-2)] tabular-nums break-words">
                {value}
            </p>
            {sub && (
                <p className="mt-0.5 text-[11px] text-[var(--color-ink-4)] truncate">{sub}</p>
            )}
        </motion.div>
    );
}
