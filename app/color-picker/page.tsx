'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pipette, Upload, Copy, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
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

export default function ColorPickerPage() {
    const t = useT();
    const tt = t.pages.colorPicker;
    const [color, setColor] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const supported = typeof window !== 'undefined' && 'EyeDropper' in window;

    const screenPick = async () => {
        if (!supported || !window.EyeDropper) return;
        try {
            const ed = new window.EyeDropper();
            const result = await ed.open();
            const c = result.sRGBHex.toUpperCase();
            setColor(c);
            setHistory((h) => [c, ...h.filter((x) => x !== c)].slice(0, 16));
        } catch {
            // user cancelled
        }
    };

    const onUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        if (imgUrl) URL.revokeObjectURL(imgUrl);
        setImgUrl(url);

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const maxW = 800;
            const ratio = img.width > maxW ? maxW / img.width : 1;
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = url;
    };

    const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
        const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const data = ctx.getImageData(x, y, 1, 1).data;
        const hex = '#' + [data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        setColor(hex);
        setHistory((h) => [hex, ...h.filter((x) => x !== hex)].slice(0, 16));
    };

    const copy = (val: string) => {
        navigator.clipboard.writeText(val);
        toast.success(`${tt.copied}: ${val}`);
    };

    const rgb = color ? hexToRgb(color) : null;

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
                        <PrimaryButton onClick={screenPick} disabled={!supported} className="w-full py-4">
                            <Pipette className="w-4 h-4" />
                            {tt.screenPick}
                        </PrimaryButton>
                        {!supported && (
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
                                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                            />
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-wine-50)] border-[1.5px] border-dashed border-[var(--color-wine-200)] text-[13.5px] font-semibold text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)] transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                {t.common.upload}
                            </button>
                            <p className="text-[12px] text-[var(--color-smoke-600)] mt-2 text-center">{tt.uploadHint}</p>
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
                                            onClick={() => { setColor(h); copy(h); }}
                                            className="aspect-square rounded-lg border border-[var(--color-wine-100)] cursor-pointer"
                                            style={{ background: h }}
                                            title={h}
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
                            <div className="p-5 grid grid-cols-2 gap-3">
                                <ValueChip label="HEX" value={color} onCopy={copy} />
                                {rgb && <ValueChip label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onCopy={copy} />}
                            </div>
                        </ToolCard>
                    ) : (
                        <ToolCard className="text-center py-12 text-[var(--color-smoke-600)]">
                            <Pipette className="w-10 h-10 mx-auto mb-3 text-[var(--color-wine-300)]" />
                            <p className="text-sm">—</p>
                        </ToolCard>
                    )}

                    {imgUrl && (
                        <ToolCard className="p-0 overflow-hidden">
                            <div className="px-5 py-3 border-b border-[var(--color-wine-100)] bg-[var(--color-wine-50)] inline-flex items-center gap-2 w-full">
                                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-wine-700)]" />
                                <span className="text-[12.5px] font-semibold text-[var(--color-wine-700)]">{tt.uploadHint}</span>
                            </div>
                            <canvas
                                ref={canvasRef}
                                onClick={onCanvasClick}
                                className="w-full h-auto cursor-crosshair max-h-[480px] object-contain bg-[var(--color-wine-50)]"
                            />
                        </ToolCard>
                    )}
                </div>
            </div>
        </ToolShell>
    );
}

function ValueChip({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
    return (
        <button
            onClick={() => onCopy(value)}
            className="group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] text-left hover:bg-[var(--color-wine-100)] transition-colors"
        >
            <div className="min-w-0">
                <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">{label}</div>
                <div className="text-[13px] font-mono text-[var(--color-wine-800)] truncate">{value}</div>
            </div>
            <Copy className="w-3.5 h-3.5 text-[var(--color-wine-700)] opacity-50 group-hover:opacity-100 shrink-0" />
        </button>
    );
}
