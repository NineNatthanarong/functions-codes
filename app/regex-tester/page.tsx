'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Regex, Copy, Trash2, AlertCircle, Replace, Wand2, Highlighter, List } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, GhostButton, FieldLabel, TextInput, TextArea } from '@/components/ToolShell';

/* ─── constants ─── */

const MATCH_CAP = 1000;
const FLAG_ORDER = ['g', 'i', 'm', 's', 'u', 'y'] as const;
type Flag = (typeof FLAG_ORDER)[number];

const PRESETS = [
    { key: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
    { key: 'url', pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' },
    { key: 'ip', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
    { key: 'thai', pattern: '[ก-๙]+', flags: 'g' },
    { key: 'digits', pattern: '\\d+', flags: 'g' },
    { key: 'trim', pattern: '^\\s+|\\s+$', flags: 'gm' },
] as const;
type PresetKey = (typeof PRESETS)[number]['key'];

/* ─── i18n (local) ─── */

const STRINGS = {
    th: {
        kicker: 'Regex',
        title: 'ทดสอบ Regex',
        subtitle:
            'เขียนแพทเทิร์น regex แล้วเห็นผลทันทีขณะพิมพ์ — วางข้อความตัวอย่าง ดู match ที่ไฮไลต์ กลุ่มที่จับได้ (capture groups) และลองแทนที่ข้อความ ทำงานในเบราว์เซอร์ 100% ไม่ส่งข้อมูลไปไหน',
        patternLabel: 'แพทเทิร์น',
        patternPlaceholder: 'เช่น (\\w+)@([a-z]+)\\.com',
        patternAria: 'แพทเทิร์น regex',
        flagsHint: 'กดชิปเพื่อเปิด/ปิด flag',
        invalidPattern: 'แพทเทิร์นไม่ถูกต้อง:',
        patternTimeout: 'รูปแบบนี้ใช้เวลานานเกินไป (อาจเกิด catastrophic backtracking) ลองแก้ pattern',
        quickLabel: 'แพทเทิร์นสำเร็จรูป',
        presets: {
            email: 'อีเมล',
            url: 'URL',
            ip: 'IP Address',
            thai: 'อักษรไทย',
            digits: 'ตัวเลข',
            trim: 'ช่องว่างหัว-ท้าย',
        } as Record<PresetKey, string>,
        testLabel: 'ข้อความทดสอบ',
        testPlaceholder: 'วางข้อความตัวอย่างที่นี่ เช่น อีเมล ล็อก หรือข้อมูลที่อยากตรวจ...',
        clear: 'ล้าง',
        chars: 'ตัวอักษร',
        highlightLabel: 'ไฮไลต์ในข้อความ',
        matchesLabel: 'รายการ Match',
        matchCount: (n: string) => `เจอ ${n} รายการ`,
        noMatchBadge: 'ไม่พบที่ตรงกัน',
        cappedNote: `แสดงเฉพาะ ${MATCH_CAP.toLocaleString('en-US')} รายการแรก`,
        tableIndex: '#',
        tablePos: 'ตำแหน่ง',
        tableMatch: 'ข้อความที่ตรง',
        tableGroups: 'กลุ่ม (groups)',
        emptyMatchCell: '(ว่าง)',
        previewIdle: 'พิมพ์แพทเทิร์นด้านบน แล้ววางข้อความทดสอบ — ผลลัพธ์จะขึ้นทันทีขณะพิมพ์',
        noMatchesYet: 'ยังไม่พบผลลัพธ์ — ลองปรับแพทเทิร์นหรือ flag ดู',
        replaceLabel: 'แทนที่ (Replace)',
        replaceWithLabel: 'แทนที่ด้วย',
        replacePlaceholder: 'เช่น $1 หรือ $<name>',
        replaceHint: 'รองรับ $1, $2 และ $<ชื่อกลุ่ม>',
        replaceOutputLabel: 'ผลลัพธ์หลังแทนที่',
        replaceEmpty: 'ผลลัพธ์จะแสดงที่นี่เมื่อแพทเทิร์นถูกต้องและมีข้อความทดสอบ',
        replaceEmptyResult: '(ผลลัพธ์ว่าง — ข้อความถูกลบทั้งหมด)',
        copy: 'คัดลอก',
        copied: 'คัดลอกเรียบร้อย',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้ง',
        flagDesc: {
            g: 'global — หาทุก match',
            i: 'ignore case — ไม่สนตัวพิมพ์เล็ก/ใหญ่',
            m: 'multiline — ^ กับ $ จับต้นและท้ายของแต่ละบรรทัด',
            s: 'dotAll — จุด (.) จับขึ้นบรรทัดใหม่ด้วย',
            u: 'unicode — โหมดยูนิโค้ด',
            y: 'sticky — จับต่อจากตำแหน่งล่าสุดเท่านั้น',
        } as Record<Flag, string>,
    },
    en: {
        kicker: 'Regex',
        title: 'Regex Tester',
        subtitle:
            'Craft a regex and see results live as you type — paste sample text, watch matches get highlighted, inspect capture groups, and try replacements. Runs 100% in your browser, nothing leaves your device.',
        patternLabel: 'Pattern',
        patternPlaceholder: 'e.g. (\\w+)@([a-z]+)\\.com',
        patternAria: 'Regex pattern',
        flagsHint: 'Tap a chip to toggle a flag',
        invalidPattern: 'Invalid pattern:',
        patternTimeout: 'This pattern took too long (possible catastrophic backtracking) — try refining it',
        quickLabel: 'Quick patterns',
        presets: {
            email: 'Email',
            url: 'URL',
            ip: 'IP address',
            thai: 'Thai characters',
            digits: 'Digits',
            trim: 'Trim whitespace',
        } as Record<PresetKey, string>,
        testLabel: 'Test string',
        testPlaceholder: 'Paste sample data here — emails, logs, anything you want to validate...',
        clear: 'Clear',
        chars: 'chars',
        highlightLabel: 'Highlighted text',
        matchesLabel: 'Match list',
        matchCount: (n: string) => `${n} matches`,
        noMatchBadge: 'No matches',
        cappedNote: `Showing the first ${MATCH_CAP.toLocaleString('en-US')} matches only`,
        tableIndex: '#',
        tablePos: 'Position',
        tableMatch: 'Full match',
        tableGroups: 'Groups',
        emptyMatchCell: '(empty)',
        previewIdle: 'Type a pattern above and paste a test string — results update live as you type',
        noMatchesYet: 'No matches yet — try tweaking the pattern or flags',
        replaceLabel: 'Replace',
        replaceWithLabel: 'Replace with',
        replacePlaceholder: 'e.g. $1 or $<name>',
        replaceHint: 'Supports $1, $2 and $<groupName>',
        replaceOutputLabel: 'Replaced output',
        replaceEmpty: 'Output appears here once the pattern is valid and there is a test string',
        replaceEmptyResult: '(empty result — everything was removed)',
        copy: 'Copy',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed, please try again',
        flagDesc: {
            g: 'global — find all matches',
            i: 'ignore case',
            m: 'multiline — ^ and $ match per line',
            s: 'dotAll — dot (.) matches newlines',
            u: 'unicode mode',
            y: 'sticky — match only from lastIndex',
        } as Record<Flag, string>,
    },
} as const;

/* ─── matching helpers ─── */

type GroupInfo = { label: string; value: string | undefined };
type MatchInfo = { n: number; index: number; text: string; groups: GroupInfo[] };
type Outcome =
    | { status: 'idle' }
    | { status: 'error'; message: string; timedOut?: boolean }
    | { status: 'ok'; matches: MatchInfo[]; capped: boolean; replaced: string | null };

type WorkerResult =
    | { ok: true; matches: MatchInfo[]; capped: boolean; replaced: string | null }
    | { ok: false; message: string };

// Hard limit for a single match/replace job; catastrophic backtracking
// (e.g. /(a+)+$/ on 'aaaa...b') can otherwise block for tens of seconds.
const WORKER_TIMEOUT_MS = 600;

// Regex evaluation runs inside a Web Worker so a pathological pattern can be
// terminated instead of freezing the tab. Built from a Blob so no extra file
// or bundler support is needed.
const WORKER_SRC = `
self.onmessage = function (e) {
    var d = e.data;
    var re;
    try {
        re = new RegExp(d.pattern, d.flags);
    } catch (err) {
        self.postMessage({ ok: false, message: err && err.message ? err.message : String(err) });
        return;
    }
    try {
        var CAP = ${MATCH_CAP};
        var matches = [];
        var capped = false;
        function toInfo(m, n) {
            var groups = [];
            for (var i = 1; i < m.length; i++) {
                groups.push({ label: '$' + i, value: m[i] });
            }
            if (m.groups) {
                for (var name in m.groups) {
                    groups.push({ label: '<' + name + '>', value: m.groups[name] });
                }
            }
            return { n: n, index: m.index, text: m[0], groups: groups };
        }
        if (!re.global) {
            var single = re.exec(d.text);
            if (single) matches.push(toInfo(single, 1));
        } else {
            re.lastIndex = 0;
            var m;
            while ((m = re.exec(d.text)) !== null) {
                if (matches.length >= CAP) {
                    capped = true;
                    break;
                }
                matches.push(toInfo(m, matches.length + 1));
                // guard against infinite loops on zero-length matches
                if (m[0].length === 0) {
                    re.lastIndex += 1;
                    if (re.lastIndex > d.text.length) break;
                }
            }
        }
        var replaced = null;
        if (d.text) {
            try {
                replaced = d.text.replace(new RegExp(d.pattern, d.flags), d.replacement);
            } catch (e2) {
                replaced = null;
            }
        }
        self.postMessage({ ok: true, matches: matches, capped: capped, replaced: replaced });
    } catch (err) {
        self.postMessage({ ok: false, message: err && err.message ? err.message : String(err) });
    }
};
`;

let workerUrl: string | null = null;
function getWorkerUrl(): string {
    if (workerUrl === null) {
        workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }));
    }
    return workerUrl;
}

