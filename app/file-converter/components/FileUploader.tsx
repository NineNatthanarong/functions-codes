'use client';

import { useState, useCallback } from 'react';
import { Upload, FileType } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
}

export default function FileUploader({ onFilesSelected, accept }: FileUploaderProps) {
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
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                "relative group cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300",
                isDragging
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50"
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
            <div className="flex flex-col items-center gap-6">
                <div className={cn(
                    "p-5 rounded-2xl transition-colors duration-300",
                    isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                )}>
                    <Upload className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">
                        Click or drag files here
                    </p>
                    <p className="text-gray-500 flex items-center justify-center gap-2">
                        <FileType className="w-4 h-4" />
                        Supports PDF, HEIC, PNG, JPEG, WEBP
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
