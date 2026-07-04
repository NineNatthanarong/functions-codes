'use client';

import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Binary,
    Copy,
    Trash2,
    UploadCloud,
    Download,
    AlertCircle,
    CheckCircle2,
    FileText,
    Link2,
    ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, {
    ToolCard,
    GhostButton,
    PrimaryButton,
    SecondaryButton,
    SegmentedControl,
    FieldLabel,
    TextInput,
} from '@/components/ToolShell';

const EASE = [0.25, 1, 0.5, 1] as const;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB soft limit — keeps the tab responsive

/* ─────────────────────── base64 helpers (unicode-safe) ─────────────────────── */

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        const sub = bytes.subarray(i, i + CHUNK);
        let part = '';
        for (let j = 0; j < sub.length; j++) part += String.fromCharCode(sub[j]);
        binary += part;
    }
    return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function encodeText(text: string, urlSafe: boolean): string {
    const b64 = bytesToBase64(new TextEncoder().encode(text));
    return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
}

/** Normalize any base64-ish input (standard, URL-safe, or data URL) to padded standard base64. Throws on invalid input. */
function normalizeBase64(raw: string): string {
    let payload = raw.trim();
    if (payload.startsWith('data:')) {
        const comma = payload.indexOf(',');
        if (comma === -1) throw new Error('invalid-base64');
        const header = payload.slice(5, comma);
        if (!/;base64$/i.test(header)) throw new Error('invalid-base64');
        payload = payload.slice(comma + 1);
    }
    let s = payload.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('invalid-base64');
    const rem = s.length % 4;
    if (rem === 1) throw new Error('invalid-base64');
    if (rem > 0) s += '='.repeat(4 - rem);
    return s;
}

function decodeBase64Loose(raw: string): Uint8Array {
    return base64ToBytes(normalizeBase64(raw));
}

function base64ByteLength(padded: string): number {
    if (!padded) return 0;
    const padMatch = padded.match(/=+$/);
    const pad = padMatch ? padMatch[0].length : 0;
    return (padded.length / 4) * 3 - pad;
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const MIME_EXT: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico',
    'application/pdf': 'pdf',
    'application/json': 'json',
    'application/zip': 'zip',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'video/mp4': 'mp4',
};

/* ─────────────────────────────── i18n strings ─────────────────────────────── */

