'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    CaseSensitive,
    ClipboardPaste,
    Copy,
    Check,
    Trash2,
    ChevronDown,
    ChevronUp,
    Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, GhostButton, FieldLabel, TextArea } from '@/components/ToolShell';

const EASE = [0.25, 1, 0.5, 1] as const;

/* ─── i18n (local dictionary — translations.ts is untouched) ─── */

const STRINGS = {
    th: {
        kicker: 'Text Utility',
        title: 'แปลงตัวพิมพ์ข้อความ',
        subtitle:
            'แปลงข้อความเป็น UPPERCASE, camelCase, snake_case และอีกหลายรูปแบบพร้อมกัน — ผลลัพธ์อัปเดตทันทีที่พิมพ์ รองรับการสลับระหว่างรูปแบบตัวแปรของโปรแกรมเมอร์ ทุกอย่างทำงานในเบราว์เซอร์ ไม่ส่งข้อมูลไปไหน',
        inputLabel: 'ข้อความต้นฉบับ',
        inputHint: 'พิมพ์แล้วผลลัพธ์ด้านล่างเปลี่ยนทันที',
        placeholder: 'พิมพ์หรือวางข้อความที่นี่ เช่น helloWorldExample, my_variable_name หรือประโยคยาว ๆ...',
        paste: 'วาง',
        clear: 'ล้าง',
        pasted: 'วางข้อความเรียบร้อย',
        pasteError: 'วางไม่สำเร็จ — ลองกด Ctrl+V ในช่องข้อความแทน',
        copied: 'คัดลอกเรียบร้อย',
        copyAria: 'คัดลอกผลลัพธ์',
        chars: 'ตัวอักษร',
        words: 'คำ',
        resultsLabel: 'ผลลัพธ์ทั้ง 10 รูปแบบ',
        expand: 'ดูทั้งหมด',
        collapse: 'ย่อกลับ',
        empty: 'ผลลัพธ์จะแสดงที่นี่',
        caseDesc: {
            upper: 'ตัวพิมพ์ใหญ่ทั้งหมด',
            lower: 'ตัวพิมพ์เล็กทั้งหมด',
            title: 'ขึ้นต้นทุกคำด้วยตัวใหญ่',
            sentence: 'ขึ้นต้นประโยคด้วยตัวใหญ่',
            camel: 'ตัวแปร JavaScript',
            pascal: 'ชื่อคลาส / คอมโพเนนต์',
            snake: 'ตัวแปร Python',
            kebab: 'URL / ชื่อไฟล์ CSS',
            constant: 'ค่าคงที่ (constant)',
            dot: 'คีย์ใน config',
        },
    },
    en: {
        kicker: 'Text Utility',
        title: 'Text Case Converter',
        subtitle:
            'Convert text to UPPERCASE, camelCase, snake_case and more — all at once, live as you type. Understands existing camel / snake / kebab input, so renaming variables between conventions just works. Everything runs in your browser.',
        inputLabel: 'Your text',
        inputHint: 'Results below update as you type',
        placeholder: 'Type or paste text here, e.g. helloWorldExample, my_variable_name, or a full sentence...',
        paste: 'Paste',
        clear: 'Clear',
        pasted: 'Pasted from clipboard',
        pasteError: 'Could not paste — try pressing Ctrl+V in the text box instead',
        copied: 'Copied to clipboard',
        copyAria: 'Copy result',
        chars: 'characters',
        words: 'words',
        resultsLabel: 'All 10 case styles',
        expand: 'Show all',
        collapse: 'Collapse',
        empty: 'Result appears here',
        caseDesc: {
            upper: 'All capital letters',
            lower: 'All small letters',
            title: 'Capitalize Every Word',
            sentence: 'Capitalize sentence starts',
            camel: 'JavaScript variables',
            pascal: 'Class / component names',
            snake: 'Python variables',
            kebab: 'URLs / CSS file names',
            constant: 'Constants / env vars',
            dot: 'Config keys',
        },
    },
} as const;

/* ─── case conversion ───
   Thai has no letter case, so toUpperCase/toLowerCase leave Thai
   characters untouched — Sentence/Title case pass Thai through as-is. */

type CaseId =
    | 'upper' | 'lower' | 'title' | 'sentence' | 'camel'
    | 'pascal' | 'snake' | 'kebab' | 'constant' | 'dot';

