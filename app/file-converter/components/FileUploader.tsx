'use client';

import { useState, useCallback } from 'react';
import { Upload, FileType } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
}

export default function FileUploader({ onFilesSelected, accept }: FileUploaderProps) {
    const t = useT();
    const tt = t.pages.converter;
    const { locale } = useLanguage();
    const s = locale === 'th'
        ? { unsupported: 'ไฟล์ประเภทนี้ไม่รองรับ' }
        : { unsupported: 'Unsupported file type' };
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        // Ignore dragleave fired when moving over the dropzone's own children.
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
        const dropped = Array.from(e.dataTransfer.files);
        const acceptedExts = accept
            ?.split(',')
            .map((ext) => ext.trim().toLowerCase())
            .filter(Boolean);
        const isAccepted = (file: File) =>
            !acceptedExts || acceptedExts.some((ext) => file.name.toLowerCase().endsWith(ext));
        const rejected = dropped.filter((f) => !isAccepted(f));
        if (rejected.length > 0) {
            toast.error(`${s.unsupported}: ${rejected.map((f) => f.name).join(', ')}`);
        }
        const okFiles = dropped.filter(isAccepted);
        if (okFiles.length > 0) {
            onFilesSelected(okFiles);
        }
    }, [onFilesSelected, accept, s.unsupported]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
        // Allow re-selecting the same file(s) later.
        e.target.value = '';
    }, [onFilesSelected]);

    const openFilePicker = useCallback(() => {
        document.getElementById('file-input')?.click();
    }, []);

    return (
        <motion.div
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            role="button"
            tabIndex={0}
            aria-label={tt.uploadTitle}
            className={cn(
                'relative group cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-wine-600)] outline-none',
                isDragging
                    ? 'border-[var(--color-wine-600)] bg-[var(--color-wine-50)]'
                    : 'border-[var(--color-wine-200)] hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFilePicker();
                }
            }}
        >
            <input
                type="file"
                id="file-input"
                className="hidden"
                multiple
                accept={accept}
                onChange={handleFileInput}
            />
            <div className="flex flex-col items-center gap-5">
                <motion.div
                    animate={{ y: isDragging ? -3 : [0, -4, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className={cn(
                        'p-5 rounded-2xl transition-colors duration-300',
                        isDragging
                            ? 'bg-[var(--color-wine-700)] text-[var(--color-cream)]'
                            : 'bg-[var(--color-wine-100)] text-[var(--color-wine-700)] group-hover:bg-[var(--color-wine-700)] group-hover:text-[var(--color-cream)]'
                    )}
                >
                    <Upload className="w-8 h-8" strokeWidth={1.6} />
                </motion.div>
                <div>
                    <p className="text-xl font-semibold text-[var(--color-wine-700)] mb-1.5">
                        {tt.uploadTitle}
                    </p>
                    <p className="text-[var(--color-smoke-600)] text-[13.5px] flex items-center justify-center gap-2">
                        <FileType className="w-3.5 h-3.5" />
                        {tt.uploadHint}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
