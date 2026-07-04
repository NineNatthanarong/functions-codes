'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, ShieldAlert, ShieldCheck, FileImage, RefreshCw, MapPin, Camera, CalendarDays, AppWindow, Ruler, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

type Found = {
    gps?: string;
    camera?: string;
    date?: string;
    software?: string;
    size?: string;
    dimensions?: string;
};

type InspectStatus = 'pending' | 'inspected' | 'uninspectable' | 'failed';

// Lightweight EXIF parser — reads JPEG APP1 / Exif segment for the fields we display.
// Doesn't import a library; keeps bundle small and the tool fully offline.
// `inspected: false` means the format couldn't be verified (PNG eXIf, WebP/HEIC EXIF,
// XMP-only metadata) — the UI must not claim the file is clean in that case.
async function inspectImage(file: File): Promise<{ meta: Found; inspected: boolean }> {
    const found: Found = {
        size: formatBytes(file.size),
    };
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);

    // Dimensions via Image element (works for any browser-supported format)
    const url = URL.createObjectURL(file);
    try {
        const img = await loadImage(url);
        found.dimensions = `${img.naturalWidth} × ${img.naturalHeight}`;
    } catch { /* ignore */ } finally {
        URL.revokeObjectURL(url);
    }

    if (view.byteLength < 4) return { meta: found, inspected: false };

    // JPEG starts with 0xFFD8 — only JPEG APP1/Exif can be inspected here
    if (view.getUint16(0) !== 0xffd8) return { meta: found, inspected: false };

    let offset = 2;
    while (offset + 4 <= view.byteLength) {
        const marker = view.getUint16(offset);
        if (marker === 0xffd9 || marker === 0xffda) break;
        if ((marker & 0xff00) !== 0xff00) break;
        const segLen = view.getUint16(offset + 2);
        if (segLen < 2) break;
        if (marker === 0xffe1 && offset + 8 <= view.byteLength) {
            const exifIdent = readString(view, offset + 4, 4);
            if (exifIdent === 'Exif') {
                try {
                    parseExif(view, offset + 10, segLen - 8, found);
                } catch { /* truncated EXIF — keep whatever was parsed */ }
            }
        }
        offset += 2 + segLen;
    }
    return { meta: found, inspected: true };
}

function readString(v: DataView, o: number, n: number) {
    let s = '';
    for (let i = 0; i < n; i++) s += String.fromCharCode(v.getUint8(o + i));
    return s;
}

function formatBytes(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
        const img = new window.Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
    });
}