type Segment = { key: number; text: string; hl: number | null };

/* ─── small UI pieces ─── */

function SectionHead({ icon, label, right }: { icon: ReactNode; label: string; right?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]">
                <span className="text-[var(--color-accent-deep)]">{icon}</span>
                {label}
            </span>
            {right}
        </div>
    );
}

/* ─── page ─── */

export default function RegexTester() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [pattern, setPattern] = useState('');
    const [flags, setFlags] = useState('g');
    const [testString, setTestString] = useState('');
    const [replacement, setReplacement] = useState('');

    const [deb, setDeb] = useState({ pattern: '', flags: 'g', text: '', replacement: '' });

    useEffect(() => {
        const id = setTimeout(() => {
            setDeb({ pattern, flags, text: testString, replacement });
        }, 150);
        return () => clearTimeout(id);
    }, [pattern, flags, testString, replacement]);

    const toggleFlag = (f: Flag) => {
        setFlags((prev) =>
            prev.includes(f)
                ? prev.replace(f, '')
                : FLAG_ORDER.filter((x) => prev.includes(x) || x === f).join('')
        );
    };

    const applyPreset = (p: (typeof PRESETS)[number]) => {
        setPattern(p.pattern);
        setFlags(p.flags);
    };

    const clearAll = () => {
        setPattern('');
        setTestString('');
        setReplacement('');
        setFlags('g');
    };

    const [outcome, setOutcome] = useState<Outcome>({ status: 'idle' });

    useEffect(() => {
        if (!deb.pattern) {
            setOutcome({ status: 'idle' });
            return;
        }
        const worker = new Worker(getWorkerUrl());
        const timer = setTimeout(() => {
            worker.terminate();
            setOutcome({ status: 'error', message: '', timedOut: true });
        }, WORKER_TIMEOUT_MS);
        worker.onmessage = (e: MessageEvent<WorkerResult>) => {
            clearTimeout(timer);
            worker.terminate();
            const r = e.data;
            if (r.ok) {
                setOutcome({ status: 'ok', matches: r.matches, capped: r.capped, replaced: r.replaced });
            } else {
                setOutcome({ status: 'error', message: r.message });
            }
        };
        worker.onerror = (e) => {
            clearTimeout(timer);
            worker.terminate();
            setOutcome({ status: 'error', message: e.message || 'Worker error' });
        };
        worker.postMessage({ pattern: deb.pattern, flags: deb.flags, text: deb.text, replacement: deb.replacement });
        return () => {
            clearTimeout(timer);
            worker.terminate();
        };
    }, [deb]);

    const segments = useMemo<Segment[]>(() => {
        if (outcome.status !== 'ok' || !deb.text) return [];
        const segs: Segment[] = [];
        let cursor = 0;
        let k = 0;
        for (const m of outcome.matches) {
            if (m.text.length === 0) continue;
            if (m.index > cursor) segs.push({ key: k++, text: deb.text.slice(cursor, m.index), hl: null });
            segs.push({ key: k++, text: m.text, hl: m.n });
            cursor = m.index + m.text.length;
        }
        if (cursor < deb.text.length) segs.push({ key: k++, text: deb.text.slice(cursor), hl: null });
        return segs;
    }, [outcome, deb.text]);

    const isError = outcome.status === 'error';
    const replaced = outcome.status === 'ok' ? outcome.replaced : null;
    const canCopyReplaced = replaced !== null && replaced !== '';

    const copyReplaced = async () => {
        if (!canCopyReplaced || replaced === null) return;
        try {
            await navigator.clipboard.writeText(replaced);
            toast.success(s.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const matchCountBadge =
        outcome.status === 'ok' && deb.text ? (
            <span
                className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold tracking-[-0.01em]',
                    outcome.matches.length > 0
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink-2)]'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-ink-3)]'
                )}
            >
                {outcome.matches.length > 0
                    ? s.matchCount(outcome.capped ? `${MATCH_CAP.toLocaleString('en-US')}+` : String(outcome.matches.length))
                    : s.noMatchBadge}
            </span>
        ) : null;

    return (
        <ToolShell
            icon={<Regex className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="wide"
        >
            {/* ── pattern ── */}
            <ToolCard className="mb-5">
                <FieldLabel hint={s.flagsHint}>{s.patternLabel}</FieldLabel>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div
                        className={cn(
                            'flex items-center flex-1 min-w-0 h-12 px-4 rounded-xl bg-white border font-mono text-[14px] transition-all duration-300',
                            isError
                                ? 'border-[#d62828] ring-2 ring-[#d62828]/15'
                                : 'border-[var(--color-line)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/15'
                        )}
                    >
                        <span className="text-[var(--color-ink-4)] select-none">/</span>
                        <input
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder={s.patternPlaceholder}
                            aria-label={s.patternAria}
                            spellCheck={false}
                            autoComplete="off"
                            className="flex-1 min-w-0 bg-transparent px-1.5 font-mono text-[14px] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)] focus:outline-none"
                        />
                        <span className="text-[var(--color-ink-4)] select-none whitespace-nowrap">
                            /<span className="text-[var(--color-accent-deep)]">{flags}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0" role="group" aria-label="Regex flags">
                        {FLAG_ORDER.map((f) => {
                            const active = flags.includes(f);
                            return (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => toggleFlag(f)}
                                    aria-pressed={active}
                                    title={s.flagDesc[f]}
                                    className={cn(
                                        'w-9 h-9 rounded-lg font-mono text-[13px] font-semibold border transition-colors duration-200',
                                        active
                                            ? 'bg-[var(--color-ink-2)] text-white border-[var(--color-ink-2)]'
                                            : 'bg-white text-[var(--color-ink-3)] border-[var(--color-line)] hover:border-[var(--color-ink-2)] hover:text-[var(--color-ink-2)]'
                                    )}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {outcome.status === 'error' && (
                    <div className="mt-3 flex items-start gap-2 text-[12.5px] font-mono text-[#d62828]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-[1px]" strokeWidth={2.2} />
                        <span className="break-all">
                            {outcome.timedOut ? s.patternTimeout : `${s.invalidPattern} ${outcome.message}`}
                        </span>
                    </div>
                )}

                <div className="mt-5 pt-5 border-t border-[var(--color-line)]">
                    <span className="inline-flex items-center gap-2 mb-3 text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-3)]">
                        <Wand2 className="w-3.5 h-3.5 text-[var(--color-accent-deep)]" strokeWidth={2.1} />
                        {s.quickLabel}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => applyPreset(p)}
                                title={`/${p.pattern}/${p.flags}`}
                                className="px-3.5 py-2 rounded-full bg-white border border-[var(--color-line)] text-[12.5px] font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-colors duration-200"
                            >
                                {s.presets[p.key]}
                            </button>
                        ))}
                    </div>
                </div>
            </ToolCard>

            {/* ── test string ── */}
            <ToolCard className="mb-5">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <label
                        htmlFor="regex-test-string"
                        className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]"
                    >
                        {s.testLabel}
                    </label>
                    <div className="flex items-center gap-2">
                        {matchCountBadge}
                        <span className="text-[11.5px] text-[var(--color-ink-4)] font-mono">
                            {testString.length.toLocaleString('en-US')} {s.chars}
                        </span>
                        <GhostButton tone="danger" onClick={clearAll} disabled={!pattern && !testString && !replacement}>
                            <Trash2 className="w-3.5 h-3.5" />
                            {s.clear}
                        </GhostButton>
                    </div>
                </div>
                <TextArea
                    id="regex-test-string"
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder={s.testPlaceholder}
                    rows={8}
                    spellCheck={false}
                    className="font-mono text-[13px] leading-[1.7] min-h-[180px]"
                />
            </ToolCard>

            {/* ── results ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <ToolCard>
                    <SectionHead
                        icon={<Highlighter className="w-3.5 h-3.5" strokeWidth={2.1} />}
                        label={s.highlightLabel}
                    />
                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]/60 p-4 font-mono text-[13px] leading-[1.8] whitespace-pre-wrap break-words min-h-[160px] max-h-[360px] overflow-auto">
                        {segments.length > 0 ? (
                            segments.map((seg) =>
                                seg.hl === null ? (
                                    <span key={seg.key} className="text-[var(--color-ink)]">
                                        {seg.text}
                                    </span>
                                ) : (
                                    <mark
                                        key={seg.key}
                                        title={`#${seg.hl}`}
                                        className={cn(
                                            'rounded-[3px] text-[var(--color-ink-2)] font-medium',
                                            seg.hl % 2 === 1
                                                ? 'bg-[var(--color-accent)]/45'
                                                : 'bg-[var(--color-accent-soft)]'
                                        )}
                                    >
                                        {seg.text}
                                    </mark>
                                )
                            )
                        ) : deb.text && (isError || outcome.status === 'ok') ? (
                            <span className="text-[var(--color-ink)]">{deb.text}</span>
                        ) : (
                            <span className="italic text-[var(--color-ink-4)]">{s.previewIdle}</span>
                        )}
                    </div>
                    {outcome.status === 'ok' && outcome.capped && (
                        <p className="mt-3 text-[12px] text-[var(--color-ink-3)]">{s.cappedNote}</p>
                    )}
                </ToolCard>

                <ToolCard>
                    <SectionHead
                        icon={<List className="w-3.5 h-3.5" strokeWidth={2.1} />}
                        label={s.matchesLabel}
                        right={matchCountBadge}
                    />
                    {outcome.status === 'ok' && outcome.matches.length > 0 ? (
                        <div className="rounded-xl border border-[var(--color-line)] max-h-[360px] overflow-auto">
                            <table className="w-full text-[12.5px] border-collapse">
                                <thead className="sticky top-0 bg-[var(--color-surface-2)]">
                                    <tr className="text-left">
                                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
                                            {s.tableIndex}
                                        </th>
                                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
                                            {s.tablePos}
                                        </th>
                                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
                                            {s.tableMatch}
                                        </th>
                                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
                                            {s.tableGroups}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-line)]">
                                    {outcome.matches.map((m) => (
                                        <tr key={m.n} className="align-top">
                                            <td className="px-3 py-2.5 font-mono text-[var(--color-ink-4)]">{m.n}</td>
                                            <td className="px-3 py-2.5 font-mono text-[var(--color-ink-3)]">{m.index}</td>
                                            <td className="px-3 py-2.5">
                                                {m.text ? (
                                                    <code className="font-mono bg-[var(--color-accent-soft)] rounded-md px-1.5 py-0.5 break-all text-[var(--color-ink-2)]">
                                                        {m.text}
                                                    </code>
                                                ) : (
                                                    <span className="italic text-[var(--color-ink-4)]">{s.emptyMatchCell}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {m.groups.length === 0 ? (
                                                    <span className="text-[var(--color-ink-4)]">—</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {m.groups.map((gr, gi) => (
                                                            <span
                                                                key={gi}
                                                                className="inline-flex items-baseline gap-1 font-mono text-[11.5px] bg-[var(--color-surface-2)] border border-[var(--color-line)] rounded-md px-1.5 py-0.5"
                                                            >
                                                                <span className="text-[var(--color-ink-4)]">{gr.label}</span>
                                                                {gr.value === undefined ? (
                                                                    <span className="italic text-[var(--color-ink-4)]">undefined</span>
                                                                ) : (
                                                                    <span className="text-[var(--color-ink-2)] break-all">{gr.value}</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-[var(--color-line-strong)] p-6 min-h-[160px] flex items-center justify-center text-center text-[13px] text-[var(--color-ink-4)]">
                            {outcome.status === 'ok' && deb.text ? s.noMatchesYet : s.previewIdle}
                        </div>
                    )}
                </ToolCard>
            </div>

            {/* ── replace ── */}
            <ToolCard>
                <SectionHead
                    icon={<Replace className="w-3.5 h-3.5" strokeWidth={2.1} />}
                    label={s.replaceLabel}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                        <FieldLabel hint={s.replaceHint}>{s.replaceWithLabel}</FieldLabel>
                        <TextInput
                            value={replacement}
                            onChange={(e) => setReplacement(e.target.value)}
                            placeholder={s.replacePlaceholder}
                            spellCheck={false}
                            autoComplete="off"
                            className="font-mono text-[13px]"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2 gap-3">
                            <span className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]">
                                {s.replaceOutputLabel}
                            </span>
                            <GhostButton onClick={copyReplaced} disabled={!canCopyReplaced}>
                                <Copy className="w-3.5 h-3.5" />
                                {s.copy}
                            </GhostButton>
                        </div>
                        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]/60 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-words min-h-[88px] max-h-[240px] overflow-auto">
                            {replaced === null ? (
                                <span className="italic text-[var(--color-ink-4)]">{s.replaceEmpty}</span>
                            ) : replaced === '' ? (
                                <span className="italic text-[var(--color-ink-4)]">{s.replaceEmptyResult}</span>
                            ) : (
                                <span className="text-[var(--color-ink)]">{replaced}</span>
                            )}
                        </div>
                    </div>
                </div>
            </ToolCard>
        </ToolShell>
    );
}
