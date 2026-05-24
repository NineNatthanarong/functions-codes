'use client';

import { useState, useCallback } from 'react';
import { Upload, FileType } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
}

export default function FileUploader({ onFilesSelected, accept }: FileUploaderProps) {
    const t = useT();
    const tt = t.pages.converter;
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(Array.from(e.dataTransfer.files));
        }
    }, [onFilesSelected]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
    }, [onFilesSelected]);

    return (
        <motion.div
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className={cn(
                'relative group cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 bg-white',
                isDragging
                    ? 'border-[var(--color-wine-600)] bg-[var(--color-wine-50)]'
                    : 'border-[var(--color-wine-200)] hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)]/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
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
