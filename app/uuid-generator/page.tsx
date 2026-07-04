'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, RefreshCw, Copy, Download, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, {
    ToolCard,
    PrimaryButton,
    SecondaryButton,
    FieldLabel,
    TextInput,
    SegmentedControl,
} from '@/components/ToolShell';

/* ─── i18n (local, per-page) ─── */

const STRINGS = {
    th: {
        title: 'สร้าง UUID',
        subtitle:
            'สุ่ม UUID v4 หรือ v7 ได้ครั้งละถึง 500 ชุดในคลิกเดียว ทุกอย่างทำงานในเบราว์เซอร์ ไม่มีข้อมูลส่งออกไปไหน',
        regenerate: 'สุ่มชุดใหม่',
        versionLabel: 'เวอร์ชัน',
        v4Hint: 'v4 — สุ่มล้วน ๆ เดาไม่ได้ ใช้ได้ทั่วไป',
        v7Hint: 'v7 — เรียงตามเวลาได้ เหมาะกับคีย์ฐานข้อมูล',
        countLabel: 'จำนวน',
        countHint: '1–500',
        formatLabel: 'รูปแบบ',
        uppercase: 'ตัวพิมพ์ใหญ่',
        noHyphens: 'ไม่มีขีดคั่น',
        braces: 'ครอบด้วย { }',
        outputLabel: 'ผลลัพธ์',
        clickToCopy: 'คลิกแถวไหนก็คัดลอกได้เลย',
        copyAll: 'คัดลอกทั้งหมด',
        download: 'ดาวน์โหลด .txt',
        copiedOne: 'คัดลอกเรียบร้อย',
        copiedAll: 'คัดลอกทั้งหมดเรียบร้อย',
        downloaded: 'ดาวน์โหลดไฟล์เรียบร้อย',
        regenerated: 'สุ่มชุดใหม่ให้แล้ว',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้งนะ',
        generating: 'กำลังสุ่ม UUID...',
    },
    en: {
        title: 'UUID Generator',
        subtitle:
            'Generate up to 500 UUIDs (v4 or time-sortable v7) in one click. Everything runs in your browser — nothing leaves your machine.',
        regenerate: 'Regenerate',
        versionLabel: 'Version',
        v4Hint: 'v4 — fully random, unguessable, the safe default',
        v7Hint: 'v7 — time-sortable, great for database keys',
        countLabel: 'Count',
        countHint: '1–500',
        formatLabel: 'Format',
        uppercase: 'Uppercase',
        noHyphens: 'No hyphens',
        braces: 'Wrap in { }',
        outputLabel: 'Output',
        clickToCopy: 'Click any row to copy it',
        copyAll: 'Copy all',
        download: 'Download .txt',
        copiedOne: 'Copied to clipboard',
        copiedAll: 'All copied to clipboard',
        downloaded: 'File downloaded',
        regenerated: 'Fresh batch generated',
        copyFailed: 'Copy failed — please try again',
        generating: 'Generating UUIDs...',
    },
} as const;

/* ─── UUID generation (RFC 9562, client-side only) ─── */

type UuidVersion = 'v4' | 'v7';

function bytesToUuid(bytes: Uint8Array): string {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function uuidV4(): string {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    return bytesToUuid(bytes);
}

/** UUIDv7 per RFC 9562: 48-bit big-endian unix-ms timestamp, then random bits. */
function uuidV7(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const ts = Date.now();
    bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
    bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
    bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
    bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
    bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
    bytes[5] = ts & 0xff;
    bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7 (rand_a keeps its low 12 bits)
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx (rand_b keeps its low 62 bits)
    return bytesToUuid(bytes);
}

const MIN_COUNT = 1;
const MAX_COUNT = 500;
const PRESETS = [1, 10, 50, 100, 500];

function clampCount(n: number): number {
    if (Number.isNaN(n)) return MIN_COUNT;
    return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(n)));
}

/* ─── local UI bits ─── */

function ToggleChip({
    active, label, onClick,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold tracking-[-0.01em] transition-colors duration-300 ${
                active
                    ? 'bg-[var(--color-ink-2)] border-[var(--color-ink-2)] text-white'
                    : 'bg-white border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-ink-2)]'
            }`}
        >
            <span
                aria-hidden
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    active ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line-strong)]'
                }`}
            />
            {label}
        </button>
    );
}

/* ─── page ─── */

