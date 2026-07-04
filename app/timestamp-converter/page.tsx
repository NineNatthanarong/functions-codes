'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Clock, Copy, Timer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, {
    FieldLabel,
    GhostButton,
    SecondaryButton,
    SegmentedControl,
    TextInput,
    ToolCard,
} from '@/components/ToolShell';

const EASE = [0.25, 1, 0.5, 1] as const;

const STRINGS = {
    th: {
        kicker: 'UNIX TIME',
        title: 'แปลง Unix Timestamp',
        subtitle:
            'เจอ timestamp ใน log หรือฐานข้อมูลแล้วอ่านไม่ออก? วางตรงนี้ได้เลย — แปลงเป็นเวลาท้องถิ่น UTC และวันที่ไทยแบบ พ.ศ. หรือจะแปลงวันที่กลับเป็น timestamp ก็ได้ ทุกอย่างทำงานในเบราว์เซอร์ ไม่ส่งข้อมูลไปไหน',
        nowTitle: 'เวลาตอนนี้',
        nowHint: 'เดินทุกวินาที — คลิกตัวเลขเพื่อคัดลอก',
        nowSeconds: 'วินาที (s)',
        nowMilliseconds: 'มิลลิวินาที (ms)',
        copyNowSeconds: 'คัดลอก timestamp แบบวินาที',
        copyNowMs: 'คัดลอก timestamp แบบมิลลิวินาที',
        tsToDateTitle: 'Timestamp → วันที่',
        tsInputLabel: 'Unix timestamp',
        tsInputHint: 'รับทั้งวินาทีและมิลลิวินาที',
        tsPlaceholder: 'วาง timestamp ที่นี่ เช่น 1720000000',
        unitAuto: 'เดาอัตโนมัติ',
        unitS: 'วินาที',
        unitMs: 'มิลลิวินาที',
        detectedS: 'เดาว่าเป็น “วินาที” — สลับหน่วยได้ถ้าไม่ใช่',
        detectedMs: 'เดาว่าเป็น “มิลลิวินาที” — สลับหน่วยได้ถ้าไม่ใช่',
        invalidTs: 'ยังอ่านไม่ออก — ใส่ตัวเลขล้วน ๆ เช่น 1720000000',
        outOfRange: 'ตัวเลขนี้ไกลเกินช่วงวันที่ที่รองรับ ลองเช็คหน่วยอีกที',
        rowLocal: 'เวลาท้องถิ่น',
        rowUtc: 'UTC — ISO 8601',
        rowRfc: 'แบบอ่านง่าย — RFC 2822',
        rowRelative: 'เทียบกับตอนนี้',
        rowBuddhist: 'วันที่ไทย (พ.ศ.)',
        emptyResult: 'วาง timestamp ด้านบน แล้วผลลัพธ์จะโผล่ตรงนี้',
        dateToTsTitle: 'วันที่ → Timestamp',
        dateInputLabel: 'วันที่และเวลา',
        tzNote: 'ตีความตามโซนเวลาของเครื่องคุณ: {tz}',
        useNow: 'ใช้เวลาตอนนี้',
        clear: 'ล้าง',
        emptyDate: 'เลือกวันที่ก่อน แล้ว timestamp จะโผล่ตรงนี้',
        rowUnixSeconds: 'Unix — วินาที',
        rowUnixMs: 'Unix — มิลลิวินาที',
        copy: 'คัดลอก',
        copied: 'คัดลอกเรียบร้อย',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้งนะ',
    },
    en: {
        kicker: 'UNIX TIME',
        title: 'Unix Timestamp Converter',
        subtitle:
            'Found a cryptic timestamp in your logs or database? Paste it here — get local time, UTC, and Thai Buddhist Era dates instantly, or convert a date back into a timestamp. Everything runs in your browser; nothing leaves your device.',
        nowTitle: 'Right now',
        nowHint: 'Ticks every second — click a number to copy',
        nowSeconds: 'Seconds (s)',
        nowMilliseconds: 'Milliseconds (ms)',
        copyNowSeconds: 'Copy current unix seconds',
        copyNowMs: 'Copy current unix milliseconds',
        tsToDateTitle: 'Timestamp → Date',
        tsInputLabel: 'Unix timestamp',
        tsInputHint: 'Accepts seconds or milliseconds',
        tsPlaceholder: 'Paste a timestamp, e.g. 1720000000',
        unitAuto: 'Auto',
        unitS: 'Seconds',
        unitMs: 'Milliseconds',
        detectedS: 'Assuming seconds — switch the unit if that is wrong',
        detectedMs: 'Assuming milliseconds — switch the unit if that is wrong',
        invalidTs: 'Cannot read that — enter digits only, e.g. 1720000000',
        outOfRange: 'That number is outside the supported date range — check the unit',
        rowLocal: 'Local time',
        rowUtc: 'UTC — ISO 8601',
        rowRfc: 'Readable — RFC 2822',
        rowRelative: 'Relative to now',
        rowBuddhist: 'Thai date (Buddhist Era)',
        emptyResult: 'Paste a timestamp above and the results will appear here',
        dateToTsTitle: 'Date → Timestamp',
        dateInputLabel: 'Date and time',
        tzNote: 'Interpreted in your device time zone: {tz}',
        useNow: 'Use current time',
        clear: 'Clear',
        emptyDate: 'Pick a date and the timestamps will appear here',
        rowUnixSeconds: 'Unix — seconds',
        rowUnixMs: 'Unix — milliseconds',
        copy: 'Copy',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed — please try again',
    },
} as const;

