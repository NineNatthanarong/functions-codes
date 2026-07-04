'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, RotateCw, FlipHorizontal, FlipVertical, Crop, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, PrimaryButton, SecondaryButton, GhostButton, SegmentedControl, TextInput } from '@/components/ToolShell';

type Ratio = 'free' | '1:1' | '4:3' | '3:2' | '16:9';
type Format = 'image/png' | 'image/jpeg' | 'image/webp';
type Box = { x: number; y: number; w: number; h: number };

const RATIOS: Record<Ratio, number | null> = { free: null, '1:1': 1, '4:3': 4 / 3, '3:2': 3 / 2, '16:9': 16 / 9 };
const MAX_OUT = 8192;

export default function ImageCropperPage() {
    const t = useT();
    const tt = t.pages.cropper;
    const { locale } = useLanguage();
    const s = locale === 'th'
        ? {
            changeImage: 'เปลี่ยนรูป',
            cropArea: 'พื้นที่ครอบ — ใช้ปุ่มลูกศรเพื่อเลื่อน กด Shift ค้างพร้อมลูกศรเพื่อปรับขนาด',
            rotateTooLarge: 'รูปใหญ่เกินไปสำหรับการหมุนบนอุปกรณ์นี้ ยกเลิกการหมุนแล้ว',
        }
        : {
            changeImage: 'Change image',
            cropArea: 'Crop area — use arrow keys to move, hold Shift with arrows to resize',
            rotateTooLarge: 'Image too large to rotate on this device — rotation was reset',
        };

    const [file, setFile] = useState<File | null>(null);
    const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [ratio, setRatio] = useState<Ratio>('free');
    const [crop, setCrop] = useState<Box>({ x: 0, y: 0, w: 1, h: 1 }); // normalized 0..1 of the (transformed) image
    const [rotate, setRotate] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [format, setFormat] = useState<Format>('image/png');
    const [quality, setQuality] = useState(0.92);
    const [outW, setOutW] = useState(800);
    const [outH, setOutH] = useState(600);
    const [drag, setDrag] = useState<null | { mode: 'move' | 'resize'; corner?: string; startX: number; startY: number; startBox: Box }>(null);
    const [dragOver, setDragOver] = useState(false);
    const [exporting, setExporting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    // Offscreen canvas holding the image with rotate/flip baked in (null = identity transform)
    const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [workUrl, setWorkUrl] = useState<string | null>(null);
    // Latest bilingual strings for async canvas callbacks, without making the
    // bake effect re-run (and re-draw a full-res canvas) on locale change.
    const sRef = useRef(s);
    useEffect(() => {
        sRef.current = s;
    });

    const onUpload = useCallback((f: File) => {
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
    }, [t]);

    // Free the blob URLs whenever they change or the component unmounts
    useEffect(() => {
        return () => {
            if (imgUrl) URL.revokeObjectURL(imgUrl);
        };
    }, [imgUrl]);
    useEffect(() => {
        return () => {
            if (workUrl) URL.revokeObjectURL(workUrl);
        };
    }, [workUrl]);

    // Paste-from-clipboard support (e.g. screenshots)
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const f = e.clipboardData?.files?.[0];
            if (f && f.type.startsWith('image/')) {
                e.preventDefault();
                onUpload(f);
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [onUpload]);

    // Dimensions of the working (rotated/flipped) image. Crop coordinates,
    // the preview container, and the exporter all live in this space, so
    // what you see inside the crop window is exactly what gets exported.
    const rot = ((rotate % 360) + 360) % 360;
    const swapDims = rot === 90 || rot === 270;
    const srcW = imgEl ? (swapDims ? imgEl.naturalHeight : imgEl.naturalWidth) : 1;
    const srcH = imgEl ? (swapDims ? imgEl.naturalWidth : imgEl.naturalHeight) : 1;

    // Bake rotate/flip into an offscreen canvas and use it as the preview
    // source, instead of CSS-transforming the <img> over an untransformed
    // crop box (which broke WYSIWYG and clipped the preview at 90°/270°).
    useEffect(() => {
        if (!imgEl) return;
        const r = ((rotate % 360) + 360) % 360;
        if (r === 0 && !flipH && !flipV) {
            workCanvasRef.current = null;
            setWorkUrl(null);
            return;
        }
        const swap = r === 90 || r === 270;
        const w = swap ? imgEl.naturalHeight : imgEl.naturalWidth;
        const h = swap ? imgEl.naturalWidth : imgEl.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.translate(w / 2, h / 2);
        ctx.rotate((r * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);
        workCanvasRef.current = canvas;
        let cancelled = false;
        canvas.toBlob((blob) => {
            if (cancelled) return;
            if (!blob) {
                // Some platforms (e.g. iOS Safari with very large photos) return
                // null for oversized canvases. Undo the rotate/flip so the preview,
                // aspect box, dimensions, and export all stay consistent — the
                // identity case above short-circuits, so this cannot loop.
                workCanvasRef.current = null;
                toast.error(sRef.current.rotateTooLarge);
                setRotate(0); setFlipH(false); setFlipV(false);
                return;
            }
            setWorkUrl(URL.createObjectURL(blob));
        }, 'image/png');
        return () => { cancelled = true; };
    }, [imgEl, rotate, flipH, flipV]);

    const displayUrl = workUrl ?? imgUrl;

    const applyRatio = useCallback((r: Ratio, c: Box, naturalW: number, naturalH: number): Box => {
        const target = RATIOS[r];
        if (!target) return c;
        const cropRatio = (c.w * naturalW) / (c.h * naturalH);
        if (Math.abs(cropRatio - target) < 0.01) return c;
        // Adjust height to match ratio, keeping x,y,w
        const newHpx = (c.w * naturalW) / target;
        const newH = newHpx / naturalH;
        if (c.y + newH > 1) {
            // Widen instead — clamped to the image edge; if even the clamped
            // width overflows the ratio, shrink height to compensate.
            let w = ((c.h * naturalH) * target) / naturalW;
            let h = c.h;
            if (w > 1 - c.x) {
                w = 1 - c.x;
                h = (w * naturalW) / target / naturalH;
            }
            return { ...c, w, h };
        }
        return { ...c, h: newH };
    }, []);

    useEffect(() => {
        if (!imgEl) return;
        setCrop((c) => applyRatio(ratio, c, srcW, srcH));
    }, [ratio, imgEl, srcW, srcH, applyRatio]);

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

            next = applyRatio(ratio, next, srcW, srcH);
            setCrop(next);
        };
        const up = () => setDrag(null);
        const key = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCrop(drag.startBox);
                setDrag(null);
            }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        window.addEventListener('keydown', key);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            window.removeEventListener('keydown', key);
        };
    }, [drag, applyRatio, ratio, srcW, srcH]);

    // Arrow keys nudge the crop box when it has focus; Shift+arrows resize.
    const onCropKeyDown = (e: React.KeyboardEvent) => {
        const step = 0.01;
        let { x, y, w, h } = crop;
        let handled = true;
        if (e.shiftKey) {
            if (e.key === 'ArrowRight') w = Math.min(1 - x, w + step);
            else if (e.key === 'ArrowLeft') w = Math.max(0.05, w - step);
            else if (e.key === 'ArrowDown') h = Math.min(1 - y, h + step);
            else if (e.key === 'ArrowUp') h = Math.max(0.05, h - step);
            else handled = false;
        } else {
            if (e.key === 'ArrowRight') x = Math.min(1 - w, x + step);
            else if (e.key === 'ArrowLeft') x = Math.max(0, x - step);
            else if (e.key === 'ArrowDown') y = Math.min(1 - h, y + step);
            else if (e.key === 'ArrowUp') y = Math.max(0, y - step);
            else handled = false;
        }
        if (!handled) return;
        e.preventDefault();
        setCrop(applyRatio(ratio, { x, y, w, h }, srcW, srcH));
    };

    // Keep output dimensions in sync with crop selection (live preview).
    // User can still type a custom number; we only update on crop changes,
    // not on every keystroke in the W/H fields.
    useEffect(() => {
        if (!imgEl) return;
        setOutW(Math.round(crop.w * srcW));
        setOutH(Math.round(crop.h * srcH));
    }, [crop, imgEl, srcW, srcH]);

    const reset = () => setCrop({ x: 0, y: 0, w: 1, h: 1 });

    const download = () => {
        if (!imgEl || !file || exporting) return;
        const source: CanvasImageSource = workCanvasRef.current ?? imgEl;
        const sx = crop.x * srcW;
        const sy = crop.y * srcH;
        const sw = crop.w * srcW;
        const sh = crop.h * srcH;

        const targetW = Math.max(1, Math.min(MAX_OUT, Math.round(outW) || 1));
        const targetH = Math.max(1, Math.min(MAX_OUT, Math.round(outH) || 1));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetW, targetH);

        setExporting(true);
        canvas.toBlob((blob) => {
            setExporting(false);
            if (!blob) {
                toast.error(t.common.errorTryAgain);
                return;
            }
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
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.currentTarget.value = '';
                }}
            />
            {!imgEl ? (
                <div className="max-w-xl mx-auto">
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label={tt.uploadTitle}
                        className={`rounded-3xl border-2 border-dashed transition-all p-12 text-center cursor-pointer group hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50 ${dragOver ? 'border-[var(--color-wine-400)] bg-[var(--color-wine-50)]/50' : 'border-[var(--color-wine-200)] bg-white'}`}
                        onClick={() => fileRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileRef.current?.click();
                            }
                        }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const f = e.dataTransfer.files?.[0];
                            if (f) onUpload(f);
                        }}
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
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-3">
                        <GhostButton onClick={() => fileRef.current?.click()}>
                            <Upload className="w-3.5 h-3.5" />
                            {s.changeImage}
                        </GhostButton>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                    <ToolCard className="p-3">
                        <div
                            ref={containerRef}
                            className="relative w-full bg-[var(--color-wine-50)] rounded-2xl overflow-hidden select-none touch-none"
                            style={{ aspectRatio: `${srcW} / ${srcH}` }}
                        >
                            {/* base image — rotate/flip already baked into displayUrl */}
                            <img
                                src={displayUrl ?? ''}
                                alt="source"
                                draggable={false}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            />

                            {/* dim overlay */}
                            <div className="absolute inset-0 bg-[var(--color-wine-900)]/55 pointer-events-none" />

                            {/* crop window */}
                            <div
                                onPointerDown={(e) => onPointerDown(e, 'move')}
                                onKeyDown={onCropKeyDown}
                                tabIndex={0}
                                role="group"
                                aria-label={s.cropArea}
                                className="absolute border-[1.5px] border-[var(--color-cream)] cursor-move bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cream)]/80"
                                style={{
                                    left: `${crop.x * 100}%`,
                                    top: `${crop.y * 100}%`,
                                    width: `${crop.w * 100}%`,
                                    height: `${crop.h * 100}%`,
                                }}
                            >
                                {/* show actual image inside crop (un-dimmed). Uses an <img>
                                    sized/offset to line up exactly with the base layer. */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <img
                                        src={displayUrl ?? ''}
                                        alt=""
                                        draggable={false}
                                        className="absolute object-contain"
                                        style={{
                                            width: `${100 / crop.w}%`,
                                            height: `${100 / crop.h}%`,
                                            left: `${(-crop.x / crop.w) * 100}%`,
                                            top: `${(-crop.y / crop.h) * 100}%`,
                                        }}
                                    />
                                </div>

                                {/* rule-of-thirds */}
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="border border-[var(--color-cream)]/30" />
                                    ))}
                                </div>

                                {/* live pixel readout */}
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[var(--color-wine-900)]/70 text-[var(--color-cream)] text-[10px] font-medium tabular-nums whitespace-nowrap pointer-events-none">
                                    {Math.round(crop.w * srcW)} × {Math.round(crop.h * srcH)}
                                </span>

                                {/* corner handles */}
                                {(['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                                    <div
                                        key={c}
                                        aria-hidden="true"
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
                                        { value: '3:2' as Ratio, label: '3:2' },
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
                                    <span className="sr-only">{tt.flipH}</span>
                                </SecondaryButton>
                                <SecondaryButton onClick={() => setFlipV((f) => !f)} className="py-2.5">
                                    <FlipVertical className="w-4 h-4" />
                                    <span className="sr-only">{tt.flipV}</span>
                                </SecondaryButton>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FieldLabel>{tt.widthLabel}</FieldLabel>
                                    <TextInput type="number" min={1} max={MAX_OUT} aria-label={tt.widthLabel} value={outW} onChange={(e) => setOutW(parseInt(e.target.value || '0'))} />
                                </div>
                                <div>
                                    <FieldLabel>{tt.heightLabel}</FieldLabel>
                                    <TextInput type="number" min={1} max={MAX_OUT} aria-label={tt.heightLabel} value={outH} onChange={(e) => setOutH(parseInt(e.target.value || '0'))} />
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
                                        aria-label={tt.quality}
                                        className="w-full h-2 bg-[var(--color-wine-100)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)]"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <GhostButton onClick={reset} className="flex-1 py-3">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {tt.reset}
                                </GhostButton>
                                <PrimaryButton onClick={download} disabled={exporting} className="flex-1 py-3">
                                    <Download className="w-4 h-4" />
                                    {tt.download}
                                </PrimaryButton>
                            </div>
                        </div>
                    </ToolCard>
                    </div>
                </div>
            )}
        </ToolShell>
    );
}