export default function UuidGenerator() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [version, setVersion] = useState<UuidVersion>('v4');
    const [count, setCount] = useState(50);
    const [countText, setCountText] = useState('50');
    const [uppercase, setUppercase] = useState(false);
    const [noHyphens, setNoHyphens] = useState(false);
    const [braces, setBraces] = useState(false);
    const [uuids, setUuids] = useState<string[]>([]);

    const generate = useCallback(() => {
        const make = version === 'v7' ? uuidV7 : uuidV4;
        setUuids(Array.from({ length: count }, () => make()));
    }, [version, count]);

    // Generate on load + whenever version/count change. Never during render → hydration-safe.
    useEffect(() => {
        generate();
    }, [generate]);

    const formatted = useMemo(
        () =>
            uuids.map((u) => {
                let out = noHyphens ? u.replace(/-/g, '') : u;
                if (uppercase) out = out.toUpperCase();
                if (braces) out = `{${out}}`;
                return out;
            }),
        [uuids, uppercase, noHyphens, braces]
    );

    const setCountBoth = (n: number) => {
        const v = clampCount(n);
        setCount(v);
        setCountText(String(v));
    };

    const copyText = async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(message);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const copyAll = () => {
        if (formatted.length === 0) return;
        copyText(formatted.join('\n'), s.copiedAll);
    };

    const downloadTxt = () => {
        if (formatted.length === 0) return;
        const blob = new Blob([formatted.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uuid-${version}-x${formatted.length}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(s.downloaded);
    };

    const regenerate = () => {
        generate();
        toast.success(s.regenerated);
    };

    return (
        <ToolShell
            icon={<Fingerprint className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker="UUID · RFC 9562"
            width="wide"
            actions={
                <PrimaryButton onClick={regenerate}>
                    <RefreshCw className="w-4 h-4" />
                    {s.regenerate}
                </PrimaryButton>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
                {/* ── controls ── */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <ToolCard className="space-y-7">
                        <div>
                            <FieldLabel>{s.versionLabel}</FieldLabel>
                            <SegmentedControl<UuidVersion>
                                options={[
                                    { value: 'v4', label: 'UUID v4' },
                                    { value: 'v7', label: 'UUID v7' },
                                ]}
                                value={version}
                                onChange={setVersion}
                            />
                            <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--color-ink-3)]">
                                {version === 'v7' ? s.v7Hint : s.v4Hint}
                            </p>
                        </div>

                        <div>
                            <FieldLabel hint={s.countHint}>{s.countLabel}</FieldLabel>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={MIN_COUNT}
                                    max={MAX_COUNT}
                                    value={count}
                                    onChange={(e) => setCountBoth(Number(e.target.value))}
                                    aria-label={s.countLabel}
                                    className="w-full cursor-pointer"
                                    style={{ accentColor: 'var(--color-accent)' }}
                                />
                                <div className="w-24 flex-shrink-0">
                                    <TextInput
                                        type="number"
                                        min={MIN_COUNT}
                                        max={MAX_COUNT}
                                        inputMode="numeric"
                                        value={countText}
                                        onChange={(e) => {
                                            setCountText(e.target.value);
                                            const n = parseInt(e.target.value, 10);
                                            if (!Number.isNaN(n)) setCount(clampCount(n));
                                        }}
                                        onBlur={() => setCountText(String(count))}
                                        aria-label={s.countLabel}
                                        className="text-center font-mono"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCountBoth(p)}
                                        className={`px-2.5 py-1 rounded-lg font-mono text-[11.5px] font-medium transition-colors duration-200 ${
                                            count === p
                                                ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink-2)]'
                                                : 'text-[var(--color-ink-3)] hover:bg-[var(--color-surface-2)]'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <FieldLabel>{s.formatLabel}</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                <ToggleChip
                                    active={uppercase}
                                    label={s.uppercase}
                                    onClick={() => setUppercase((v) => !v)}
                                />
                                <ToggleChip
                                    active={noHyphens}
                                    label={s.noHyphens}
                                    onClick={() => setNoHyphens((v) => !v)}
                                />
                                <ToggleChip
                                    active={braces}
                                    label={s.braces}
                                    onClick={() => setBraces((v) => !v)}
                                />
                            </div>
                        </div>
                    </ToolCard>
                </motion.div>

                {/* ── output ── */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <span className="inline-flex items-baseline gap-2">
                            <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[var(--color-ink-2)]">
                                <Fingerprint className="w-3.5 h-3.5" />
                                {s.outputLabel}
                                <span className="font-mono text-[11.5px] font-medium text-[var(--color-ink-3)]">
                                    × {formatted.length}
                                </span>
                            </span>
                            <span className="hidden sm:inline text-[11.5px] text-[var(--color-ink-4)]">
                                · {s.clickToCopy}
                            </span>
                        </span>
                        <span className="flex items-center gap-2">
                            <SecondaryButton onClick={copyAll} disabled={formatted.length === 0}>
                                <ClipboardList className="w-3.5 h-3.5" />
                                {s.copyAll}
                            </SecondaryButton>
                            <SecondaryButton onClick={downloadTxt} disabled={formatted.length === 0}>
                                <Download className="w-3.5 h-3.5" />
                                {s.download}
                            </SecondaryButton>
                        </span>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden">
                        {formatted.length === 0 ? (
                            <div className="flex items-center justify-center min-h-[200px] text-[13px] text-[var(--color-ink-4)]">
                                {s.generating}
                            </div>
                        ) : (
                            <div className="max-h-[560px] overflow-y-auto divide-y divide-[var(--color-line)]">
                                {formatted.map((u, i) => (
                                    <button
                                        key={`${i}-${u}`}
                                        type="button"
                                        onClick={() => copyText(u, s.copiedOne)}
                                        className="group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--color-surface-2)] active:bg-[var(--color-accent-soft)] transition-colors duration-200"
                                    >
                                        <span className="w-8 flex-shrink-0 font-mono text-[11px] text-[var(--color-ink-4)] tabular-nums text-right">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1 min-w-0 font-mono text-[13px] text-[var(--color-ink-2)] break-all">
                                            {u}
                                        </span>
                                        <Copy
                                            className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-ink-4)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-accent-deep)] transition-all duration-200"
                                            strokeWidth={2}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="sm:hidden mt-2.5 text-[11.5px] text-[var(--color-ink-4)] text-center">
                        {s.clickToCopy}
                    </p>
                </motion.div>
            </div>
        </ToolShell>
    );
}
