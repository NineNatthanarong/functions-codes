'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Hash, Copy, Loader2, Trash2, UploadCloud, X, FileText,
    CheckCircle2, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, {
    ToolCard, GhostButton, FieldLabel, TextInput, TextArea, SegmentedControl,
} from '@/components/ToolShell';
import { md5Hex } from './md5';

const EASE = [0.25, 1, 0.5, 1] as const;

const ALGOS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algo = (typeof ALGOS)[number];
type DigestMap = Partial<Record<Algo, string>>;

const SHA_ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;

const STRINGS = {
    th: {
        kicker: 'HASH · CHECKSUM',
        title: 'สร้างแฮช MD5 / SHA',
        subtitle: 'คำนวณ MD5, SHA-1, SHA-256, SHA-384 และ SHA-512 จากข้อความหรือไฟล์ได้ทันที ทุกอย่างทำงานในเบราว์เซอร์ของคุณ ไม่มีการอัปโหลดข้อมูลไปที่ไหนเลย',
        tabText: 'ข้อความ',
        tabFile: 'ไฟล์',
        textLabel: 'ข้อความต้นฉบับ',
        textPlaceholder: 'พิมพ์หรือวางข้อความที่นี่ แฮชจะคำนวณให้ทันที...',
        chars: 'ตัวอักษร',
        clear: 'ล้าง',
        fileLabel: 'ไฟล์ต้นฉบับ',
        dropTitle: 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์',
        dropHint: 'ไฟล์ถูกอ่านในเครื่องของคุณเท่านั้น ไม่มีการอัปโหลด',
        chooseFile: 'เลือกไฟล์',
        removeFile: 'ลบไฟล์',
        computing: 'กำลังคำนวณ...',
        resultsLabel: 'ผลลัพธ์แฮช',
        resultsHintText: 'ผลลัพธ์จะแสดงทันทีที่พิมพ์',
        resultsHintFile: 'เลือกไฟล์เพื่อเริ่มคำนวณ',
        compareLabel: 'ตรวจสอบ Checksum',
        compareHint: 'ไม่สนตัวพิมพ์เล็ก-ใหญ่',
        comparePlaceholder: 'วางแฮชที่คาดไว้ เช่น ค่า SHA-256 จากหน้าดาวน์โหลด...',
        matchWith: 'ตรงกับ',
        mismatch: 'ไม่ตรงกับแฮชตัวไหนเลย',
        copied: 'คัดลอกเรียบร้อย',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้งนะ',
        copyAria: 'คัดลอกค่า',
        fileError: 'อ่านไฟล์ไม่สำเร็จ ลองใหม่อีกครั้งนะ',
        securityNote: 'MD5 และ SHA-1 ไม่ปลอดภัยสำหรับงานเข้ารหัสแล้ว เหมาะกับการตรวจสอบความถูกต้องของไฟล์ทั่วไปเท่านั้น ถ้างานต้องการความปลอดภัยแนะนำ SHA-256 ขึ้นไป',
    },
    en: {
        kicker: 'HASH · CHECKSUM',
        title: 'Hash Generator',
        subtitle: 'Compute MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests from text or files — instantly, entirely in your browser. Nothing ever leaves your device.',
        tabText: 'Text',
        tabFile: 'File',
        textLabel: 'Input text',
        textPlaceholder: 'Type or paste text here — hashes update live...',
        chars: 'characters',
        clear: 'Clear',
        fileLabel: 'Source file',
        dropTitle: 'Drop a file here, or click to browse',
        dropHint: 'Files are read locally — nothing is uploaded',
        chooseFile: 'Choose file',
        removeFile: 'Remove file',
        computing: 'Computing...',
        resultsLabel: 'Digests',
        resultsHintText: 'Results appear as you type',
        resultsHintFile: 'Pick a file to compute its hashes',
        compareLabel: 'Verify checksum',
        compareHint: 'case-insensitive',
        comparePlaceholder: 'Paste an expected hash, e.g. the SHA-256 from a download page...',
        matchWith: 'Matches',
        mismatch: 'No digest matches',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed — please try again',
        copyAria: 'Copy',
        fileError: 'Could not read the file — please try again',
        securityNote: 'MD5 and SHA-1 are no longer secure for cryptographic use — fine for casual integrity checks. Prefer SHA-256 or stronger when security matters.',
    },
} as const;

