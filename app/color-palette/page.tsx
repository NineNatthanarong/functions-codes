'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import ColorThief from 'colorthief';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Palette, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard } from '@/components/ToolShell';

export default function ColorPalette() {
    const t = useT();
    const tt = t.pages.colors;
    const [image, setImage] = useState<string | null>(null);
    const [palette, setPalette] = useState<string[]>([]);
    const [dominant, setDominant] = useState<string>('');
    const imgRef = useRef<HTMLImageElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const extract = () => {
        if (!imgRef.current) return;
        try {
            const ct = new ColorThief();
            const dom = ct.getColor(imgRef.current);
            const pal = ct.getPalette(imgRef.current, 5);
            setDominant(`rgb(${dom.join(',')})`);
            setPalette(pal.map((c: number[]) => `rgb(${c.join(',')})`));
        } catch (err) {
            console.error(err);
            toast.error(t.common.errorTryAgain);
        }
    };

    const copy = (color: string) => {
        const rgb = color.match(/\d+/g);
        if (!rgb) return;
        const hex = '#' + rgb.map((x) => {
            const h = parseInt(x).toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('').toUpperCase();
        navigator.clipboard.writeText(hex);
        toast.success(`${tt.copiedToast} ${hex}`);
    };

    return (
        <ToolShell
            icon={<Palette className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Palette"
            width="wide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToolCard>
                    <div
                        className="relative aspect-video bg-[var(--color-wine-50)] rounded-2xl overflow-hidden border-[1.5px] border-[var(--color-wine-100)] mb-5 group cursor-pointer"
                        onClick={() => document.getElementById('image-upload')?.click()}
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
                            </div>
                        )}
                    </div>
                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    <p className="text-center text-[12.5px] text-[var(--color-smoke-600)]">{tt.formats}</p>
                </ToolCard>

                <ToolCard className="h-full">
                    {palette.length > 0 ? (
                        <div>
                            <h2 className="text-base font-semibold text-[var(--color-wine-700)] mb-5 inline-flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                {tt.paletteTitle}
                            </h2>
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => copy(dominant)}
                                className="h-32 rounded-2xl flex items-end p-4 cursor-pointer transition-transform hover:scale-[1.01] mb-3"
                                style={{ backgroundColor: dominant }}
                            >
                                <div className="bg-white/85 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[12px] font-mono font-semibold flex items-center gap-2 text-[var(--color-wine-700)]">
                                    {tt.dominant}
                                    <Copy className="w-3 h-3" />
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-5 gap-2 h-24 mb-6">
                                {palette.map((c, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.07, y: -3 }}
                                        onClick={() => copy(c)}
                                        className="h-full rounded-xl cursor-pointer relative group"
                                        style={{ backgroundColor: c }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Copy className="w-4 h-4 text-white drop-shadow-md" />
                                        </div>
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
