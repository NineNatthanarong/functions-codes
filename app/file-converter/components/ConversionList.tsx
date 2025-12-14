'use client';

import { useState } from 'react';
import { ConversionFormat, ConvertedFile, convertPdfToImages, convertHeicToImage, convertImageToImage } from '../utils/converter';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface FileItem {
    id: string;
    file: File;
    status: 'pending' | 'converting' | 'completed' | 'error';
    result?: ConvertedFile[];
    error?: string;
}

interface ConversionListProps {
    files: File[];
    onReset: () => void;
}

export default function ConversionList({ files: initialFiles, onReset }: ConversionListProps) {
    const [fileItems, setFileItems] = useState<FileItem[]>(
        initialFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            status: 'pending'
        }))
    );
    const [targetFormat, setTargetFormat] = useState<ConversionFormat>('image/png');
    const [isConvertingAll, setIsConvertingAll] = useState(false);

    const convertFile = async (item: FileItem) => {
        try {
            setFileItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting' } : i));

            let results: ConvertedFile[] = [];
            const fileType = item.file.type.toLowerCase();
            const fileName = item.file.name.toLowerCase();

            if (fileType === 'application/pdf') {
                results = await convertPdfToImages(item.file, targetFormat);
            } else if (fileType === 'image/heic' || fileName.endsWith('.heic')) {
                results = await convertHeicToImage(item.file, targetFormat);
            } else if (fileType.startsWith('image/')) {
                const result = await convertImageToImage(item.file, targetFormat);
                results = [result];
            } else {
                throw new Error('Unsupported file type');
            }

            setFileItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'completed', result: results } : i));
            toast.success(`Converted ${item.file.name} successfully`);
        } catch {
            setFileItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: 'Conversion failed' } : i));
            toast.error(`Failed to convert ${item.file.name}`);
        }
    };

    const handleConvertAll = async () => {
        setIsConvertingAll(true);
        try {
            await Promise.all(fileItems.filter(i => i.status !== 'completed').map(convertFile));
            toast.success('All files processed');
        } catch (error) {
            // Individual errors are handled in convertFile
        } finally {
            setIsConvertingAll(false);
        }
    };

    const handleDownload = (item: FileItem) => {
        if (!item.result) return;

        if (item.result.length === 1) {
            saveAs(item.result[0].blob, item.result[0].name);
        } else {
            const zip = new JSZip();
            item.result.forEach(file => {
                zip.file(file.name, file.blob);
            });
            zip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, `${item.file.name.split('.')[0]}_converted.zip`);
            });
        }
        toast.success('Download started');
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        let hasFiles = false;

        fileItems.forEach(item => {
            if (item.result) {
                item.result.forEach(file => {
                    zip.file(file.name, file.blob);
                    hasFiles = true;
                });
            }
        });

        if (hasFiles) {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'all_converted_files.zip');
            toast.success('Download started');
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Convert to:</span>
                    <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value as ConversionFormat)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        disabled={isConvertingAll}
                    >
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/webp">WEBP</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        disabled={isConvertingAll}
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleConvertAll}
                        disabled={isConvertingAll || fileItems.every(i => i.status === 'completed')}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConvertingAll ? 'Converting...' : 'Convert All'}
                    </button>
                    {fileItems.some(i => i.status === 'completed') && (
                        <button
                            onClick={handleDownloadAll}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-900"
                        >
                            Download All
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {fileItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500 dark:text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {item.file.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {item.status === 'converting' && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            )}
                            {item.status === 'completed' && (
                                <button
                                    onClick={() => handleDownload(item)}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                                >
                                    Download
                                </button>
                            )}
                            {item.status === 'error' && (
                                <span className="text-red-500 text-sm">{item.error}</span>
                            )}
                            {item.status === 'pending' && (
                                <span className="text-gray-400 text-sm">Ready</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
