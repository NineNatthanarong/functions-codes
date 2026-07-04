'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Pipette, Upload, Copy, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, GhostButton } from '@/components/ToolShell';

declare global {
    interface Window {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }
}

function hexToRgb(hex: string) {
    const m = hex.replace('#', '').match(/.{1,2}/g);
    if (!m || m.length < 3) return null;
    return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function isLight(hex: string) {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 160;
}

function rgbToHsl(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ColorPickerPage() {
    const { locale, t } = useLanguage();
    const tt = t.pages.colorPicker;
    const s = locale === 'th'
        ? {
            emptyHint: 'เลือกสีจากหน้าจอ หรืออัปโหลดรูปแล้วคลิกที่รูปเพื่อเลือกสี',
            pasteHint: 'หรือกด Ctrl+V เพื่อวางรูปจากคลิปบอร์ด',
            notImage: 'ไฟล์นี้ไม่ใช่รูปภาพ',
            loadFailed: 'โหลดรูปไม่สำเร็จ ไฟล์อาจเสียหาย',
            copyFailed: 'คัดลอกไม่สำเร็จ',
            openConverter: 'แปลงสีเพิ่มเติม (HSL / OKLCH / Gradient)',
        }
        : {
            emptyHint: 'Pick a color from your screen, or upload an image and click a pixel.',
            pasteHint: 'You can also press Ctrl+V to paste an image from the clipboard',
            notImage: 'That file is not an image',
            loadFailed: 'Could not load that image — the file may be corrupted',
            copyFailed: 'Could not copy to clipboard',
            openConverter: 'More conversions (HSL / OKLCH / Gradient)',
        };
    const [color, setColor] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [supported, setSupported] = useState<boolean | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSupported('EyeDropper' in window);
    }, []);

    // Revoke the object URL when it is replaced or on unmount
    useEffect(() => {
        if (!imgUrl) return;
        return () => URL.revokeObjectURL(imgUrl);
    }, [imgUrl]);

    const copy = async (val: string) => {
        try {
            await navigator.clipboard.writeText(val);
            toast.success(`${tt.copied}: ${val}`);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const pick = (hex: string) => {
        setColor(hex);
        setHistory((h) => [hex, ...h.filter((x) => x !== hex)].slice(0, 16));
        void copy(hex);
    };

    const screenPick = async () => {
        if (!window.EyeDropper) return;
        try {
            const ed = new window.EyeDropper();
            const result = await ed.open();
            pick(result.sRGBHex.toUpperCase());
        } catch {
            // user cancelled
        }
    };

    const onUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(s.notImage);
            return;
        }
        const url = URL.createObjectURL(file);
        setImgUrl(url);

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const maxW = 800;
            const ratio = img.width > maxW ? maxW / img.width : 1;
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.onerror = () => {
            toast.error(s.loadFailed);
            setImgUrl((prev) => (prev === url ? null : prev));
        };
        img.src = url;
    };

    // Paste an image straight from the clipboard
    const onUploadRef = useRef(onUpload);
    useEffect(() => {
        onUploadRef.current = onUpload;
    });
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const item = Array.from(e.clipboardData?.items ?? []).find((it) => it.type.startsWith('image/'));
            const file = item?.getAsFile();
            if (file) {
                e.preventDefault();
                onUploadRef.current(file);
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, []);

    const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.min(Math.max(0, Math.floor(((e.clientX - rect.left) * canvas.width) / rect.width)), canvas.width - 1);
        const y = Math.min(Math.max(0, Math.floor(((e.clientY - rect.top) * canvas.height) / rect.height)), canvas.height - 1);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const data = ctx.getImageData(x, y, 1, 1).data;
        const hex = '#' + [data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        pick(hex);
    };

    const rgb = color ? hexToRgb(color) : null;
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

    return (
        <ToolShell
            icon={<Pipette className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Color"
            width="wide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                <ToolCard>
                    <div className="space-y-5">
                        {supported !== false && (
                            <PrimaryButton onClick={screenPick} disabled={!supported} className="w-full py-4">
                                <Pipette className="w-4 h-4" />
                                {tt.screenPick}
                            </PrimaryButton>
                        )}
                        {supported === false && (
                            <p className="text-[12.5px] text-[#a4364c] bg-[#fbe3e7] border border-[#f0c8d0] rounded-2xl p-3 text-center">
                                {tt.notSupported}
                            </p>
                        )}

                        <div className="relative">
                            <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-wine-100)]" />
                            <span className="relative bg-white px-3 text-[11px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold inline-block left-1/2 -translate-x-1/2">
                                {t.common.tipLabel}
                            </span>
                        </div>

                        <div>
                            <p className="text-[13px] font-semibold text-[var(--color-wine-700)] mb-2">{tt.uploadFallback}</p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onUpload(file);
                                    e.target.value = '';
                                }}
                            />
                            <button
                                onClick={() => fileRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) onUpload(file);
                                }}
                                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-[1.5px] border-dashed text-[13.5px] font-semibold text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)] transition-colors ${dragging ? 'bg-[var(--color-wine-100)] border-[var(--color-wine-400)]' : 'bg-[var(--color-wine-50)] border-[var(--color-wine-200)]'}`}
                            >
                                <Upload className="w-4 h-4" />
                                {t.common.upload}
                            </button>
                            <p className="text-[12px] text-[var(--color-smoke-600)] mt-2 text-center">{tt.uploadHint}</p>
                            <p className="text-[12px] text-[var(--color-smoke-600)] mt-1 text-center">{s.pasteHint}</p>
                        </div>

                        {history.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">
                                        {tt.history}
                                    </span>
                                    <GhostButton tone="danger" onClick={() => setHistory([])}>
                                        <Trash2 className="w-3 h-3" />
                                        {tt.clearHistory}
                                    </GhostButton>
                                </div>
                                <div className="grid grid-cols-8 gap-1.5">
                                    {history.map((h, i) => (
                                        <motion.button
                                            key={`${h}-${i}`}
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            onClick={() => { setColor(h); void copy(h); }}
                                            className="aspect-square rounded-lg border border-[var(--color-wine-100)] cursor-pointer"
                                            style={{ background: h }}
                                            title={h}
                                            aria-label={h}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ToolCard>

                <div className="space-y-5">
                    {color ? (
                        <ToolCard className="p-0 overflow-hidden">
                            <div
                                className="h-40 sm:h-48 transition-colors duration-300 flex items-end p-5"
                                style={{ background: color, color: isLight(color) ? '#1c0d12' : '#faf6f3' }}
                            >
                                <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight">{color}</span>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <ValueChip label="HEX" value={color} onCopy={copy} />
                                    {rgb && <ValueChip label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onCopy={copy} />}
                                    {hsl && (
                                        <ValueChip
                                            label="HSL"
                                            value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                                            onCopy={copy}
                                            className="col-span-2"
                                        />
                                    )}
                                </div>
                                <Link
                                    href="/color-tools"
                                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-wine-700)] hover:underline"
                                >
                                    {s.openConverter}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </ToolCard>
                    ) : (
                        <ToolCard className="text-center py-12 text-[var(--color-smoke-600)]">
                            <Pipette className="w-10 h-10 mx-auto mb-3 text-[var(--color-wine-300)]" />
                            <p className="text-sm max-w-xs mx-auto">{s.emptyHint}</p>
                        </ToolCard>
                    )}

                    {imgUrl && (
                        <ToolCard className="p-0 overflow-hidden">
                            <div className="px-5 py-3 border-b border-[var(--color-wine-100)] bg-[var(--color-wine-50)] inline-flex items-center gap-2 w-full">
                                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-wine-700)]" />
                                <span className="text-[12.5px] font-semibold text-[var(--color-wine-700)]">{tt.uploadHint}</span>
                            </div>
                            <div className="max-h-[480px] overflow-auto">
                                <canvas
                                    ref={canvasRef}
                                    onClick={onCanvasClick}
                                    className="w-full h-auto cursor-crosshair bg-[var(--color-wine-50)]"
                                />
                            </div>
                        </ToolCard>
                    )}
                </div>
            </div>
        </ToolShell>
    );
}

function ValueChip({ label, value, onCopy, className = '' }: { label: string; value: string; onCopy: (v: string) => void; className?: string }) {
    return (
        <button
            onClick={() => onCopy(value)}
            className={`group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] text-left hover:bg-[var(--color-wine-100)] transition-colors ${className}`}
        >
            <div className="min-w-0">
                <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">{label}</div>
                <div className="text-[13px] font-mono text-[var(--color-wine-800)] truncate">{value}</div>
            </div>
            <Copy className="w-3.5 h-3.5 text-[var(--color-wine-700)] opacity-50 group-hover:opacity-100 shrink-0" />
        </button>
    );
}
