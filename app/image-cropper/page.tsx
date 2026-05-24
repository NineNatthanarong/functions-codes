'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, RotateCw, FlipHorizontal, FlipVertical, Crop, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, PrimaryButton, SecondaryButton, GhostButton, SegmentedControl, TextInput } from '@/components/ToolShell';

type Ratio = 'free' | '1:1' | '4:3' | '3:2' | '16:9';
type Format = 'image/png' | 'image/jpeg' | 'image/webp';
type Box = { x: number; y: number; w: number; h: number };

export default function ImageCropperPage() {
    const t = useT();
    const tt = t.pages.cropper;

    const [file, setFile] = useState<File | null>(null);
    const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [ratio, setRatio] = useState<Ratio>('free');
    const [crop, setCrop] = useState<Box>({ x: 0, y: 0, w: 1, h: 1 }); // normalized 0..1 of natural image
    const [rotate, setRotate] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [format, setFormat] = useState<Format>('image/png');
    const [quality, setQuality] = useState(0.92);
    const [outW, setOutW] = useState(800);
    const [outH, setOutH] = useState(600);
    const [drag, setDrag] = useState<null | { mode: 'move' | 'resize'; corner?: string; startX: number; startY: number; startBox: Box }>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const onUpload = (f: File) => {
        if (!f.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage); return;
        }
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
            setImgEl(img);
            setFile(f);
            setImgUrl(url);
            setCrop({ x: 0, y: 0, w: 1, h: 1 });
            setOutW(img.naturalWidth);
            setOutH(img.naturalHeight);
            setRotate(0); setFlipH(false); setFlipV(false);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            toast.error(t.common.errorTryAgain);
        };
        img.src = url;
    };

    // Free the blob URL whenever it changes or the component unmounts
    useEffect(() => {
        return () => {
            if (imgUrl) URL.revokeObjectURL(imgUrl);
        };
    }, [imgUrl]);

    const ratios: Record<Ratio, number | null> = { free: null, '1:1': 1, '4:3': 4 / 3, '3:2': 3 / 2, '16:9': 16 / 9 };

    const applyRatio = useCallback((r: Ratio, c: Box, naturalW: number, naturalH: number): Box => {
        const target = ratios[r];
        if (!target) return c;
        const cropRatio = (c.w * naturalW) / (c.h * naturalH);
        if (Math.abs(cropRatio - target) < 0.01) return c;
        // Adjust height to match ratio, keeping x,y,w
        const newHpx = (c.w * naturalW) / target;
        const newH = newHpx / naturalH;
        if (c.y + newH > 1) {
            const newWpx = (c.h * naturalH) * target;
            return { ...c, w: newWpx / naturalW };
        }
        return { ...c, h: newH };
    }, []);

    useEffect(() => {
        if (!imgEl) return;
        setCrop((c) => applyRatio(ratio, c, imgEl.naturalWidth, imgEl.naturalHeight));
    }, [ratio, imgEl, applyRatio]);

    // Pointer-driven crop handles. We use window-level listeners (not on the
    // element that received pointerdown) because pointer capture would otherwise
    // route move events to the handle element, bypassing the container.
    const onPointerDown = (e: React.PointerEvent, mode: 'move' | 'resize', corner?: string) => {
        if (!containerRef.current) return;
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        setDrag({
            mode,
            corner,
            startX: (e.clientX - rect.left) / rect.width,
            startY: (e.clientY - rect.top) / rect.height,
            startBox: crop,
        });
    };

    useEffect(() => {
        if (!drag) return;
        const move = (e: PointerEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;
            const dx = nx - drag.startX;
            const dy = ny - drag.startY;
            const c = drag.startBox;
            let next: Box = { ...c };

            if (drag.mode === 'move') {
                next.x = Math.max(0, Math.min(1 - c.w, c.x + dx));
                next.y = Math.max(0, Math.min(1 - c.h, c.y + dy));
            } else if (drag.mode === 'resize') {
                const corner = drag.corner!;
                if (corner.includes('w')) { next.x = c.x + dx; next.w = c.w - dx; }
                if (corner.includes('e')) { next.w = c.w + dx; }
                if (corner.includes('n')) { next.y = c.y + dy; next.h = c.h - dy; }
                if (corner.includes('s')) { next.h = c.h + dy; }

                // Keep within image bounds, minimum 5% on each side
                if (next.x < 0) { next.w += next.x; next.x = 0; }
                if (next.y < 0) { next.h += next.y; next.y = 0; }
                if (next.x + next.w > 1) next.w = 1 - next.x;
                if (next.y + next.h > 1) next.h = 1 - next.y;
                next.w = Math.max(0.05, next.w);
                next.h = Math.max(0.05, next.h);
            }

            if (imgEl) next = applyRatio(ratio, next, imgEl.naturalWidth, imgEl.naturalHeight);
            setCrop(next);
        };
        const up = () => setDrag(null);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
        };
    }, [drag, applyRatio, imgEl, ratio]);

    // Keep output dimensions in sync with crop selection (live preview).
    // User can still type a custom number; we only update on crop changes,
    // not on every keystroke in the W/H fields.
    useEffect(() => {
        if (!imgEl) return;
        setOutW(Math.round(crop.w * imgEl.naturalWidth));
        setOutH(Math.round(crop.h * imgEl.naturalHeight));
    }, [crop, imgEl]);

    const reset = () => setCrop({ x: 0, y: 0, w: 1, h: 1 });

    const download = () => {
        if (!imgEl || !file) return;
        const naturalW = imgEl.naturalWidth;
        const naturalH = imgEl.naturalHeight;
        const sx = crop.x * naturalW;
        const sy = crop.y * naturalH;
        const sw = crop.w * naturalW;
        const sh = crop.h * naturalH;

        const targetW = outW;
        const targetH = outH;
        const canvas = document.createElement('canvas');
        // For rotated output, swap if 90/270
        const r = ((rotate % 360) + 360) % 360;
        const swap = r === 90 || r === 270;
        canvas.width = swap ? targetH : targetW;
        canvas.height = swap ? targetW : targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((r * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(imgEl, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();

        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const ext = format.split('/')[1];
            const link = document.createElement('a');
            link.download = `cropped_${file.name.replace(/\.[^.]+$/, '')}.${ext}`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(tt.successToast);
        }, format, quality);
    };

    return (
        <ToolShell
            icon={<Crop className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Image"
            width="xwide"
        >
            {!imgEl ? (
                <div className="max-w-xl mx-auto">
                    <div
                        className="rounded-3xl border-2 border-dashed border-[var(--color-wine-200)] bg-white hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50 transition-all p-12 text-center cursor-pointer group"
                        onClick={() => fileRef.current?.click()}
                    >
                        <input
                            ref={fileRef}
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
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                    <ToolCard className="p-3">
                        <div
                            ref={containerRef}
                            className="relative w-full bg-[var(--color-wine-50)] rounded-2xl overflow-hidden select-none touch-none"
                            style={{ aspectRatio: `${imgEl.naturalWidth} / ${imgEl.naturalHeight}` }}
                        >
                            {/* base image — receives the live transform */}
                            <img
                                src={imgUrl ?? ''}
                                alt="source"
                                draggable={false}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                style={{
                                    transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                }}
                            />

                            {/* dim overlay */}
                            <div className="absolute inset-0 bg-[var(--color-wine-900)]/55 pointer-events-none" />

                            {/* crop window */}
                            <div
                                onPointerDown={(e) => onPointerDown(e, 'move')}
                                className="absolute border-[1.5px] border-[var(--color-cream)] cursor-move bg-transparent"
                                style={{
                                    left: `${crop.x * 100}%`,
                                    top: `${crop.y * 100}%`,
                                    width: `${crop.w * 100}%`,
                                    height: `${crop.h * 100}%`,
                                }}
                            >
                                {/* show actual image inside crop (un-dimmed). Uses an <img>
                                    rather than background-image so the same rotate/flip
                                    transform can apply, keeping both layers in sync. */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <img
                                        src={imgUrl ?? ''}
                                        alt=""
                                        draggable={false}
                                        className="absolute object-contain"
                                        style={{
                                            width: `${100 / crop.w}%`,
                                            height: `${100 / crop.h}%`,
                                            left: `${(-crop.x / crop.w) * 100}%`,
                                            top: `${(-crop.y / crop.h) * 100}%`,
                                            transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                        }}
                                    />
                                </div>

                                {/* rule-of-thirds */}
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="border border-[var(--color-cream)]/30" />
                                    ))}
                                </div>

                                {/* corner handles */}
                                {(['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                                    <div
                                        key={c}
                                        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, 'resize', c); }}
                                        className="absolute w-3 h-3 bg-[var(--color-cream)] border-2 border-[var(--color-wine-700)] rounded-full"
                                        style={{
                                            cursor: `${c}-resize`,
                                            left: c.includes('w') ? -6 : 'auto',
                                            right: c.includes('e') ? -6 : 'auto',
                                            top: c.includes('n') ? -6 : 'auto',
                                            bottom: c.includes('s') ? -6 : 'auto',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </ToolCard>

                    <ToolCard>
                        <div className="space-y-5">
                            <div>
                                <FieldLabel>{tt.ratio}</FieldLabel>
                                <SegmentedControl
                                    value={ratio}
                                    onChange={setRatio}
                                    options={[
                                        { value: 'free' as Ratio, label: tt.ratioFree },
                                        { value: '1:1' as Ratio, label: '1:1' },
                                        { value: '4:3' as Ratio, label: '4:3' },
                                        { value: '16:9' as Ratio, label: '16:9' },
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <SecondaryButton onClick={() => setRotate((r) => (r + 90) % 360)} className="py-2.5">
                                    <RotateCw className="w-4 h-4" />
                                    {tt.rotate}
                                </SecondaryButton>
                                <SecondaryButton onClick={() => setFlipH((f) => !f)} className="py-2.5">
                                    <FlipHorizontal className="w-4 h-4" />
                                </SecondaryButton>
                                <SecondaryButton onClick={() => setFlipV((f) => !f)} className="py-2.5">
                                    <FlipVertical className="w-4 h-4" />
                                </SecondaryButton>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FieldLabel>{tt.widthLabel}</FieldLabel>
                                    <TextInput type="number" value={outW} onChange={(e) => setOutW(parseInt(e.target.value || '0'))} />
                                </div>
                                <div>
                                    <FieldLabel>{tt.heightLabel}</FieldLabel>
                                    <TextInput type="number" value={outH} onChange={(e) => setOutH(parseInt(e.target.value || '0'))} />
                                </div>
                            </div>

                            <div>
                                <FieldLabel>{tt.format}</FieldLabel>
                                <SegmentedControl
                                    value={format}
                                    onChange={setFormat}
                                    options={[
                                        { value: 'image/png' as Format, label: 'PNG' },
                                        { value: 'image/jpeg' as Format, label: 'JPEG' },
                                        { value: 'image/webp' as Format, label: 'WEBP' },
                                    ]}
                                />
                            </div>

                            {format !== 'image/png' && (
                                <div>
                                    <FieldLabel hint={`${Math.round(quality * 100)}%`}>{tt.quality}</FieldLabel>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={1}
                                        step={0.01}
                                        value={quality}
                                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-[var(--color-wine-100)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)]"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <GhostButton onClick={reset} className="flex-1 py-3">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {tt.reset}
                                </GhostButton>
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
