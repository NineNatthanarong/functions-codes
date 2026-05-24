'use client';

import { useState } from 'react';
import { ConversionFormat, ConvertedFile, convertPdfToImages, convertHeicToImage, convertImageToImage } from '../utils/converter';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { useT } from '@/lib/i18n/LanguageProvider';
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ToolShell';

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
    const t = useT();
    const tt = t.pages.converter;
    const [fileItems, setFileItems] = useState<FileItem[]>(
        initialFiles.map((f) => ({
            id: Math.random().toString(36).substring(2, 11),
            file: f,
            status: 'pending',
        }))
    );
    const [targetFormat, setTargetFormat] = useState<ConversionFormat>('image/png');
    const [isConvertingAll, setIsConvertingAll] = useState(false);

    const convertFile = async (item: FileItem) => {
        try {
            setFileItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'converting' } : i)));
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
                throw new Error('Unsupported');
            }

            setFileItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'completed', result: results } : i)));
            toast.success(`${tt.successOne}: ${item.file.name}`);
        } catch {
            setFileItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: tt.failOne } : i)));
            toast.error(`${tt.failOne}: ${item.file.name}`);
        }
    };

    const handleConvertAll = async () => {
        setIsConvertingAll(true);
        try {
            await Promise.all(fileItems.filter((i) => i.status !== 'completed').map(convertFile));
            toast.success(tt.successAll);
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
            item.result.forEach((f) => zip.file(f.name, f.blob));
            zip.generateAsync({ type: 'blob' }).then((content) =>
                saveAs(content, `${item.file.name.split('.')[0]}_converted.zip`)
            );
        }
        toast.success(t.common.downloadStarted);
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        let has = false;
        fileItems.forEach((item) => {
            if (item.result) {
                item.result.forEach((f) => { zip.file(f.name, f.blob); has = true; });
            }
        });
        if (has) {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'all_converted_files.zip');
            toast.success(t.common.downloadStarted);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] shadow-soft">
                <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">{tt.convertTo}</span>
                    <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value as ConversionFormat)}
                        className="bg-[var(--color-wine-50)] border-[1.5px] border-[var(--color-wine-100)] text-[var(--color-wine-700)] text-[13px] rounded-xl focus:ring-2 focus:ring-[var(--color-wine-100)] focus:border-[var(--color-wine-600)] block px-3 py-2 outline-none"
                        disabled={isConvertingAll}
                    >
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/webp">WEBP</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-2">
                    <GhostButton tone="danger" onClick={onReset} disabled={isConvertingAll}>
                        {tt.clearAll}
                    </GhostButton>
                    <PrimaryButton onClick={handleConvertAll} disabled={isConvertingAll || fileItems.every((i) => i.status === 'completed')}>
                        {isConvertingAll ? tt.converting : tt.convertAll}
                    </PrimaryButton>
                    {fileItems.some((i) => i.status === 'completed') && (
                        <SecondaryButton onClick={handleDownloadAll}>
                            {tt.downloadAll}
                        </SecondaryButton>
                    )}
                </div>
            </div>

            <div className="space-y-2.5">
                {fileItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-white rounded-2xl border-[1.5px] border-[var(--color-wine-100)] shadow-soft"
                    >
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="p-2.5 bg-[var(--color-wine-50)] rounded-xl shrink-0">
                                <FileText className="w-5 h-5 text-[var(--color-wine-700)]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-[var(--color-wine-700)] truncate">{item.file.name}</p>
                                <p className="text-[12px] text-[var(--color-smoke-600)]">
                                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {item.status === 'converting' && (
                                <div className="w-4 h-4 border-2 border-[var(--color-wine-600)] border-t-transparent rounded-full animate-spin" />
                            )}
                            {item.status === 'completed' && (
                                <button
                                    onClick={() => handleDownload(item)}
                                    className="text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)] font-semibold text-[13px]"
                                >
                                    {tt.download}
                                </button>
                            )}
                            {item.status === 'error' && (
                                <span className="text-[#a4364c] text-[12.5px]">{item.error}</span>
                            )}
                            {item.status === 'pending' && (
                                <span className="text-[var(--color-smoke-600)] text-[12.5px]">{tt.ready}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