function toHex(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
        out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    const units = ['KB', 'MB', 'GB'];
    let v = n / 1024;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

export default function HashGenerator() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [tab, setTab] = useState<'text' | 'file'>('text');
    const [caseMode, setCaseMode] = useState<'lower' | 'upper'>('lower');
    const [compare, setCompare] = useState('');

    // Text tab
    const [text, setText] = useState('');
    const [textDigests, setTextDigests] = useState<DigestMap>({});
    const textRun = useRef(0);

    // File tab
    const [file, setFile] = useState<{ name: string; size: number } | null>(null);
    const [fileDigests, setFileDigests] = useState<DigestMap>({});
    const [fileBusy, setFileBusy] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRun = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Live text hashing
    useEffect(() => {
        const run = ++textRun.current;
        if (!text) {
            setTextDigests({});
            return;
        }
        (async () => {
            try {
                const bytes = new TextEncoder().encode(text);
                const next: DigestMap = { MD5: md5Hex(bytes) };
                for (const algo of SHA_ALGOS) {
                    next[algo] = toHex(await crypto.subtle.digest(algo, bytes));
                }
                if (textRun.current === run) setTextDigests(next);
            } catch {
                /* ignore — stale run or unsupported algo */
            }
        })();
    }, [text]);

    const processFile = async (f: File) => {
        const run = ++fileRun.current;
        setFile({ name: f.name, size: f.size });
        setFileDigests({});
        setFileBusy(true);
        try {
            const buf = await f.arrayBuffer();
            if (fileRun.current !== run) return;
            const bytes = new Uint8Array(buf);
            for (const algo of ALGOS) {
                // Yield to the event loop so the spinner can paint between algorithms
                await new Promise((r) => setTimeout(r, 20));
                if (fileRun.current !== run) return;
                const hex = algo === 'MD5' ? md5Hex(bytes) : toHex(await crypto.subtle.digest(algo, buf));
                if (fileRun.current !== run) return;
                setFileDigests((prev) => ({ ...prev, [algo]: hex }));
            }
        } catch {
            if (fileRun.current === run) toast.error(s.fileError);
        } finally {
            if (fileRun.current === run) setFileBusy(false);
        }
    };

    const clearFile = () => {
        fileRun.current += 1;
        setFile(null);
        setFileDigests({});
        setFileBusy(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const copyDigest = async (algo: Algo, hex: string) => {
        try {
            await navigator.clipboard.writeText(caseMode === 'upper' ? hex.toUpperCase() : hex);
            toast.success(`${s.copied} (${algo})`);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const digests = tab === 'text' ? textDigests : fileDigests;
    const allDone = ALGOS.every((a) => Boolean(digests[a]));
    const normalizedCompare = compare.trim().toLowerCase();
    const matchedAlgo = normalizedCompare && allDone
        ? ALGOS.find((a) => digests[a] === normalizedCompare) ?? null
        : null;
    const showBadge = Boolean(normalizedCompare) && allDone;

    return (
        <ToolShell
            icon={<Hash className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="wide"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <SegmentedControl<'text' | 'file'>
                    options={[
                        { value: 'text', label: s.tabText },
                        { value: 'file', label: s.tabFile },
                    ]}
                    value={tab}
                    onChange={setTab}
                />
                <SegmentedControl<'lower' | 'upper'>
                    options={[
                        { value: 'lower', label: 'abc' },
                        { value: 'upper', label: 'ABC' },
                    ]}
                    value={caseMode}
                    onChange={setCaseMode}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 items-start">
                {/* ─── Input side ─── */}
                <ToolCard>
                    {tab === 'text' ? (
                        <div>
                            <div className="flex items-center justify-between mb-2 gap-3">
                                <label
                                    htmlFor="hash-text-input"
                                    className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[var(--color-ink-2)]"
                                >
                                    {s.textLabel}
                                </label>
                                <div className="flex items-center gap-2">
                                    {text.length > 0 && (
                                        <span className="text-[11.5px] text-[var(--color-ink-3)] tabular-nums">
                                            {text.length.toLocaleString()} {s.chars}
                                        </span>
                                    )}
                                    <GhostButton tone="danger" onClick={() => setText('')} disabled={!text}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {s.clear}
                                    </GhostButton>
                                </div>
                            </div>
                            <TextArea
                                id="hash-text-input"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={s.textPlaceholder}
                                rows={11}
                                spellCheck={false}
                                className="font-mono text-[13px] leading-relaxed"
                            />
                        </div>
                    ) : (
                        <div>
                            <FieldLabel>{s.fileLabel}</FieldLabel>
                            <div
                                role="button"
                                tabIndex={0}
                                aria-label={s.dropTitle}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    const dropped = e.dataTransfer.files?.[0];
                                    if (dropped) processFile(dropped);
                                }}
                                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors duration-300 ${
                                    dragOver
                                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                                        : 'border-[var(--color-line-strong)] bg-white hover:border-[var(--color-ink-2)]'
                                }`}
                            >
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-ink-3)]">
                                    <UploadCloud className="w-6 h-6" strokeWidth={1.9} />
                                </span>
                                <p className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                                    {s.dropTitle}
                                </p>
                                <p className="text-[12px] text-[var(--color-ink-3)]">{s.dropHint}</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                aria-label={s.chooseFile}
                                onChange={(e) => {
                                    const picked = e.target.files?.[0];
                                    e.target.value = '';
                                    if (picked) processFile(picked);
                                }}
                            />

                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: EASE }}
                                    className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3"
                                >
                                    <FileText className="w-4 h-4 text-[var(--color-ink-3)] flex-shrink-0" strokeWidth={1.9} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)] truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-[11.5px] text-[var(--color-ink-3)] tabular-nums">
                                            {formatBytes(file.size)}
                                        </p>
                                    </div>
                                    {fileBusy && (
                                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--color-ink-3)] flex-shrink-0">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            {s.computing}
                                        </span>
                                    )}
                                    <button
                                        onClick={clearFile}
                                        aria-label={s.removeFile}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-ink-3)] hover:text-[#d62828] hover:bg-[#fde5e5] transition-colors duration-200 flex-shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" strokeWidth={2.2} />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </ToolCard>

                {/* ─── Results side ─── */}
                <ToolCard>
                    <div className="mb-6">
                        <FieldLabel hint={s.compareHint}>{s.compareLabel}</FieldLabel>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <TextInput
                                    value={compare}
                                    onChange={(e) => setCompare(e.target.value)}
                                    placeholder={s.comparePlaceholder}
                                    spellCheck={false}
                                    autoComplete="off"
                                    className="font-mono text-[12.5px]"
                                />
                            </div>
                            {showBadge && (
                                <motion.span
                                    key={matchedAlgo ?? 'mismatch'}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-semibold tracking-[-0.01em] flex-shrink-0 self-start sm:self-auto ${
                                        matchedAlgo
                                            ? 'bg-[#e7f3ea] text-[#3d6a4a]'
                                            : 'bg-[#fde5e5] text-[#d62828]'
                                    }`}
                                >
                                    {matchedAlgo ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.1} />
                                            {s.matchWith} {matchedAlgo}
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" strokeWidth={2.1} />
                                            {s.mismatch}
                                        </>
                                    )}
                                </motion.span>
                            )}
                        </div>
                    </div>

                    <FieldLabel hint={tab === 'text' ? (text ? undefined : s.resultsHintText) : (file ? undefined : s.resultsHintFile)}>
                        {s.resultsLabel}
                    </FieldLabel>
                    <div className="space-y-2.5">
                        {ALGOS.map((algo) => {
                            const hex = digests[algo];
                            const display = hex ? (caseMode === 'upper' ? hex.toUpperCase() : hex) : null;
                            const pending = tab === 'file' && fileBusy && !hex && Boolean(file);
                            const matched = matchedAlgo === algo;
                            return (
                                <div
                                    key={algo}
                                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-300 ${
                                        matched
                                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                                            : 'border-[var(--color-line)] bg-white'
                                    }`}
                                >
                                    <span className="w-[72px] pt-0.5 flex-shrink-0 font-mono text-[11px] font-semibold tracking-[0.08em] text-[var(--color-ink-3)]">
                                        {algo}
                                    </span>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        {pending ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-ink-4)]" />
                                        ) : display ? (
                                            <code className="font-mono text-[12.5px] leading-relaxed text-[var(--color-ink-2)] break-all">
                                                {display}
                                            </code>
                                        ) : (
                                            <span className="text-[12.5px] text-[var(--color-ink-4)]">—</span>
                                        )}
                                    </div>
                                    {matched && (
                                        <CheckCircle2
                                            className="w-4 h-4 mt-1 text-[#3d6a4a] flex-shrink-0"
                                            strokeWidth={2.1}
                                        />
                                    )}
                                    <button
                                        onClick={() => hex && copyDigest(algo, hex)}
                                        disabled={!hex}
                                        aria-label={`${s.copyAria} ${algo}`}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
                                    >
                                        <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <p className="mt-5 text-[11.5px] leading-relaxed text-[var(--color-ink-4)]">
                        {s.securityNote}
                    </p>
                </ToolCard>
            </div>
        </ToolShell>
    );
}