/* ─── pure helpers ─── */

type Unit = 'auto' | 's' | 'ms';

type ParseResult =
    | { kind: 'empty' }
    | { kind: 'invalid' }
    | { kind: 'range' }
    | { kind: 'ok'; date: Date; detected: 's' | 'ms' };

const MAX_EPOCH_MS = 8.64e15; // JS Date limit: ±100,000,000 days

function parseTimestamp(raw: string, unit: Unit): ParseResult {
    const trimmed = raw.trim();
    if (!trimmed) return { kind: 'empty' };
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return { kind: 'invalid' };
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return { kind: 'invalid' };
    // 1e11 s ≈ year 5138, 1e11 ms ≈ March 1973 — a good split point
    const detected: 's' | 'ms' = unit === 'auto' ? (Math.abs(num) >= 1e11 ? 'ms' : 's') : unit;
    const ms = detected === 's' ? num * 1000 : num;
    if (!Number.isFinite(ms) || Math.abs(ms) > MAX_EPOCH_MS) return { kind: 'range' };
    return { kind: 'ok', date: new Date(Math.trunc(ms)), detected };
}

const pad2 = (n: number) => String(Math.abs(n)).padStart(2, '0');

const RFC_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RFC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatRfc2822(d: Date): string {
    const offsetMin = -d.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    return `${RFC_DAYS[d.getDay()]}, ${pad2(d.getDate())} ${RFC_MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad2(
        d.getHours()
    )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${sign}${pad2(Math.floor(abs / 60))}${pad2(abs % 60)}`;
}

function formatRelative(target: Date, nowMs: number, locale: 'th' | 'en'): string {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffSec = Math.round((target.getTime() - nowMs) / 1000);
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    const diffHour = Math.round(diffMin / 60);
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    const diffDay = Math.round(diffHour / 24);
    if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
    const diffMonth = Math.round(diffDay / 30.44);
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
    return rtf.format(Math.round(diffDay / 365.25), 'year');
}

