'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import ColorThief from 'colorthief';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Palette, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, SecondaryButton } from '@/components/ToolShell';

const toHex = (c: number[]) =>
    '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();

export default function ColorPalette() {
    const t = useT();
    const tt = t.pages.colors;
    const { locale } = useLanguage();
    const s = locale === 'th' ? {
        kicker: 'พาเลตต์',
        copyAll: 'คัดลอกทั้งหมด',
        copiedAll: 'คัดลอกทุกสีแล้ว',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้งนะ',
        copyColor: 'คัดลอกสี',
        uploadAria: 'อัปโหลดรูปภาพ',
        pasteHint: 'ลากไฟล์มาวาง หรือกด Ctrl+V เพื่อวางรูป',
    } : {
        kicker: 'Palette',
        copyAll: 'Copy all',
        copiedAll: 'Copied all colors',
        copyFailed: 'Copy failed. Please try again.',
        copyColor: 'Copy color',
        uploadAria: 'Upload image',
        pasteHint: 'Drag & drop or press Ctrl+V to paste an image',
    };
    const [image, setImage] = useState<string | null>(null);
    const [palette, setPalette] = useState<string[]>([]);
    const [dominant, setDominant] = useState<string>('');
    const [dragActive, setDragActive] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPalette([]);
            setDominant('');
            setImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, [t]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        loadFile(file);
                    }
                    return;
                }
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [loadFile]);

    const extract = () => {
        if (!imgRef.current) return;
        try {
            const ct = new ColorThief();
            const dom = ct.getColor(imgRef.current);
            const pal = ct.getPalette(imgRef.current, 5);
            setDominant(toHex(dom));
            setPalette(pal.map((c: number[]) => toHex(c)));
        } catch (err) {
            console.error(err);
            toast.error(t.common.errorTryAgain);
        }
    };

    const copy = async (hex: string) => {
        try {
            await navigator.clipboard.writeText(hex);
            toast.success(`${tt.copiedToast} ${hex}`);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const copyAll = async () => {
        if (palette.length === 0) return;
        try {
            await navigator.clipboard.writeText(palette.join(', '));
            toast.success(s.copiedAll);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    return (
        <ToolShell
            icon={<Palette className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker={s.kicker}
            width="wide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToolCard>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label={image ? tt.changeImage : s.uploadAria}
                        className={`relative aspect-video rounded-2xl overflow-hidden border-[1.5px] mb-5 group cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wine-400)] ${
                            dragActive
                                ? 'bg-[var(--color-wine-100)]/60 border-[var(--color-wine-600)]'
                                : 'bg-[var(--color-wine-50)] border-[var(--color-wine-100)]'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {image ? (
                            <>
                                <Image
                                    ref={imgRef}
                                    src={image}
                                    alt="source"
                                    fill
                                    className="object-contain"
                                    onLoad={extract}
                                    onError={() => {
                                        setImage(null);
                                        toast.error(t.common.errorTryAgain);
                                    }}
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-[var(--color-wine-900)]/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-[var(--color-cream)] text-[var(--color-wine-700)] px-4 py-2 rounded-full text-[13px] font-semibold inline-flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        {tt.changeImage}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-smoke-600)] hover:bg-[var(--color-wine-100)]/40 transition-colors">
                                <ImageIcon className="w-10 h-10 mb-2 text-[var(--color-wine-300)]" />
                                <p className="text-[14px] font-semibold text-[var(--color-wine-700)]">{tt.upload}</p>
                                <p className="text-[12px] mt-1">{s.pasteHint}</p>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    <p className="text-center text-[12.5px] text-[var(--color-smoke-600)]">{tt.formats}</p>
                </ToolCard>

                <ToolCard className="h-full">
                    {palette.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between gap-3 mb-5">
                                <h2 className="text-base font-semibold text-[var(--color-wine-700)] inline-flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    {tt.paletteTitle}
                                </h2>
                                <SecondaryButton onClick={copyAll}>
                                    <Copy className="w-3.5 h-3.5" />
                                    {s.copyAll}
                                </SecondaryButton>
                            </div>
                            <motion.button
                                type="button"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => copy(dominant)}
                                aria-label={`${s.copyColor} ${dominant}`}
                                className="w-full h-32 rounded-2xl flex items-end p-4 cursor-pointer transition-transform hover:scale-[1.01] mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wine-400)]"
                                style={{ backgroundColor: dominant }}
                            >
                                <span className="bg-white/85 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[12px] font-mono font-semibold flex items-center gap-2 text-[var(--color-wine-700)]">
                                    {tt.dominant}
                                    <span>{dominant}</span>
                                    <Copy className="w-3 h-3" />
                                </span>
                            </motion.button>

                            <div className="grid grid-cols-5 gap-2 mb-6">
                                {palette.map((c, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex flex-col items-center gap-1.5"
                                    >
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.07, y: -3 }}
                                            onClick={() => copy(c)}
                                            aria-label={`${s.copyColor} ${c}`}
                                            className="h-20 w-full rounded-xl cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wine-400)]"
                                            style={{ backgroundColor: c }}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                                                <span className="bg-[var(--color-wine-900)]/50 rounded-full p-1.5">
                                                    <Copy className="w-3.5 h-3.5 text-white" />
                                                </span>
                                            </span>
                                        </motion.button>
                                        <span className="text-[11px] font-mono font-medium text-[var(--color-smoke-600)]">{c}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <p className="text-center text-[12.5px] text-[var(--color-smoke-600)] bg-[var(--color-wine-50)] rounded-xl py-3 px-4">
                                {tt.copyHint}
                            </p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-[var(--color-smoke-600)]">
                            <Palette className="w-14 h-14 mb-4 text-[var(--color-wine-300)]" />
                            <h3 className="text-base font-semibold text-[var(--color-wine-700)] mb-1.5">{tt.emptyTitle}</h3>
                            <p className="text-sm">{tt.emptyHint}</p>
                        </div>
                    )}
                </ToolCard>
            </div>
        </ToolShell>
    );
}
