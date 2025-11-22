'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import FileUploader from './components/FileUploader';
import { motion } from 'framer-motion';

const ConversionList = dynamic(() => import('./components/ConversionList'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-32 flex items-center justify-center text-gray-400">
            Loading converter...
        </div>
    )
});

export default function FileConverterPage() {
    const [files, setFiles] = useState<File[]>([]);

    const handleFilesSelected = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleReset = () => {
        setFiles([]);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        File Converter
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Convert PDF, HEIC, and images to PNG, JPEG, or WEBP.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {files.length === 0 ? (
                        <div className="max-w-xl mx-auto">
                            <FileUploader
                                onFilesSelected={handleFilesSelected}
                                accept=".pdf,.heic,.png,.jpg,.jpeg,.webp"
                            />
                        </div>
                    ) : (
                        <ConversionList files={files} onReset={handleReset} />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
