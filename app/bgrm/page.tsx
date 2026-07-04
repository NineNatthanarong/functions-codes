'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { removeBackground } from '@imgly/background-removal';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, RefreshCw, Sparkles, Image as ImageIcon, Scissors, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

export default function BackgroundRemover() {
    const { t, locale } = useLanguage();
    const tt = t.pages.bgrm;
    const s = useMemo(() => locale === 'th' ? {
        pasteHint: 'หรือกด Ctrl+V เพื่อวางรูปจากคลิปบอร์ด',
        aiNote: 'ครั้งแรกที่ใช้โหมด AI จะดาวน์โหลดโมเดล (~40MB) อาจใช้เวลาสักครู่',
        basicNote: 'โหมดธรรมดาจะลบเฉพาะพิกเซลสีเกือบขาว เหมาะกับพื้นหลังขาวล้วน',
        largeFile: 'ไฟล์ขนาดใหญ่ อาจใช้เวลาประมวลผลนานกว่าปกติ',
        newImage: 'อัปโหลดรูปใหม่',
        copyUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการคัดลอกรูป',
    } : {
        pasteHint: 'or press Ctrl+V to paste an image from your clipboard',
        aiNote: 'First AI run downloads a model (~40 MB) — it may take a moment.',
        basicNote: 'Basic mode only removes near-white pixels — best for plain white backgrounds.',
        largeFile: 'Large file — processing may take longer than usual.',
        newImage: 'Upload a new image',
        copyUnsupported: 'Copying images is not supported in this browser.',
    }, [locale]);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [useAdvanced, setUseAdvanced] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const runIdRef = useRef(0);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage);
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.warning(s.largeFile);
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            runIdRef.current++;
            setOriginalImage(e.target?.result as string);
            setProcessedImage(null);
            setIsProcessing(false);
            setProgress(null);
            setFileName(file.name);
        };
        reader.onerror = () => {
            toast.error(t.common.errorTryAgain);
        };
        reader.readAsDataURL(file);
    }, [t, s]);

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            if (isProcessing) return;
            const files = e.clipboardData?.files;
            if (files && files.length > 0 && files[0].type.startsWith('image/')) {
                e.preventDefault();
                handleFiles(files);
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [handleFiles, isProcessing]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragActive(false);
    }, []);

    const processImage = async () => {
        if (!originalImage) return;
        const runId = ++runIdRef.current;
        setIsProcessing(true);
        setProgress(null);
        try {
            if (useAdvanced) {
                const blob = await fetch(originalImage).then((r) => r.blob());
                const result = await removeBackground(blob, {
                    progress: (_key, current, total) => {
                        if (runIdRef.current !== runId) return;
                        if (total > 0) setProgress(Math.round((current / total) * 100));
                    },
                });
                if (runIdRef.current !== runId) return;
                const reader = new FileReader();
                reader.onload = () => {
                    if (runIdRef.current !== runId) return;
                    setProcessedImage(reader.result as string);
                    setIsProcessing(false);
                    setProgress(null);
                    toast.success(tt.successToast);
                };
                reader.onerror = () => {
                    if (runIdRef.current !== runId) return;
                    setIsProcessing(false);
                    setProgress(null);
                    toast.error(tt.failToast);
                };
                reader.readAsDataURL(result);
            } else {
                if (!canvasRef.current) throw new Error('canvas');
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('ctx');

                const img = new window.Image();
                img.onload = () => {
                    if (runIdRef.current !== runId) return;
                    try {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const d = data.data;
                        for (let i = 0; i < d.length; i += 4) {
                            const r = d[i], g = d[i + 1], b = d[i + 2];
                            const brightness = (r + g + b) / 3;
                            if (brightness > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
                                d[i + 3] = 0;
                            }
                        }
                        ctx.putImageData(data, 0, 0);
                        setProcessedImage(canvas.toDataURL('image/png'));
                        setIsProcessing(false);
                        toast.success(tt.successToast);
                    } catch (err) {
                        console.error(err);
                        setIsProcessing(false);
                        toast.error(tt.failToast);
                    }
                };
                img.onerror = () => {
                    if (runIdRef.current !== runId) return;
                    setIsProcessing(false);
                    toast.error(tt.failToast);
                };
                img.src = originalImage;
            }
        } catch (err) {
            console.error(err);
            if (runIdRef.current === runId) {
                toast.error(tt.failToast);
                setIsProcessing(false);
                setProgress(null);
            }
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;
        const base = fileName ? fileName.replace(/\.[^.]+$/, '') : 'background-removed';
        const link = document.createElement('a');
        link.download = `${base}-no-bg.png`;
        link.href = processedImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t.common.downloadStarted);
    };

    const copyImage = async () => {
        if (!processedImage) return;
        if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
            toast.error(s.copyUnsupported);
            return;
        }
        try {
            const blob = await fetch(processedImage).then((r) => r.blob());
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success(t.common.copied);
        } catch (err) {
            console.error(err);
            toast.error(t.common.errorTryAgain);
        }
    };

    const reset = () => {
        runIdRef.current++;
        setOriginalImage(null);
        setProcessedImage(null);
        setIsProcessing(false);
        setProgress(null);
        setFileName(null);
    };

    return (
        <ToolShell
            icon={<Scissors className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker={t.tools['bgrm'].title}
            width="xwide"
        >
            <AnimatePresence mode="wait">
                {!originalImage ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        className="max-w-xl mx-auto"
                    >
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label={tt.uploadTitle}
                            className={cn(
                                'relative group cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300',
                                dragActive
                                    ? 'border-[var(--color-wine-600)] bg-[var(--color-wine-50)]'
                                    : 'border-[var(--color-wine-200)] bg-white hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/60'
                            )}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                        >
                            <div className="flex flex-col items-center gap-5">
                                <motion.div
                                    animate={{ y: dragActive ? -3 : [0, -4, 0] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className={cn(
                                        'p-5 rounded-2xl transition-colors duration-300',
                                        dragActive
                                            ? 'bg-[var(--color-wine-700)] text-[var(--color-cream)]'
                                            : 'bg-[var(--color-wine-100)] text-[var(--color-wine-700)] group-hover:bg-[var(--color-wine-700)] group-hover:text-[var(--color-cream)]'
                                    )}
                                >
                                    <Upload className="w-8 h-8" strokeWidth={1.6} />
                                </motion.div>
                                <div>
                                    <p className="text-xl font-semibold text-[var(--color-wine-700)] mb-1.5">{tt.uploadTitle}</p>
                                    <p className="text-[var(--color-smoke-600)] text-sm">{tt.uploadHint}</p>
                                    <p className="text-[var(--color-smoke-600)] text-xs mt-1">{s.pasteHint}</p>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="process"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        <ToolCard>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-semibold text-[var(--color-wine-700)]">{tt.original}</h2>
                                <button
                                    onClick={reset}
                                    aria-label={t.common.reset}
                                    title={t.common.reset}
                                    className="p-2 text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] rounded-xl transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="relative aspect-square bg-[var(--color-wine-50)] rounded-2xl overflow-hidden mb-5 border border-[var(--color-wine-100)]">
                                <Image src={originalImage} alt="Original" fill className="object-contain p-3" unoptimized />
                            </div>

                            <div className="flex items-center justify-between gap-4 p-4 bg-[var(--color-wine-50)] rounded-2xl mb-2 border border-[var(--color-wine-100)]">
                                <div className="flex items-center gap-3">
                                    <div className={cn('p-2 rounded-xl', useAdvanced ? 'bg-[var(--color-wine-700)] text-[var(--color-cream)]' : 'bg-white text-[var(--color-wine-700)] border border-[var(--color-wine-200)]')}>
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-[var(--color-wine-700)]">{tt.aiTitle}</p>
                                        <p className="text-[var(--color-smoke-600)] text-[12px]">{tt.aiHint}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useAdvanced}
                                        disabled={isProcessing}
                                        aria-label={tt.aiTitle}
                                        onChange={(e) => { setUseAdvanced(e.target.checked); setProcessedImage(null); }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[var(--color-wine-200)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-wine-100)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-wine-700)]"></div>
                                </label>
                            </div>

                            <p className="text-[12px] text-[var(--color-smoke-600)] mb-5 px-1">
                                {useAdvanced ? s.aiNote : s.basicNote}
                            </p>

                            <PrimaryButton onClick={processImage} disabled={isProcessing} className="w-full py-3.5">
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        {t.common.processing}
                                        {progress !== null && ` ${progress}%`}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        {tt.process}
                                    </>
                                )}
                            </PrimaryButton>
                        </ToolCard>

                        <ToolCard>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-semibold text-[var(--color-wine-700)]">{tt.result}</h2>
                                <button
                                    onClick={copyImage}
                                    disabled={!processedImage}
                                    aria-label={t.common.copy}
                                    title={t.common.copy}
                                    className="p-2 text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-5 border border-[var(--color-wine-100)]">
                                <div className="absolute inset-0 opacity-15" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23552834' fill-opacity='1'%3e%3crect width='10' height='10'/%3e%3crect x='10' y='10' width='10' height='10'/%3e%3c/g%3e%3c/svg%3e")`,
                                }} />

                                {processedImage ? (
                                    <Image src={processedImage} alt="Processed" fill className="object-contain p-3 relative z-10" unoptimized />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-smoke-600)]">
                                        <ImageIcon className="w-10 h-10 mb-2 text-[var(--color-wine-300)]" />
                                        <p className="text-[13px]">{tt.empty}</p>
                                    </div>
                                )}
                            </div>

                            <SecondaryButton onClick={downloadImage} disabled={!processedImage} className="w-full py-3.5">
                                <Download className="w-4 h-4" />
                                {tt.downloadPng}
                            </SecondaryButton>

                            <button
                                onClick={reset}
                                className="w-full mt-3 py-2 text-[13px] font-medium text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] transition-colors"
                            >
                                {s.newImage}
                            </button>
                        </ToolCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </ToolShell>
    );
}