function parseExif(view: DataView, tiffStart: number, len: number, found: Found) {
    if (tiffStart + 8 > view.byteLength) return;
    const byteOrder = view.getUint16(tiffStart);
    const little = byteOrder === 0x4949;
    const get16 = (o: number) => view.getUint16(o, little);
    const get32 = (o: number) => view.getUint32(o, little);

    if (get16(tiffStart + 2) !== 0x002a) return;
    const ifd0 = tiffStart + get32(tiffStart + 4);
    if (ifd0 + 2 > view.byteLength) return;

    const tags: Record<number, string> = {};
    let exifIfd = 0;
    let gpsIfd = 0;

    const readIFD = (start: number, into: Record<number, string>) => {
        if (start + 2 > view.byteLength) return;
        const count = get16(start);
        for (let i = 0; i < count; i++) {
            const entry = start + 2 + i * 12;
            if (entry + 12 > view.byteLength || entry + 12 > tiffStart + len) return;
            const tag = get16(entry);
            const type = get16(entry + 2);
            const cnt = get32(entry + 4);
            const valueOffset = entry + 8;

            if (tag === 0x8769) exifIfd = tiffStart + get32(valueOffset);
            else if (tag === 0x8825) gpsIfd = tiffStart + get32(valueOffset);
            else if (type === 2) {
                let strOffset = cnt > 4 ? tiffStart + get32(valueOffset) : valueOffset;
                let s = '';
                for (let k = 0; k < cnt && strOffset + k < view.byteLength; k++) {
                    const c = view.getUint8(strOffset + k);
                    if (c === 0) break;
                    s += String.fromCharCode(c);
                }
                into[tag] = s;
            }
        }
    };

    readIFD(ifd0, tags);
    if (exifIfd) readIFD(exifIfd, tags);

    // Make + Model = camera
    const make = tags[0x010f];
    const model = tags[0x0110];
    if (make || model) found.camera = [make, model].filter(Boolean).join(' ').trim();

    // Software
    if (tags[0x0131]) found.software = tags[0x0131];

    // DateTime
    found.date = tags[0x9003] || tags[0x0132];

    // GPS — decode lat/lon so the user sees exactly what location is embedded
    if (gpsIfd) {
        found.gps = '✓';
        try {
            const readRationals = (entry: number): number[] | null => {
                if (get16(entry + 2) !== 5) return null; // unsigned rational
                const cnt = get32(entry + 4);
                if (cnt < 1 || cnt > 3) return null;
                const dataOffset = tiffStart + get32(entry + 8);
                if (dataOffset + cnt * 8 > view.byteLength) return null;
                const out: number[] = [];
                for (let i = 0; i < cnt; i++) {
                    const den = get32(dataOffset + i * 8 + 4);
                    out.push(den ? get32(dataOffset + i * 8) / den : 0);
                }
                return out;
            };
            if (gpsIfd + 2 <= view.byteLength) {
                const count = get16(gpsIfd);
                let latRef = '';
                let lonRef = '';
                let lat: number[] | null = null;
                let lon: number[] | null = null;
                for (let i = 0; i < count; i++) {
                    const entry = gpsIfd + 2 + i * 12;
                    if (entry + 12 > view.byteLength) break;
                    const tag = get16(entry);
                    if (tag === 1) latRef = String.fromCharCode(view.getUint8(entry + 8));
                    else if (tag === 3) lonRef = String.fromCharCode(view.getUint8(entry + 8));
                    else if (tag === 2) lat = readRationals(entry);
                    else if (tag === 4) lon = readRationals(entry);
                }
                if (lat && lon) {
                    const toDeg = (v: number[]) => v[0] + (v[1] ?? 0) / 60 + (v[2] ?? 0) / 3600;
                    const latD = (latRef === 'S' ? -1 : 1) * toDeg(lat);
                    const lonD = (lonRef === 'W' ? -1 : 1) * toDeg(lon);
                    if (Number.isFinite(latD) && Number.isFinite(lonD)) {
                        found.gps = `${latD.toFixed(5)}, ${lonD.toFixed(5)}`;
                    }
                }
            }
        } catch { /* keep the ✓ flag */ }
    }
}