/** Insert spaces at camelCase / PascalCase boundaries: "myURLValue" → "my URL Value" */
function expandCaseBoundaries(text: string): string {
    return text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/** Split into words on case boundaries, underscores, hyphens, dots, spaces.
    Letters (incl. Thai ฀-๿ and accented Latin) and digits are kept. */
function splitWords(text: string): string[] {
    return expandCaseBoundaries(text)
        .split(/[^A-Za-z0-9À-ɏ฀-๿]+/)
        .filter(Boolean);
}

/** Capitalize first ASCII letter, lowercase the rest (no-op on Thai) */
function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function toTitleCase(text: string): string {
    return expandCaseBoundaries(text)
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
        .replace(/(^|[\s([“"'])([a-z])/g, (_m, before: string, letter: string) => before + letter.toUpperCase());
}

function toSentenceCase(text: string): string {
    return expandCaseBoundaries(text)
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+|\n\s*)([a-z])/g, (_m, before: string, letter: string) => before + letter.toUpperCase());
}

const CASES: { id: CaseId; name: string; convert: (text: string) => string }[] = [
    { id: 'upper', name: 'UPPERCASE', convert: (t) => t.toUpperCase() },
    { id: 'lower', name: 'lowercase', convert: (t) => t.toLowerCase() },
    { id: 'title', name: 'Title Case', convert: toTitleCase },
    { id: 'sentence', name: 'Sentence case', convert: toSentenceCase },
    {
        id: 'camel',
        name: 'camelCase',
        convert: (t) => splitWords(t).map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w))).join(''),
    },
    { id: 'pascal', name: 'PascalCase', convert: (t) => splitWords(t).map(capitalize).join('') },
    { id: 'snake', name: 'snake_case', convert: (t) => splitWords(t).map((w) => w.toLowerCase()).join('_') },
    { id: 'kebab', name: 'kebab-case', convert: (t) => splitWords(t).map((w) => w.toLowerCase()).join('-') },
    { id: 'constant', name: 'CONSTANT_CASE', convert: (t) => splitWords(t).map((w) => w.toUpperCase()).join('_') },
    { id: 'dot', name: 'dot.case', convert: (t) => splitWords(t).map((w) => w.toLowerCase()).join('.') },
];

const CLIP_THRESHOLD = 140;

/* ─── page ─── */

export default function TextCasePage() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [input, setInput] = useState('');
    const [expanded, setExpanded] = useState<Partial<Record<CaseId, boolean>>>({});
    const [justCopied, setJustCopied] = useState<CaseId | null>(null);

    const results = useMemo(
        () => CASES.map((c) => ({ ...c, value: input ? c.convert(input) : '' })),
        [input],
    );

    const charCount = input.length;
    const wordCount = useMemo(() => {
        const trimmed = input.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [input]);

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast.error(s.pasteError);
                return;
            }
            setInput(text);
            toast.success(s.pasted);
        } catch {
            toast.error(s.pasteError);
        }
    };

    const clearAll = () => {
        setInput('');
        setExpanded({});
    };

    const copyResult = async (id: CaseId, value: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setJustCopied(id);
            toast.success(s.copied);
            window.setTimeout(() => {
                setJustCopied((prev) => (prev === id ? null : prev));
            }, 1600);
        } catch {
            toast.error(s.pasteError);
        }
    };

    const toggleExpand = (id: CaseId) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <ToolShell
            icon={<CaseSensitive className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="xwide"
        >
            {/* input */}
            <ToolCard className="mb-8">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <FieldLabel hint={s.inputHint}>{s.inputLabel}</FieldLabel>
                    <div className="flex items-center gap-1 -mt-1">
                        <GhostButton onClick={pasteFromClipboard}>
                            <ClipboardPaste className="w-3.5 h-3.5" strokeWidth={2} />
                            {s.paste}
                        </GhostButton>
                        <GhostButton tone="danger" onClick={clearAll} disabled={!input}>
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                            {s.clear}
                        </GhostButton>
                    </div>
                </div>
                <TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={s.placeholder}
                    rows={5}
                    spellCheck={false}
                    className="font-mono !text-[13.5px] leading-[1.6] min-h-[132px]"
                />
                <div className="mt-3 flex items-center gap-4 text-[12px] text-[var(--color-ink-3)] font-mono">
                    <span>
                        {charCount.toLocaleString()} {s.chars}
                    </span>
                    <span aria-hidden className="w-1 h-1 rounded-full bg-[var(--color-line-strong)]" />
                    <span>
                        {wordCount.toLocaleString()} {s.words}
                    </span>
                </div>
            </ToolCard>

            {/* results */}
            <div className="flex items-center gap-2.5 mb-5">
                <Type className="w-3.5 h-3.5 text-[var(--color-ink-3)]" strokeWidth={2.2} />
                <span className="kicker text-[var(--color-ink-3)]">{s.resultsLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((c, i) => {
                    const isLong = c.value.length > CLIP_THRESHOLD || c.value.split('\n').length > 3;
                    const isExpanded = !!expanded[c.id];
                    return (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: EASE, delay: 0.04 * i }}
                            className="group flex flex-col rounded-2xl bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-line-strong)] transition-colors duration-300 p-4 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="min-w-0">
                                    <span className="block font-mono text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                                        {c.name}
                                    </span>
                                    <span className="block mt-0.5 text-[11.5px] text-[var(--color-ink-3)]">
                                        {s.caseDesc[c.id]}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyResult(c.id, c.value)}
                                    disabled={!c.value}
                                    aria-label={`${s.copyAria} — ${c.name}`}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
                                >
                                    {justCopied === c.id ? (
                                        <Check className="w-4 h-4 text-[var(--color-accent-deep)]" strokeWidth={2.4} />
                                    ) : (
                                        <Copy className="w-4 h-4" strokeWidth={1.9} />
                                    )}
                                </button>
                            </div>

                            {c.value ? (
                                <p
                                    className={`font-mono text-[12.5px] leading-[1.65] text-[var(--color-ink)] whitespace-pre-wrap break-all rounded-xl bg-[var(--color-surface-2)] px-3.5 py-3 ${
                                        isExpanded ? '' : 'line-clamp-3'
                                    }`}
                                >
                                    {c.value}
                                </p>
                            ) : (
                                <p className="text-[12.5px] text-[var(--color-ink-4)] rounded-xl bg-[var(--color-surface-2)] px-3.5 py-3">
                                    {s.empty}
                                </p>
                            )}

                            {isLong && (
                                <button
                                    onClick={() => toggleExpand(c.id)}
                                    className="mt-2.5 self-start inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-ink-3)] hover:text-[var(--color-accent-deep)] transition-colors duration-200"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.2} />
                                            {s.collapse}
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.2} />
                                            {s.expand}
                                        </>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </ToolShell>
    );
}
