'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { Upload, Download, Settings2, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextInput, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageCompressor() {
    const { locale, t } = useLanguage();
    const tt = t.pages.compressor;
    const s = useMemo(() => (locale === 'th'
        ? {
            unsupported: 'รองรับเฉพาะไฟล์ PNG, JPEG, WEBP',
            pasteHint: 'หรือกด Ctrl+V เพื่อวางรูปจากคลิปบอร์ด',
            noSavings: 'ไฟล์เล็กอยู่แล้ว',
        }
        : {
            unsupported: 'Only PNG, JPEG, and WEBP files are supported',
            pasteHint: 'You can also paste an image (Ctrl+V)',
            noSavings: 'Already optimized',
        }), [locale]);

    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [compressedImage, setCompressedImage] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
    const [maxSizeStr, setMaxSizeStr] = useState('1');
    const [maxDimStr, setMaxDimStr] = useState('1920');

    // Increments whenever the source image changes or is reset, so a
    // compression that is still in flight for an old image gets discarded.
    const jobRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const originalUrl = useMemo(
        () => (originalImage ? URL.createObjectURL(originalImage) : null),
        [originalImage]
    );
    useEffect(() => () => {
        if (originalUrl) URL.revokeObjectURL(originalUrl);
    }, [originalUrl]);

    const compressedUrl = useMemo(
        () => (compressedImage ? URL.createObjectURL(compressedImage) : null),
        [compressedImage]
    );
    useEffect(() => () => {
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    }, [compressedUrl]);

    useEffect(() => {
        if (!originalUrl) {
            setDims(null);
            return;
        }
        const img = new window.Image();
        img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = originalUrl;
        return () => { img.onload = null; };
    }, [originalUrl]);

    const acceptFile = useCallback((file: File) => {
        if (!SUPPORTED_TYPES.includes(file.type)) {
            toast.error(file.type.startsWith('image/') ? s.unsupported : t.common.pleaseSelectImage);
            return;
        }
        jobRef.current++;
        setIsCompressing(false);
        setOriginalImage(file);
        setCompressedImage(null);
    }, [s, t.common.pleaseSelectImage]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        acceptFile(file);
    };

    // Drag & drop anywhere on the page (prevents the browser navigating to the file).
    useEffect(() => {
        const onDragOver = (e: DragEvent) => e.preventDefault();
        const onDrop = (e: DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            if (file) acceptFile(file);
        };
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('drop', onDrop);
        return () => {
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('drop', onDrop);
        };
    }, [acceptFile]);

    // Paste an image straight from the clipboard.
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        acceptFile(file);
                    }
                    return;
                }
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [acceptFile]);

    const runCompress = useCallback(async (src: File) => {
        const job = ++jobRef.current;
        setIsCompressing(true);
        setProgress(0);
        try {
            const result = await imageCompression(src, {
                maxSizeMB: Math.max(0.1, parseFloat(maxSizeStr) || 1),
                maxWidthOrHeight: Math.max(1, parseInt(maxDimStr, 10) || 1920),
                useWebWorker: true,
                onProgress: (p: number) => {
                    if (jobRef.current === job) setProgress(p);
                },
            });
            if (jobRef.current !== job) return;
            setCompressedImage(result);
            toast.success(tt.successToast);
        } catch (err) {
            if (jobRef.current !== job) return;
            console.error(err);
            toast.error(tt.failToast);
        } finally {
            if (jobRef.current === job) setIsCompressing(false);
        }
    }, [maxSizeStr, maxDimStr, tt.successToast, tt.failToast]);

    // Auto-compress on upload and re-compress when settings change (debounced).
    useEffect(() => {
        if (!originalImage) return;
        timerRef.current = setTimeout(() => { void runCompress(originalImage); }, 600);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [originalImage, runCompress]);

    const compress = () => {
        if (!originalImage) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        void runCompress(originalImage);
    };

    const reset = () => {
        jobRef.current++;
        setIsCompressing(false);
        setOriginalImage(null);
        setCompressedImage(null);
    };

    const downloadImage = () => {
        if (!compressedImage) return;
        const url = URL.createObjectURL(compressedImage);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${originalImage?.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const savings = originalImage && compressedImage
        ? Math.round((1 - compressedImage.size / originalImage.size) * 100)
        : 0;

    return (
        <ToolShell
            icon={<ImageIcon className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker={t.tools['image-compressor'].title}
            width="xwide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 order-2 lg:order-1">
                    <ToolCard>
                        <h2 className="text-base font-semibold text-[var(--color-wine-700)] mb-5 inline-flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            {tt.settings}
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <FieldLabel hint={tt.maxSizeHint}>{tt.maxSize}</FieldLabel>
                                <TextInput
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={maxSizeStr}
                                    onChange={(e) => setMaxSizeStr(e.target.value)}
                                />
                            </div>
                            <div>
                                <FieldLabel hint={tt.maxDimHint}>{tt.maxDim}</FieldLabel>
                                <TextInput
                                    type="number"
                                    step="100"
                                    min="1"
                                    value={maxDimStr}
                                    onChange={(e) => setMaxDimStr(e.target.value)}
                                />
                            </div>

                            <PrimaryButton onClick={compress} disabled={isCompressing || !originalImage} className="w-full py-3.5">
                                {isCompressing ? (
                                    <>
                                        <Settings2 className="w-4 h-4 animate-spin" />
                                        {tt.compressing} {progress > 0 ? `${Math.min(100, Math.round(progress))}%` : ''}
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-4 h-4" />
                                        {tt.compress}
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </ToolCard>
                </div>

                <div className="lg:col-span-8 order-1 lg:order-2">
                    <ToolCard className="min-h-[460px]">
                        {!originalImage ? (
                            <label
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
                                }}
                                onDrop={() => setIsDragging(false)}
                                className={`h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12 cursor-pointer transition-all focus-within:border-[var(--color-wine-400)] focus-within:bg-[var(--color-wine-50)] ${
                                    isDragging
                                        ? 'border-[var(--color-wine-400)] bg-[var(--color-wine-50)]'
                                        : 'border-[var(--color-wine-200)] hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]'
                                }`}
                            >
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={handleUpload}
                                />
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-20 h-20 bg-[var(--color-wine-100)] rounded-2xl flex items-center justify-center mb-5 text-[var(--color-wine-700)]"
                                >
                                    <Upload className="w-8 h-8" />
                                </motion.div>
                                <h3 className="text-lg font-semibold text-[var(--color-wine-700)] mb-1.5">{tt.uploadTitle}</h3>
                                <p className="text-[var(--color-smoke-600)] text-sm">{tt.uploadHint}</p>
                                <p className="text-[var(--color-smoke-600)] text-[12.5px] mt-1">{s.pasteHint}</p>
                            </label>
                        ) : (
                            <div className="space-y-7">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[var(--color-wine-700)]">{tt.original}</h3>
                                            <span className="text-[12.5px] text-[var(--color-smoke-600)]">
                                                {dims ? `${dims.w}×${dims.h} · ` : ''}{formatSize(originalImage.size)}
                                            </span>
                                        </div>
                                        <div className="relative aspect-video bg-[var(--color-wine-50)] rounded-2xl overflow-hidden border border-[var(--color-wine-100)]">
                                            {originalUrl && (
                                                <Image src={originalUrl} alt="orig" fill className="object-contain" unoptimized />
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[var(--color-wine-700)]">{tt.compressed}</h3>
                                            {compressedImage && (
                                                <span className="text-[12.5px] font-semibold text-[#3d6a4a] inline-flex items-center gap-2">
                                                    {formatSize(compressedImage.size)}
                                                    {savings > 0 ? (
                                                        <span className="text-[11px] bg-[#dbe8d3] text-[#2c4a26] px-2 py-0.5 rounded-full">
                                                            −{savings}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] bg-[var(--color-wine-50)] text-[var(--color-smoke-600)] px-2 py-0.5 rounded-full">
                                                            {s.noSavings}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative aspect-video bg-[var(--color-wine-50)] rounded-2xl overflow-hidden border border-[var(--color-wine-100)] flex items-center justify-center">
                                            {compressedUrl ? (
                                                <Image src={compressedUrl} alt="comp" fill className="object-contain" unoptimized />
                                            ) : (
                                                <div className="text-[var(--color-smoke-600)] text-center">
                                                    <ImageIcon className={`w-10 h-10 mx-auto mb-2 text-[var(--color-wine-300)] ${isCompressing ? 'animate-pulse' : ''}`} />
                                                    <p className="text-[12.5px]">
                                                        {isCompressing
                                                            ? `${tt.compressing} ${progress > 0 ? `${Math.min(100, Math.round(progress))}%` : ''}`
                                                            : tt.waiting}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={reset}
                                        className="flex-1 py-3.5 rounded-2xl bg-[var(--color-wine-50)] border-[1.5px] border-[var(--color-wine-100)] text-[var(--color-wine-700)] font-semibold text-[14px] hover:bg-[var(--color-wine-100)] transition-colors"
                                    >
                                        {t.common.reset}
                                    </button>
                                    <SecondaryButton onClick={downloadImage} disabled={!compressedImage} className="flex-1 py-3.5">
                                        <Download className="w-4 h-4" />
                                        {t.common.download}
                                    </SecondaryButton>
                                </div>
                            </div>
                        )}
                    </ToolCard>
                </div>
            </div>
        </ToolShell>
    );
}
