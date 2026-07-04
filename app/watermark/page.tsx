'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Stamp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextInput, PrimaryButton } from '@/components/ToolShell';

type Position = 'tl' | 'tr' | 'bl' | 'br' | 'center' | 'tile';

type WatermarkSettings = {
    text: string;
    size: number;
    opacity: number;
    rotation: number;
    color: string;
    pos: Position;
};

function drawWatermarked(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    width: number,
    height: number,
    { text, size, opacity, rotation, color, pos }: WatermarkSettings
): boolean {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    if (text.trim()) {
        const fontPx = (size * width) / 1000;
        ctx.font = `600 ${Math.max(12, fontPx)}px "IBM Plex Sans Thai", "IBM Plex Sans", sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.textBaseline = 'middle';

        const measure = ctx.measureText(text);
        const textW = measure.width;
        const textH = Math.max(12, fontPx);
        const padding = textH;

        const drawRotated = (cx: number, cy: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.textAlign = 'center';
            ctx.fillText(text, 0, 0);
            ctx.restore();
        };

        if (pos === 'tile') {
            const stepX = textW * 1.6;
            const stepY = textH * 4;
            for (let y = 0; y < height + stepY; y += stepY) {
                for (let x = 0; x < width + stepX; x += stepX) {
                    drawRotated(x, y);
                }
            }
        } else {
            let cx = width / 2, cy = height / 2;
            if (pos === 'tl') { cx = padding + textW / 2; cy = padding + textH / 2; }
            if (pos === 'tr') { cx = width - padding - textW / 2; cy = padding + textH / 2; }
            if (pos === 'bl') { cx = padding + textW / 2; cy = height - padding - textH / 2; }
            if (pos === 'br') { cx = width - padding - textW / 2; cy = height - padding - textH / 2; }
            drawRotated(cx, cy);
        }
        ctx.globalAlpha = 1;
    }
    return true;
}

export default function WatermarkPage() {
    const t = useT();
    const tt = t.pages.watermark;
    const { locale } = useLanguage();
    const s = locale === 'th' ? {
        readError: 'อ่านไฟล์รูปนี้ไม่ได้ ลองไฟล์อื่นดูนะ',
        changeImage: 'เปลี่ยนรูป',
        whiteColor: 'สีขาว',
        blackColor: 'สีดำ',
        pasteHint: 'หรือวางรูปจากคลิปบอร์ด (Ctrl+V)',
    } : {
        readError: 'Could not read this image file. Please try another one.',
        changeImage: 'Change image',
        whiteColor: 'White',
        blackColor: 'Black',
        pasteHint: 'or paste an image from the clipboard (Ctrl+V)',
    };
    const [file, setFile] = useState<File | null>(null);
    const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
    const [text, setText] = useState('© functions.codes');
    const [size, setSize] = useState(48);
    const [opacity, setOpacity] = useState(0.5);
    const [rotation, setRotation] = useState(-15);
    const [color, setColor] = useState('#FAF6F3');
    const [pos, setPos] = useState<Position>('br');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const onUpload = useCallback((f: File) => {
        if (!f.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage); return;
        }
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
            setImgEl(img);
            setFile(f);
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            toast.error(s.readError);
        };
        img.src = url;
    }, [t.common.pleaseSelectImage, s.readError]);

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'));
            if (f) {
                e.preventDefault();
                onUpload(f);
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [onUpload]);

    const onDragOverFiles = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
    };
    const onDropFiles = (e: React.DragEvent) => {
        const f = e.dataTransfer.files?.[0];
        if (f) {
            e.preventDefault();
            onUpload(f);
        }
    };

    useEffect(() => {
        if (!imgEl || !canvasRef.current) return;
        const maxW = 1200;
        const ratio = imgEl.naturalWidth > maxW ? maxW / imgEl.naturalWidth : 1;
        drawWatermarked(
            canvasRef.current,
            imgEl,
            Math.round(imgEl.naturalWidth * ratio),
            Math.round(imgEl.naturalHeight * ratio),
            { text, size, opacity, rotation, color, pos }
        );
    }, [imgEl, text, size, opacity, rotation, color, pos]);

    const download = () => {
        if (!imgEl || !file) return;
        const exportCanvas = document.createElement('canvas');
        const ok = drawWatermarked(
            exportCanvas,
            imgEl,
            imgEl.naturalWidth,
            imgEl.naturalHeight,
            { text, size, opacity, rotation, color, pos }
        );
        if (!ok) return;
        const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
        exportCanvas.toBlob((blob) => {
            if (!blob) return;
            const link = document.createElement('a');
            link.download = `watermarked_${file.name.replace(/\.[^.]+$/, '')}.${ext}`;
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            toast.success(tt.successToast);
        }, mime, 0.92);
    };

    const reset = () => {
        setImgEl(null); setFile(null);
    };

    return (
        <ToolShell
            icon={<Stamp className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Watermark"
            width="xwide"
        >
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = '';
                }}
            />
            {!imgEl ? (
                <div className="max-w-xl mx-auto">
                    <div
                        className="rounded-3xl border-2 border-dashed border-[var(--color-wine-200)] bg-white hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50 transition-all p-12 text-center cursor-pointer group"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={onDragOverFiles}
                        onDrop={onDropFiles}
                    >
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-16 h-16 bg-[var(--color-wine-100)] rounded-2xl flex items-center justify-center mb-4 mx-auto text-[var(--color-wine-700)] group-hover:bg-[var(--color-wine-700)] group-hover:text-[var(--color-cream)] transition-colors"
                        >
                            <Upload className="w-7 h-7" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-[var(--color-wine-700)] mb-1.5">{tt.uploadTitle}</h3>
                        <p className="text-[var(--color-smoke-600)] text-sm">{tt.uploadHint}</p>
                        <p className="text-[var(--color-smoke-600)] text-xs mt-1">{s.pasteHint}</p>
                    </div>
                </div>
            ) : (
                <div
                    className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6"
                    onDragOver={onDragOverFiles}
                    onDrop={onDropFiles}
                >
                    <ToolCard className="p-3">
                        <div className="relative w-full bg-[var(--color-wine-50)] rounded-2xl overflow-hidden">
                            <canvas ref={canvasRef} className="w-full h-auto block" />
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[var(--color-wine-100)] text-[12px] font-semibold text-[var(--color-wine-700)] hover:bg-white transition-colors shadow-sm"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {s.changeImage}
                            </button>
                        </div>
                    </ToolCard>

                    <ToolCard>
                        <div className="space-y-5">
                            <div>
                                <FieldLabel>{tt.textLabel}</FieldLabel>
                                <TextInput
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={tt.textPlaceholder}
                                    aria-label={tt.textLabel}
                                />
                            </div>

                            <div>
                                <FieldLabel>{tt.positionLabel}</FieldLabel>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {([
                                        { v: 'tl', label: tt.positionTL },
                                        { v: 'tr', label: tt.positionTR },
                                        { v: 'center', label: tt.positionCenter },
                                        { v: 'bl', label: tt.positionBL },
                                        { v: 'br', label: tt.positionBR },
                                        { v: 'tile', label: tt.positionTile },
                                    ] as const).map((opt) => (
                                        <button
                                            key={opt.v}
                                            onClick={() => setPos(opt.v as Position)}
                                            className={`px-2 py-2 rounded-xl text-[12px] font-semibold transition-colors ${pos === opt.v
                                                ? 'bg-[var(--color-wine-700)] text-[var(--color-cream)]'
                                                : 'bg-[var(--color-wine-50)] text-[var(--color-wine-700)] border border-[var(--color-wine-100)] hover:bg-[var(--color-wine-100)]'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <FieldLabel hint={`${Math.max(12, Math.round((size * imgEl.naturalWidth) / 1000))}px`}>{tt.sizeLabel}</FieldLabel>
                                <input
                                    type="range"
                                    min={12}
                                    max={120}
                                    value={size}
                                    onChange={(e) => setSize(parseInt(e.target.value))}
                                    aria-label={tt.sizeLabel}
                                    className="w-full h-2 bg-[var(--color-wine-100)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)]"
                                />
                            </div>

                            <div>
                                <FieldLabel hint={`${Math.round(opacity * 100)}%`}>{tt.opacityLabel}</FieldLabel>
                                <input
                                    type="range"
                                    min={0.05}
                                    max={1}
                                    step={0.01}
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    aria-label={tt.opacityLabel}
                                    className="w-full h-2 bg-[var(--color-wine-100)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)]"
                                />
                            </div>

                            <div>
                                <FieldLabel hint={`${rotation}°`}>{tt.rotationLabel}</FieldLabel>
                                <input
                                    type="range"
                                    min={-90}
                                    max={90}
                                    value={rotation}
                                    onChange={(e) => setRotation(parseInt(e.target.value))}
                                    aria-label={tt.rotationLabel}
                                    className="w-full h-2 bg-[var(--color-wine-100)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)]"
                                />
                            </div>

                            <div>
                                <FieldLabel>{tt.colorLabel}</FieldLabel>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        aria-label={tt.colorLabel}
                                        className="w-12 h-12 rounded-2xl cursor-pointer border-[1.5px] border-[var(--color-wine-100)] p-1 bg-white"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setColor('#FFFFFF')}
                                            aria-label={s.whiteColor}
                                            title={s.whiteColor}
                                            className={`w-8 h-8 rounded-full bg-white border-[1.5px] transition-colors ${color.toUpperCase() === '#FFFFFF'
                                                ? 'border-[var(--color-wine-700)]'
                                                : 'border-[var(--color-wine-100)] hover:border-[var(--color-wine-400)]'
                                                }`}
                                        />
                                        <button
                                            onClick={() => setColor('#000000')}
                                            aria-label={s.blackColor}
                                            title={s.blackColor}
                                            className={`w-8 h-8 rounded-full bg-black border-[1.5px] transition-colors ${color.toUpperCase() === '#000000'
                                                ? 'border-[var(--color-wine-700)]'
                                                : 'border-[var(--color-wine-100)] hover:border-[var(--color-wine-400)]'
                                                }`}
                                        />
                                    </div>
                                    <span className="text-[12.5px] text-[var(--color-smoke-600)] uppercase font-mono">{color}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <button
                                    onClick={reset}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-wine-50)] border-[1.5px] border-[var(--color-wine-100)] text-[13.5px] font-semibold text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)] transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t.common.reset}
                                </button>
                                <PrimaryButton onClick={download} className="flex-1 py-3">
                                    <Download className="w-4 h-4" />
                                    {tt.download}
                                </PrimaryButton>
                            </div>
                        </div>
                    </ToolCard>
                </div>
            )}
        </ToolShell>
    );
}