const STRINGS = {
    th: {
        title: 'เข้ารหัส / ถอดรหัส Base64',
        subtitle:
            'แปลงข้อความและไฟล์เป็น Base64 แบบสองทางทันที รองรับภาษาไทยเต็มรูปแบบ ทุกอย่างทำงานในเบราว์เซอร์ของคุณ ไม่มีการส่งข้อมูลขึ้นเซิร์ฟเวอร์',
        tabText: 'ข้อความ',
        tabFile: 'ไฟล์',
        variantStandard: 'มาตรฐาน (+/)',
        variantUrlSafe: 'URL-safe (-_)',
        variantHint: 'พิมพ์ฝั่งไหนก็ได้ อีกฝั่งจะอัปเดตให้ทันที',
        plainLabel: 'ข้อความธรรมดา',
        base64Label: 'Base64',
        plainPlaceholder: 'พิมพ์หรือวางข้อความที่นี่ เช่น สวัสดีชาวโลก...',
        base64Placeholder: 'วาง Base64 ที่นี่ ระบบจะถอดรหัสให้ทันที...',
        chars: 'ตัวอักษร',
        copy: 'คัดลอก',
        clear: 'ล้างทั้งหมด',
        copied: 'คัดลอกเรียบร้อย',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้งนะ',
        errInvalidBase64: 'Base64 ไม่ถูกต้อง — ตรวจสอบตัวอักษรหรือความยาวอีกครั้ง',
        errNotUtf8: 'ถอดรหัสได้ แต่ไม่ใช่ข้อความ UTF-8 — ลองสลับไปแท็บไฟล์เพื่อดาวน์โหลดแทน',
        validBase64: 'Base64 ถูกต้อง',
        encodeCardTitle: 'ไฟล์ → Base64',
        encodeCardDesc: 'อัปโหลดไฟล์เพื่อแปลงเป็น Base64 หรือ Data URL เช่น ฝังรูปลงใน CSS',
        decodeCardTitle: 'Base64 → ไฟล์',
        decodeCardDesc: 'วาง Base64 หรือ Data URL จาก API แล้วดาวน์โหลดกลับเป็นไฟล์',
        dropHint: 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์',
        dropSub: 'ไฟล์ไม่ถูกอัปโหลดไปไหน ทุกอย่างอยู่ในเครื่องของคุณ',
        dropZoneAria: 'อัปโหลดไฟล์เพื่อแปลงเป็น Base64',
        fileTooBig: 'ไฟล์ใหญ่เกิน 25 MB — เบราว์เซอร์อาจค้างได้ ลองไฟล์ที่เล็กกว่านี้นะ',
        fileReadError: 'อ่านไฟล์ไม่สำเร็จ ลองอีกครั้งนะ',
        fileEncoded: 'แปลงไฟล์เป็น Base64 เรียบร้อย',
        fileType: 'ชนิดไฟล์',
        fileSize: 'ขนาด',
        base64Length: 'ความยาว Base64',
        copyBase64: 'คัดลอก Base64',
        copyDataUrl: 'คัดลอก Data URL',
        removeFile: 'ลบไฟล์',
        imagePreview: 'พรีวิวรูปภาพ',
        pasteLabel: 'วาง Base64 หรือ Data URL',
        pastePlaceholder: 'วาง Base64 หรือ data:image/png;base64,... ที่นี่',
        decodedReady: 'ถอดรหัสสำเร็จ พร้อมดาวน์โหลด',
        fileNameLabel: 'ชื่อไฟล์',
        downloadFile: 'ดาวน์โหลดไฟล์',
        downloaded: 'เริ่มดาวน์โหลดแล้ว',
    },
    en: {
        title: 'Base64 Encoder / Decoder',
        subtitle:
            'Convert text and files to Base64 with instant two-way conversion. Full unicode support, including Thai. Everything runs in your browser — nothing is uploaded.',
        tabText: 'Text',
        tabFile: 'File',
        variantStandard: 'Standard (+/)',
        variantUrlSafe: 'URL-safe (-_)',
        variantHint: 'Type on either side — the other updates live',
        plainLabel: 'Plain text',
        base64Label: 'Base64',
        plainPlaceholder: 'Type or paste text here, e.g. Hello world...',
        base64Placeholder: 'Paste Base64 here — it decodes instantly...',
        chars: 'chars',
        copy: 'Copy',
        clear: 'Clear all',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed — please try again',
        errInvalidBase64: 'Invalid Base64 — check the characters or length',
        errNotUtf8: 'Decoded, but not UTF-8 text — try the File tab to download it instead',
        validBase64: 'Valid Base64',
        encodeCardTitle: 'File → Base64',
        encodeCardDesc: 'Upload a file to get its Base64 string or Data URL, e.g. for embedding an image in CSS',
        decodeCardTitle: 'Base64 → File',
        decodeCardDesc: 'Paste Base64 or a Data URL from an API payload and download it back as a file',
        dropHint: 'Drag and drop a file, or click to browse',
        dropSub: 'Your file never leaves this device',
        dropZoneAria: 'Upload a file to encode as Base64',
        fileTooBig: 'File is over 25 MB — the browser may freeze. Try a smaller file.',
        fileReadError: 'Could not read the file — please try again',
        fileEncoded: 'File encoded to Base64',
        fileType: 'MIME type',
        fileSize: 'Size',
        base64Length: 'Base64 length',
        copyBase64: 'Copy Base64',
        copyDataUrl: 'Copy Data URL',
        removeFile: 'Remove file',
        imagePreview: 'Image preview',
        pasteLabel: 'Paste Base64 or Data URL',
        pastePlaceholder: 'Paste Base64 or data:image/png;base64,... here',
        decodedReady: 'Decoded successfully — ready to download',
        fileNameLabel: 'File name',
        downloadFile: 'Download file',
        downloaded: 'Download started',
    },
} as const;

/* ────────────────────────────────── page ────────────────────────────────── */

type Tab = 'text' | 'file';
type Variant = 'standard' | 'urlsafe';
type DecodeError = 'base64' | 'utf8' | null;

type EncodedFile = {
    name: string;
    size: number;
    mime: string;
    b64: string;
    dataUrl: string;
};

type ParsedPaste =
    | { ok: true; mime: string; b64: string; size: number }
    | { ok: false }
    | null;