function toDatetimeLocalValue(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(
        d.getMinutes()
    )}:${pad2(d.getSeconds())}`;
}

/* ─── small sub-components ─── */

function CardHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)] flex-shrink-0">
                {icon}
            </span>
            {children}
        </h2>
    );
}

function ResultRow({
    label,
    value,
    copyLabel,
    onCopy,
}: {
    label: string;
    value: string;
    copyLabel: string;
    onCopy: (v: string) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink-3)] mb-1">
                    {label}
                </div>
                <div className="font-mono text-[13.5px] leading-[1.5] text-[var(--color-ink-2)] break-all">{value}</div>
            </div>
            <button
                onClick={() => onCopy(value)}
                aria-label={copyLabel}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] transition-colors duration-200 flex-shrink-0"
            >
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
        </div>
    );
}

function NowBlock({
    label,
    value,
    ariaLabel,
    onCopy,
}: {
    label: string;
    value: string;
    ariaLabel: string;
    onCopy: (v: string) => void;
}) {
    return (
        <button
            onClick={() => onCopy(value)}
            aria-label={ariaLabel}
            className="group flex flex-col items-start gap-2 p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-line)] hover:border-[var(--color-accent)] text-left transition-colors duration-300"
        >
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink-3)]">{label}</span>
            <span className="flex items-center gap-3 w-full">
                <span className="font-mono text-[22px] sm:text-[26px] font-semibold text-[var(--color-ink-2)] tabular-nums break-all">
                    {value}
                </span>
                <Copy
                    className="w-4 h-4 ml-auto text-[var(--color-ink-4)] group-hover:text-[var(--color-accent-deep)] transition-colors duration-300 flex-shrink-0"
                    strokeWidth={2}
                />
            </span>
        </button>
    );
}

/* ─── page ─── */

export default function TimestampConverter() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    // live clock — starts ticking only after mount (hydration-safe)
    const [nowMs, setNowMs] = useState<number | null>(null);
    const [tzName, setTzName] = useState('');

    useEffect(() => {
        setNowMs(Date.now());
        try {
            setTzName(Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch {
            /* ignore */
        }
        const id = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // block 2 — timestamp → date
    const [tsInput, setTsInput] = useState('');
    const [unit, setUnit] = useState<Unit>('auto');

    // block 3 — date → timestamp
    const [dateInput, setDateInput] = useState('');

    const copyText = async (text: string) => {
        if (!text || text === '—') return;
        try {
            await navigator.clipboard.writeText(text);
            toast.success(s.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const tsResult = useMemo(() => parseTimestamp(tsInput, unit), [tsInput, unit]);

    const tsRows = useMemo(() => {
        if (tsResult.kind !== 'ok') return null;
        const d = tsResult.date;
        const localFmt = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
            dateStyle: 'medium',
            timeStyle: 'medium',
        });
        const buddhistFmt = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
            dateStyle: 'full',
            timeStyle: 'medium',
        });
        return [
            { key: 'local', label: s.rowLocal, value: `${localFmt.format(d)}${tzName ? ` (${tzName})` : ''}` },
            { key: 'utc', label: s.rowUtc, value: d.toISOString() },
            { key: 'rfc', label: s.rowRfc, value: formatRfc2822(d) },
            { key: 'rel', label: s.rowRelative, value: formatRelative(d, nowMs ?? d.getTime(), locale) },
            { key: 'be', label: s.rowBuddhist, value: buddhistFmt.format(d) },
        ];
    }, [tsResult, tzName, nowMs, locale, s]);

    const tsError =
        tsResult.kind === 'invalid' ? s.invalidTs : tsResult.kind === 'range' ? s.outOfRange : null;

    const detectedHint =
        unit === 'auto' && tsResult.kind === 'ok'
            ? tsResult.detected === 's'
                ? s.detectedS
                : s.detectedMs
            : null;

    const dateResult = useMemo(() => {
        if (!dateInput.trim()) return null;
        const d = new Date(dateInput);
        if (Number.isNaN(d.getTime())) return null;
        return { seconds: Math.floor(d.getTime() / 1000), ms: d.getTime() };
    }, [dateInput]);

    const clearTs = () => {
        setTsInput('');
        setUnit('auto');
    };

    const fillNow = () => {
        setDateInput(toDatetimeLocalValue(new Date()));
    };

    return (
        <ToolShell
            icon={<Clock className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="wide"
        >
            {/* block 1 — live now */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
            >
                <ToolCard className="mb-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                        <CardHeading icon={<Clock className="w-3.5 h-3.5" strokeWidth={2.2} />}>
                            {s.nowTitle}
                        </CardHeading>
                        <span className="text-[12px] text-[var(--color-ink-3)]">{s.nowHint}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <NowBlock
                            label={s.nowSeconds}
                            value={nowMs !== null ? String(Math.floor(nowMs / 1000)) : '—'}
                            ariaLabel={s.copyNowSeconds}
                            onCopy={copyText}
                        />
                        <NowBlock
                            label={s.nowMilliseconds}
                            value={nowMs !== null ? String(nowMs) : '—'}
                            ariaLabel={s.copyNowMs}
                            onCopy={copyText}
                        />
                    </div>
                </ToolCard>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* block 2 — timestamp → date */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
                >
                    <ToolCard>
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <CardHeading icon={<Timer className="w-3.5 h-3.5" strokeWidth={2.2} />}>
                                {s.tsToDateTitle}
                            </CardHeading>
                            <GhostButton tone="danger" onClick={clearTs} disabled={!tsInput}>
                                <Trash2 className="w-3.5 h-3.5" />
                                {s.clear}
                            </GhostButton>
                        </div>

                        <FieldLabel hint={s.tsInputHint}>{s.tsInputLabel}</FieldLabel>
                        <TextInput
                            value={tsInput}
                            onChange={(e) => setTsInput(e.target.value)}
                            placeholder={s.tsPlaceholder}
                            inputMode="numeric"
                            autoComplete="off"
                            spellCheck={false}
                            className="font-mono"
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <SegmentedControl<Unit>
                                options={[
                                    { value: 'auto', label: s.unitAuto },
                                    { value: 's', label: s.unitS },
                                    { value: 'ms', label: s.unitMs },
                                ]}
                                value={unit}
                                onChange={setUnit}
                            />
                            {detectedHint && (
                                <span className="text-[12px] text-[var(--color-ink-3)]">{detectedHint}</span>
                            )}
                        </div>

                        {tsError && <p className="mt-3 text-[12.5px] font-medium text-[#d62828]">{tsError}</p>}

                        <div className="mt-5 border-t border-[var(--color-line)]">
                            {tsRows ? (
                                <div className="divide-y divide-[var(--color-line)]">
                                    {tsRows.map((row) => (
                                        <ResultRow
                                            key={row.key}
                                            label={row.label}
                                            value={row.value}
                                            copyLabel={`${s.copy}: ${row.label}`}
                                            onCopy={copyText}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="py-6 text-[13px] text-[var(--color-ink-4)]">{s.emptyResult}</p>
                            )}
                        </div>
                    </ToolCard>
                </motion.div>

                {/* block 3 — date → timestamp */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.14 }}
                >
                    <ToolCard>
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <CardHeading icon={<CalendarClock className="w-3.5 h-3.5" strokeWidth={2.2} />}>
                                {s.dateToTsTitle}
                            </CardHeading>
                            <SecondaryButton onClick={fillNow}>{s.useNow}</SecondaryButton>
                        </div>

                        <FieldLabel>{s.dateInputLabel}</FieldLabel>
                        <TextInput
                            type="datetime-local"
                            step={1}
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)}
                            className="font-mono"
                        />
                        {tzName && (
                            <p className="mt-2.5 text-[12px] text-[var(--color-ink-3)]">
                                {s.tzNote.replace('{tz}', tzName)}
                            </p>
                        )}

                        <div className="mt-5 border-t border-[var(--color-line)]">
                            {dateResult ? (
                                <div className="divide-y divide-[var(--color-line)]">
                                    <ResultRow
                                        label={s.rowUnixSeconds}
                                        value={String(dateResult.seconds)}
                                        copyLabel={`${s.copy}: ${s.rowUnixSeconds}`}
                                        onCopy={copyText}
                                    />
                                    <ResultRow
                                        label={s.rowUnixMs}
                                        value={String(dateResult.ms)}
                                        copyLabel={`${s.copy}: ${s.rowUnixMs}`}
                                        onCopy={copyText}
                                    />
                                </div>
                            ) : (
                                <p className="py-6 text-[13px] text-[var(--color-ink-4)]">{s.emptyDate}</p>
                            )}
                        </div>
                    </ToolCard>
                </motion.div>
            </div>
        </ToolShell>
    );
}
