'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, ShieldAlert, ShieldCheck, FileImage, RefreshCw, MapPin, Camera, CalendarDays, AppWindow, Ruler } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

type Found = {
    gps?: string;
    camera?: string;
    date?: string;
    software?: string;
    size?: string;
    dimensions?: string;
};

// Lightweight EXIF parser — reads JPEG APP1 / Exif segment for the fields we display.
// Doesn't import a library; keeps bundle small and the tool fully offline.
async function inspectImage(file: File): Promise<Found> {
    const found: Found = {
        size: formatBytes(file.size),
    };
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);

    // Dimensions via Image element (works for any browser-supported format)
    try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        found.dimensions = `${img.naturalWidth} × ${img.naturalHeight}`;
        URL.revokeObjectURL(url);
    } catch { /* ignore */ }

    if (view.byteLength < 4) return found;

    // JPEG starts with 0xFFD8
    if (view.getUint16(0) !== 0xffd8) return found;

    let offset = 2;
    while (offset < view.byteLength) {
        const marker = view.getUint16(offset);
        if (marker === 0xffe1) {
            const segLen = view.getUint16(offset + 2);
            const exifIdent = readString(view, offset + 4, 4);
            if (exifIdent === 'Exif') {
                parseExif(view, offset + 10, segLen - 8, found);
            }
            offset += 2 + segLen;
        } else if ((marker & 0xff00) !== 0xff00) {
            break;
        } else if (marker === 0xffd9 || marker === 0xffda) {
            break;
        } else {
            const segLen = view.getUint16(offset + 2);
            offset += 2 + segLen;
        }
    }
    return found;
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

    // GPS — just flag "present" with hint, we don't decode rationals here
    if (gpsIfd) {
        found.gps = '✓';
    }
}

export default function ExifStripperPage() {
    const t = useT();
    const tt = t.pages.exif;
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [found, setFound] = useState<Found | null>(null);
    const [stripping, setStripping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onUpload = async (f: File) => {
        if (!f.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage);
            return;
        }
        const url = URL.createObjectURL(f);
        setImageUrl(url);
        setFile(f);
        try {
            const meta = await inspectImage(f);
            setFound(meta);
        } catch (err) {
            console.error(err);
        }
    };

    const reset = () => {
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
        setFile(null);
        setFound(null);
    };

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

            // Re-encode through canvas — strips ALL metadata
            const isPng = file.type.includes('png');
            const mime = isPng ? 'image/png' : 'image/jpeg';
            canvas.toBlob((blob) => {
                if (!blob) { setStripping(false); return; }
                const link = document.createElement('a');
                link.download = `cleaned_${file.name.replace(/\.[^.]+$/, '')}.${isPng ? 'png' : 'jpg'}`;
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                toast.success(tt.successToast);
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
                            className="cursor-pointer rounded-3xl border-2 border-dashed border-[var(--color-wine-200)] bg-white hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50 transition-all p-12 text-center group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
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
                                <button onClick={reset} className="p-1.5 rounded-lg text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)]">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--color-wine-50)] border border-[var(--color-wine-100)]">
                                <Image src={imageUrl} alt="preview" fill className="object-contain p-3" unoptimized />
                            </div>
                        </ToolCard>

                        <ToolCard>
                            <div className={`mb-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold ${sensitive
                                ? 'bg-[#fbe3e7] border-[#e6b3bd] text-[#a4364c]'
                                : 'bg-[#dbe8d3] border-[#aac39e] text-[#3d6a4a]'
                                }`}>
                                {sensitive ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                {sensitive ? tt.warningTitle : tt.noMetadata}
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
