'use client';

import { useState } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { Upload, Download, Settings2, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextInput, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

export default function ImageCompressor() {
    const t = useT();
    const tt = t.pages.compressor;
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [compressedImage, setCompressedImage] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [options, setOptions] = useState({
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    });

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t.common.pleaseSelectImage);
            return;
        }
        setOriginalImage(file);
        setCompressedImage(null);
    };

    const compress = async () => {
        if (!originalImage) return;
        setIsCompressing(true);
        try {
            const result = await imageCompression(originalImage, options);
            setCompressedImage(result);
            toast.success(tt.successToast);
        } catch (err) {
            console.error(err);
            toast.error(tt.failToast);
        } finally {
            setIsCompressing(false);
        }
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

    return (
        <ToolShell
            icon={<ImageIcon className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker={t.tools['image-compressor'].title}
            width="xwide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
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
                                    value={options.maxSizeMB}
                                    onChange={(e) => setOptions((p) => ({ ...p, maxSizeMB: parseFloat(e.target.value) || 1 }))}
                                />
                            </div>
                            <div>
                                <FieldLabel hint={tt.maxDimHint}>{tt.maxDim}</FieldLabel>
                                <TextInput
                                    type="number"
                                    step="100"
                                    value={options.maxWidthOrHeight}
                                    onChange={(e) => setOptions((p) => ({ ...p, maxWidthOrHeight: parseInt(e.target.value) || 1920 }))}
                                />
                            </div>

                            <PrimaryButton onClick={compress} disabled={isCompressing || !originalImage} className="w-full py-3.5">
                                {isCompressing ? (
                                    <>
                                        <Settings2 className="w-4 h-4 animate-spin" />
                                        {tt.compressing}
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

                <div className="lg:col-span-8">
                    <ToolCard className="min-h-[460px]">
                        {!originalImage ? (
                            <div
                                className="h-full border-2 border-dashed border-[var(--color-wine-200)] rounded-2xl flex flex-col items-center justify-center text-center p-12 cursor-pointer hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)] transition-all"
                                onClick={() => document.getElementById('image-upload')?.click()}
                            >
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
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
                            </div>
                        ) : (
                            <div className="space-y-7">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[var(--color-wine-700)]">{tt.original}</h3>
                                            <span className="text-[12.5px] text-[var(--color-smoke-600)]">{formatSize(originalImage.size)}</span>
                                        </div>
                                        <div className="relative aspect-video bg-[var(--color-wine-50)] rounded-2xl overflow-hidden border border-[var(--color-wine-100)]">
                                            <Image src={URL.createObjectURL(originalImage)} alt="orig" fill className="object-contain" unoptimized />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[var(--color-wine-700)]">{tt.compressed}</h3>
                                            {compressedImage && (
                                                <span className="text-[12.5px] font-semibold text-[#3d6a4a] inline-flex items-center gap-2">
                                                    {formatSize(compressedImage.size)}
                                                    <span className="text-[11px] bg-[#dbe8d3] text-[#2c4a26] px-2 py-0.5 rounded-full">
                                                        −{Math.round((1 - compressedImage.size / originalImage.size) * 100)}%
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative aspect-video bg-[var(--color-wine-50)] rounded-2xl overflow-hidden border border-[var(--color-wine-100)] flex items-center justify-center">
                                            {compressedImage ? (
                                                <Image src={URL.createObjectURL(compressedImage)} alt="comp" fill className="object-contain" unoptimized />
                                            ) : (
                                                <div className="text-[var(--color-smoke-600)] text-center">
                                                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[var(--color-wine-300)]" />
                                                    <p className="text-[12.5px]">{tt.waiting}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setOriginalImage(null); setCompressedImage(null); }}
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