export default function Base64Tool() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [tab, setTab] = useState<Tab>('text');

    /* ── text tab ── */
    const [plain, setPlain] = useState('');
    const [b64, setB64] = useState('');
    const [variant, setVariant] = useState<Variant>('standard');
    const [decodeError, setDecodeError] = useState<DecodeError>(null);

    const handlePlainChange = (value: string) => {
        setPlain(value);
        setB64(value ? encodeText(value, variant === 'urlsafe') : '');
        setDecodeError(null);
    };

    const handleB64Change = (value: string) => {
        setB64(value);
        if (!value.trim()) {
            setPlain('');
            setDecodeError(null);
            return;
        }
        try {
            const bytes = decodeBase64Loose(value);
            try {
                setPlain(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
                setDecodeError(null);
            } catch {
                setDecodeError('utf8');
            }
        } catch {
            setDecodeError('base64');
        }
    };

    const handleVariantChange = (v: Variant) => {
        setVariant(v);
        if (plain && !decodeError) {
            setB64(encodeText(plain, v === 'urlsafe'));
        }
    };

    const clearText = () => {
        setPlain('');
        setB64('');
        setDecodeError(null);
    };

    /* ── file tab: encode ── */
    const [encoded, setEncoded] = useState<EncodedFile | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (file.size > MAX_FILE_BYTES) {
            toast.error(s.fileTooBig);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                toast.error(s.fileReadError);
                return;
            }
            const comma = result.indexOf(',');
            const payload = result.slice(comma + 1);
            const mime = file.type || 'application/octet-stream';
            setEncoded({
                name: file.name,
                size: file.size,
                mime,
                b64: payload,
                dataUrl: `data:${mime};base64,${payload}`,
            });
            toast.success(s.fileEncoded);
        };
        reader.onerror = () => toast.error(s.fileReadError);
        reader.readAsDataURL(file);
    };

    /* ── file tab: decode ── */
    const [pasteInput, setPasteInput] = useState('');
    const [fileName, setFileName] = useState('');

    const parsed = useMemo<ParsedPaste>(() => {
        if (!pasteInput.trim()) return null;
        try {
            const raw = pasteInput.trim();
            let mime = 'application/octet-stream';
            if (raw.startsWith('data:')) {
                const comma = raw.indexOf(',');
                if (comma > 5) {
                    const header = raw.slice(5, comma).replace(/;base64$/i, '');
                    if (header) mime = header;
                }
            }
            const normalized = normalizeBase64(raw);
            if (!normalized) return null;
            return { ok: true, mime, b64: normalized, size: base64ByteLength(normalized) };
        } catch {
            return { ok: false };
        }
    }, [pasteInput]);

    const defaultDownloadName = useMemo(() => {
        if (!parsed || !parsed.ok) return 'decoded.bin';
        return `decoded.${MIME_EXT[parsed.mime] ?? 'bin'}`;
    }, [parsed]);

    const downloadDecoded = () => {
        if (!parsed || !parsed.ok) return;
        try {
            const bytes = base64ToBytes(parsed.b64);
            const blob = new Blob([new Uint8Array(bytes)], { type: parsed.mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.trim() || defaultDownloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(s.downloaded);
        } catch {
            toast.error(s.errInvalidBase64);
        }
    };

    /* ── shared ── */
    const copyValue = async (value: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            toast.success(s.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const textareaBase =
        'flex-grow w-full p-4 rounded-2xl border-[1.5px] transition-all resize-none font-mono text-[13px] leading-relaxed bg-white focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]';

    return (
        <ToolShell
            icon={<Binary className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker="BASE64"
            width="xwide"
            actions={
                <SegmentedControl<Tab>
                    options={[
                        { value: 'text', label: s.tabText },
                        { value: 'file', label: s.tabFile },
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            }
        >
            <AnimatePresence mode="wait">
                {tab === 'text' ? (
                    <motion.div
                        key="text"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: EASE }}
                    >
                        {/* controls row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-3">
                                <SegmentedControl<Variant>
                                    options={[
                                        { value: 'standard', label: s.variantStandard },
                                        { value: 'urlsafe', label: s.variantUrlSafe },
                                    ]}
                                    value={variant}
                                    onChange={handleVariantChange}
                                />
                                <span className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-[var(--color-ink-3)]">
                                    <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2} />
                                    {s.variantHint}
                                </span>
                            </div>
                            <GhostButton tone="danger" onClick={clearText} disabled={!plain && !b64}>
                                <Trash2 className="w-3.5 h-3.5" />
                                {s.clear}
                            </GhostButton>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* plain text side */}
                            <div className="flex flex-col h-[420px] sm:h-[480px]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[var(--color-ink)]">
                                        <FileText className="w-3.5 h-3.5" />
                                        {s.plainLabel}
                                        <span className="font-normal text-[var(--color-ink-4)]">
                                            {plain.length.toLocaleString()} {s.chars}
                                        </span>
                                    </span>
                                    <GhostButton onClick={() => copyValue(plain)} disabled={!plain}>
                                        <Copy className="w-3.5 h-3.5" />
                                        {s.copy}
                                    </GhostButton>
                                </div>
                                <textarea
                                    value={plain}
                                    onChange={(e) => handlePlainChange(e.target.value)}
                                    placeholder={s.plainPlaceholder}
                                    spellCheck={false}
                                    className={`${textareaBase} border-[var(--color-line)] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)]`}
                                />
                            </div>

                            {/* base64 side */}
                            <div className="flex flex-col h-[420px] sm:h-[480px]">
                                <div className="flex items-center justify-between mb-3">
                                    {decodeError ? (
                                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[#d62828]">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {s.base64Label}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[var(--color-ink)]">
                                            <Binary className="w-3.5 h-3.5" />
                                            {s.base64Label}
                                            <span className="font-normal text-[var(--color-ink-4)]">
                                                {b64.length.toLocaleString()} {s.chars}
                                            </span>
                                        </span>
                                    )}
                                    <GhostButton onClick={() => copyValue(b64)} disabled={!b64 || !!decodeError}>
                                        <Copy className="w-3.5 h-3.5" />
                                        {s.copy}
                                    </GhostButton>
                                </div>
                                <textarea
                                    value={b64}
                                    onChange={(e) => handleB64Change(e.target.value)}
                                    placeholder={s.base64Placeholder}
                                    spellCheck={false}
                                    className={`${textareaBase} ${
                                        decodeError
                                            ? 'border-[#e6b3b3] text-[#a42828] bg-[#fdf5f5]'
                                            : 'border-[var(--color-line)] text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)]'
                                    }`}
                                />
                                <div className="min-h-[24px] mt-2">
                                    {decodeError && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, ease: EASE }}
                                            className="inline-flex items-start gap-1.5 text-[12.5px] text-[#d62828]"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5 mt-[1.5px] flex-shrink-0" />
                                            {decodeError === 'base64' ? s.errInvalidBase64 : s.errNotUtf8}
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="file"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start"
                    >
                        {/* ── encode card: file -> base64 ── */}
                        <ToolCard>
                            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                                {s.encodeCardTitle}
                            </h2>
                            <p className="mt-1 text-[12.5px] text-[var(--color-ink-3)] leading-[1.5]">
                                {s.encodeCardDesc}
                            </p>

                            <div
                                role="button"
                                tabIndex={0}
                                aria-label={s.dropZoneAria}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragging(true);
                                }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) handleFile(file);
                                }}
                                className={`mt-5 flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-2xl border-[1.5px] border-dashed cursor-pointer transition-colors duration-300 ${
                                    dragging
                                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                                        : 'border-[var(--color-line-strong)] bg-[var(--color-surface-2)] hover:border-[var(--color-ink-3)]'
                                }`}
                            >
                                <UploadCloud
                                    className={`w-7 h-7 ${dragging ? 'text-[var(--color-accent-deep)]' : 'text-[var(--color-ink-3)]'}`}
                                    strokeWidth={1.8}
                                />
                                <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)] text-center">
                                    {s.dropHint}
                                </p>
                                <p className="text-[12px] text-[var(--color-ink-3)] text-center">{s.dropSub}</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                aria-hidden="true"
                                tabIndex={-1}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFile(file);
                                    e.target.value = '';
                                }}
                            />

                            <AnimatePresence>
                                {encoded && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.35, ease: EASE }}
                                        className="mt-5"
                                    >
                                        {/* file meta */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]">
                                            <span className="font-semibold text-[var(--color-ink-2)] break-all">
                                                {encoded.name}
                                            </span>
                                            <span className="text-[var(--color-ink-3)]">
                                                {s.fileSize}: {formatBytes(encoded.size)}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-ink-2)] font-mono text-[11px]">
                                                {encoded.mime}
                                            </span>
                                        </div>

                                        {encoded.mime.startsWith('image/') && (
                                            <div className="mt-4">
                                                <FieldLabel>{s.imagePreview}</FieldLabel>
                                                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 flex justify-center">
                                                    {/* data URLs cannot go through next/image — this stays fully client-side */}
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={encoded.dataUrl}
                                                        alt={encoded.name}
                                                        className="max-h-48 max-w-full rounded-lg object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <FieldLabel
                                                hint={`${s.base64Length}: ${encoded.b64.length.toLocaleString()} ${s.chars}`}
                                            >
                                                Base64
                                            </FieldLabel>
                                            <textarea
                                                readOnly
                                                value={encoded.b64}
                                                spellCheck={false}
                                                className="w-full h-32 p-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] font-mono text-[11.5px] leading-relaxed text-[var(--color-ink)] resize-none focus:outline-none"
                                            />
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <PrimaryButton onClick={() => copyValue(encoded.b64)}>
                                                <Copy className="w-4 h-4" />
                                                {s.copyBase64}
                                            </PrimaryButton>
                                            <SecondaryButton onClick={() => copyValue(encoded.dataUrl)}>
                                                <Link2 className="w-4 h-4" />
                                                {s.copyDataUrl}
                                            </SecondaryButton>
                                            <GhostButton tone="danger" onClick={() => setEncoded(null)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                                {s.removeFile}
                                            </GhostButton>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ToolCard>

                        {/* ── decode card: base64 -> file ── */}
                        <ToolCard>
                            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                                {s.decodeCardTitle}
                            </h2>
                            <p className="mt-1 text-[12.5px] text-[var(--color-ink-3)] leading-[1.5]">
                                {s.decodeCardDesc}
                            </p>

                            <div className="mt-5">
                                <FieldLabel>{s.pasteLabel}</FieldLabel>
                                <textarea
                                    value={pasteInput}
                                    onChange={(e) => setPasteInput(e.target.value)}
                                    placeholder={s.pastePlaceholder}
                                    spellCheck={false}
                                    className={`w-full h-40 p-3 rounded-xl border-[1.5px] font-mono text-[11.5px] leading-relaxed resize-none transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)] ${
                                        parsed && !parsed.ok
                                            ? 'border-[#e6b3b3] text-[#a42828] bg-[#fdf5f5]'
                                            : 'border-[var(--color-line)] bg-white text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)]'
                                    }`}
                                />
                                <div className="min-h-[24px] mt-2">
                                    {parsed && !parsed.ok && (
                                        <p className="inline-flex items-start gap-1.5 text-[12.5px] text-[#d62828]">
                                            <AlertCircle className="w-3.5 h-3.5 mt-[1.5px] flex-shrink-0" />
                                            {s.errInvalidBase64}
                                        </p>
                                    )}
                                    {parsed && parsed.ok && (
                                        <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#3d6a4a]">
                                            <span className="inline-flex items-center gap-1.5 font-semibold">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {s.decodedReady}
                                            </span>
                                            <span className="text-[var(--color-ink-3)]">
                                                {s.fileSize}: {formatBytes(parsed.size)}
                                            </span>
                                            <span className="font-mono text-[11px] text-[var(--color-ink-3)]">
                                                {parsed.mime}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {parsed && parsed.ok && parsed.mime.startsWith('image/') && (
                                <div className="mt-3">
                                    <FieldLabel>{s.imagePreview}</FieldLabel>
                                    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 flex justify-center">
                                        {/* data URLs cannot go through next/image — this stays fully client-side */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`data:${parsed.mime};base64,${parsed.b64}`}
                                            alt={s.imagePreview}
                                            className="max-h-48 max-w-full rounded-lg object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <FieldLabel>{s.fileNameLabel}</FieldLabel>
                                <TextInput
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder={defaultDownloadName}
                                />
                            </div>

                            <div className="mt-5">
                                <PrimaryButton onClick={downloadDecoded} disabled={!parsed || !parsed.ok}>
                                    <Download className="w-4 h-4" />
                                    {s.downloadFile}
                                </PrimaryButton>
                            </div>
                        </ToolCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </ToolShell>
    );
}
