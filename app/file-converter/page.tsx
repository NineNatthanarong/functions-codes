'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FileUploader from './components/FileUploader';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell from '@/components/ToolShell';

const ConversionList = dynamic(() => import('./components/ConversionList'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-32 flex items-center justify-center text-[var(--color-smoke-600)]">
            ...
        </div>
    ),
});

export default function FileConverterPage() {
    const t = useT();
    const tt = t.pages.converter;
    const { locale } = useLanguage();
    const [files, setFiles] = useState<File[]>([]);

    const handleFilesSelected = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleReset = () => setFiles([]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const pasted = Array.from(e.clipboardData?.files ?? []).filter(
                (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
            );
            if (pasted.length === 0) return;
            e.preventDefault();
            setFiles((prev) => [...prev, ...pasted]);
            toast.success(locale === 'th' ? 'เพิ่มไฟล์จากคลิปบอร์ดแล้ว' : 'Added from clipboard');
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [locale]);

    return (
        <ToolShell
            icon={<FileText className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker={t.tools['file-converter'].title}
            width="wide"
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
        </ToolShell>
    );
}