export default function ExifStripperPage() {
    const { locale, t } = useLanguage();
    const tt = t.pages.exif;
    const s = locale === 'th' ? {
        inspecting: 'กำลังตรวจสอบ...',
        cantInspect: 'ตรวจสอบฟอร์แมตนี้ไม่ได้ — ลบข้อมูลไว้ก่อนเพื่อความปลอดภัย',
        inspectFailed: 'ตรวจสอบไฟล์ไม่สำเร็จ — ลบข้อมูลไว้ก่อนเพื่อความปลอดภัย',
        resetAria: 'เริ่มใหม่',
        previewAlt: 'ตัวอย่างรูปที่อัปโหลด',
        pasteHint: 'หรือวางรูปจากคลิปบอร์ด (Ctrl+V)',
        newSize: 'ขนาดใหม่',
    } : {
        inspecting: 'Inspecting...',
        cantInspect: 'Cannot verify this format — strip anyway to be safe.',
        inspectFailed: 'Could not inspect this file — strip anyway to be safe.',
        resetAria: 'Start over',
        previewAlt: 'Uploaded image preview',
        pasteHint: 'or paste an image (Ctrl+V)',
        newSize: 'New size',
    };
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [found, setFound] = useState<Found | null>(null);
    const [inspectStatus, setInspectStatus] = useState<InspectStatus>('pending');
    const [stripping, setStripping] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inspectTokenRef = useRef(0);

    const onUpload = async (f: File) => {
        if (!f.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage);
            return;
        }
        const token = ++inspectTokenRef.current;
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageUrl(URL.createObjectURL(f));
        setFile(f);
        setFound({ size: formatBytes(f.size) });
        setInspectStatus('pending');
        try {
            const { meta, inspected } = await inspectImage(f);
            if (inspectTokenRef.current !== token) return; // a newer upload or reset won
            setFound(meta);
            setInspectStatus(inspected ? 'inspected' : 'uninspectable');
        } catch (err) {
            console.error(err);
            if (inspectTokenRef.current !== token) return;
            setInspectStatus('failed');
        }
    };

    const reset = () => {
        inspectTokenRef.current++; // cancel any in-flight inspection
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
        setFile(null);
        setFound(null);
        setInspectStatus('pending');
    };

    const onUploadRef = useRef(onUpload);
    const resetRef = useRef(reset);
    useEffect(() => {
        onUploadRef.current = onUpload;
        resetRef.current = reset;
    });

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'));
            if (f) {
                e.preventDefault();
                onUploadRef.current(f);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') resetRef.current();
        };
        window.addEventListener('paste', onPaste);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('paste', onPaste);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    const strip = async () => {
        if (!file || !imageUrl) return;
        setStripping(true);
        try {
            const img = await loadImage(imageUrl);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas');
            ctx.drawImage(img, 0, 0);

            // Re-encode through canvas — strips ALL metadata.
            // Alpha-capable sources (PNG/WebP/GIF/…) go out as PNG so transparency isn't flattened.
            const keepAlpha = /png|webp|gif|avif|svg/i.test(file.type);
            const mime = keepAlpha ? 'image/png' : 'image/jpeg';
            canvas.toBlob((blob) => {
                if (!blob) {
                    toast.error(tt.failToast);
                    setStripping(false);
                    return;
                }
                const link = document.createElement('a');
                link.download = `cleaned_${file.name.replace(/\.[^.]+$/, '')}.${keepAlpha ? 'png' : 'jpg'}`;
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                toast.success(tt.successToast, { description: `${s.newSize}: ${formatBytes(blob.size)}` });
                setStripping(false);
            }, mime, 0.95);
        } catch (err) {
            console.error(err);
            toast.error(tt.failToast);
            setStripping(false);
        }
    };

    const sensitive = !!(found?.gps || found?.camera || found?.date || found?.software);

    return (
        <ToolShell
            icon={<ShieldCheck className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="EXIF"
            width="wide"
        >
            <AnimatePresence mode="wait">
                {!imageUrl ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="max-w-xl mx-auto"
                    >
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label={tt.uploadTitle}
                            className={`cursor-pointer rounded-3xl border-2 border-dashed bg-white transition-all p-12 text-center group ${dragActive
                                ? 'border-[var(--color-wine-600)] bg-[var(--color-wine-50)]/50'
                                : 'border-[var(--color-wine-200)] hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragActive(false);
                                const f = e.dataTransfer.files?.[0];
                                if (f) onUpload(f);
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) onUpload(f);
                                    e.target.value = '';
                                }}
                            />
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-16 h-16 bg-[var(--color-wine-100)] rounded-2xl flex items-center justify-center mb-4 mx-auto text-[var(--color-wine-700)] group-hover:bg-[var(--color-wine-700)] group-hover:text-[var(--color-cream)] transition-colors"
                            >
                                <Upload className="w-7 h-7" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-[var(--color-wine-700)] mb-1.5">{tt.uploadTitle}</h3>
                            <p className="text-[var(--color-smoke-600)] text-sm">{tt.uploadHint}</p>
                            <p className="text-[var(--color-smoke-600)]/70 text-xs mt-1">{s.pasteHint}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-6"
                    >
                        <ToolCard>
                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-600)] font-semibold">
                                    <FileImage className="w-3.5 h-3.5" />
                                    {file?.name}
                                </span>
                                <button onClick={reset} aria-label={s.resetAria} title={s.resetAria} className="p-1.5 rounded-lg text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)]">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--color-wine-50)] border border-[var(--color-wine-100)]">
                                <Image src={imageUrl} alt={s.previewAlt} fill className="object-contain p-3" unoptimized />
                            </div>
                        </ToolCard>

                        <ToolCard>
                            <div className={`mb-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold ${sensitive
                                ? 'bg-[#fbe3e7] border-[#e6b3bd] text-[#a4364c]'
                                : inspectStatus === 'pending'
                                    ? 'bg-[var(--color-wine-50)] border-[var(--color-wine-100)] text-[var(--color-smoke-600)]'
                                    : inspectStatus === 'inspected'
                                        ? 'bg-[#dbe8d3] border-[#aac39e] text-[#3d6a4a]'
                                        : 'bg-[#faf0dc] border-[#e3cd9e] text-[#8a6420]'
                                }`}>
                                {sensitive
                                    ? <ShieldAlert className="w-3.5 h-3.5" />
                                    : inspectStatus === 'pending'
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : inspectStatus === 'inspected'
                                            ? <ShieldCheck className="w-3.5 h-3.5" />
                                            : <ShieldAlert className="w-3.5 h-3.5" />}
                                {sensitive
                                    ? tt.warningTitle
                                    : inspectStatus === 'pending'
                                        ? s.inspecting
                                        : inspectStatus === 'inspected'
                                            ? tt.noMetadata
                                            : inspectStatus === 'failed'
                                                ? s.inspectFailed
                                                : s.cantInspect}
                            </div>

                            <h3 className="text-base font-semibold text-[var(--color-wine-700)] mb-3">{tt.metadataTitle}</h3>

                            <div className="space-y-2 mb-6">
                                <Row icon={<Ruler className="w-3.5 h-3.5" />} label={tt.dimensions} value={found?.dimensions} />
                                <Row icon={<FileImage className="w-3.5 h-3.5" />} label={tt.size} value={found?.size} />
                                <Row icon={<MapPin className="w-3.5 h-3.5" />} label={tt.gps} value={found?.gps} dangerous />
                                <Row icon={<Camera className="w-3.5 h-3.5" />} label={tt.camera} value={found?.camera} dangerous />
                                <Row icon={<CalendarDays className="w-3.5 h-3.5" />} label={tt.date} value={found?.date} dangerous />
                                <Row icon={<AppWindow className="w-3.5 h-3.5" />} label={tt.software} value={found?.software} dangerous />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <SecondaryButton onClick={reset} className="flex-1 py-3.5">
                                    {tt.keepFile}
                                </SecondaryButton>
                                <PrimaryButton onClick={strip} disabled={stripping} className="flex-1 py-3.5">
                                    <Download className="w-4 h-4" />
                                    {stripping ? tt.stripping : tt.strip}
                                </PrimaryButton>
                            </div>
                        </ToolCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </ToolShell>
    );
}

function Row({ icon, label, value, dangerous = false }: { icon: React.ReactNode; label: string; value?: string; dangerous?: boolean }) {
    const has = !!value;
    return (
        <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border ${has && dangerous
            ? 'bg-[#fbe3e7] border-[#f0c8d0]'
            : 'bg-[var(--color-wine-50)] border-[var(--color-wine-100)]'
            }`}>
            <div className="flex items-center gap-2.5 text-[var(--color-wine-700)] min-w-0">
                {icon}
                <span className="text-[13px] font-medium">{label}</span>
            </div>
            <span className={`text-[13px] font-mono truncate ${has ? (dangerous ? 'text-[#a4364c]' : 'text-[var(--color-wine-800)]') : 'text-[var(--color-smoke-600)]/60'}`}>
                {value ?? '—'}
            </span>
        </div>
    );
}
