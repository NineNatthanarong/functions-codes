'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Trash2, FilePlus, Scissors, Minimize2, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { cn } from '@/lib/utils';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, GhostButton } from '@/components/ToolShell';

type Tab = 'merge' | 'split' | 'compress';

interface UploadedPDF {
    id: string;
    file: File;
    name: string;
    pageCount: number;
}

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const baseName = (name: string) => name.replace(/\.pdf$/i, '');

export default function PDFTools() {
    const t = useT();
    const tt = t.pages.pdf;
    const { locale } = useLanguage();
    const s = locale === 'th'
        ? {
            selectAll: 'เลือกทั้งหมด',
            clearSelection: 'ล้างที่เลือก',
            remove: 'ลบ',
            moveUp: 'เลื่อนขึ้น',
            moveDown: 'เลื่อนลง',
            encrypted: 'มีรหัสผ่าน — ปลดล็อกไฟล์ก่อนอัปโหลด',
            alreadyOptimized: 'ไฟล์ถูกบีบอัดอยู่แล้ว ไม่สามารถลดขนาดได้อีก',
            page: 'หน้า',
        }
        : {
            selectAll: 'Select all',
            clearSelection: 'Clear selection',
            remove: 'Remove',
            moveUp: 'Move up',
            moveDown: 'Move down',
            encrypted: 'is password-protected — unlock it before uploading',
            alreadyOptimized: 'PDF is already optimized — size could not be reduced',
            page: 'Page',
        };
    const [activeTab, setActiveTab] = useState<Tab>('merge');
    const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const addFiles = async (files: FileList | File[]) => {
        const list = Array.from(files);
        const accepted = activeTab === 'merge' ? list : list.slice(0, 1);
        const newPDFs: UploadedPDF[] = [];
        for (let i = 0; i < accepted.length; i++) {
            const file = accepted[i];
            if (file.type !== 'application/pdf') {
                toast.error(`${file.name} ${tt.notPdf}`);
                continue;
            }
            try {
                const buf = await file.arrayBuffer();
                const doc = await PDFDocument.load(buf);
                newPDFs.push({ id: `${Date.now()}-${i}`, file, name: file.name, pageCount: doc.getPageCount() });
            } catch (err) {
                if (err instanceof Error && /encrypt/i.test(err.message)) {
                    toast.error(`${file.name} ${s.encrypted}`);
                } else {
                    toast.error(`${tt.loadFailed}: ${file.name}`);
                }
            }
        }
        if (newPDFs.length > 0) {
            setUploadedPDFs((prev) => [...prev, ...newPDFs]);
            setSelectedPages([]);
            toast.success(`${newPDFs.length} ${tt.uploadedToast}`);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        if (input.files && input.files.length > 0) await addFiles(input.files);
        input.value = '';
    };

    const downloadPDF = (bytes: Uint8Array, filename: string) => {
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const mergePDFs = async () => {
        if (uploadedPDFs.length < 2) { toast.error(tt.mergeNeed); return; }
        setIsProcessing(true);
        try {
            const merged = await PDFDocument.create();
            for (const pdf of uploadedPDFs) {
                const buf = await pdf.file.arrayBuffer();
                const doc = await PDFDocument.load(buf);
                const pages = await merged.copyPages(doc, doc.getPageIndices());
                pages.forEach((p) => merged.addPage(p));
            }
            const bytes = await merged.save();
            downloadPDF(bytes, `${baseName(uploadedPDFs[0].name)}-merged.pdf`);
            toast.success(tt.mergedToast);
        } catch { toast.error(t.common.errorTryAgain); }
        finally { setIsProcessing(false); }
    };

    const splitPDF = async () => {
        if (uploadedPDFs.length !== 1) { toast.error(tt.splitNeedOne); return; }
        const validPages = selectedPages.filter((p) => p < uploadedPDFs[0].pageCount);
        if (validPages.length === 0) { toast.error(tt.selectAtLeastOne); return; }
        setIsProcessing(true);
        try {
            const buf = await uploadedPDFs[0].file.arrayBuffer();
            const doc = await PDFDocument.load(buf);
            const out = await PDFDocument.create();
            const pages = await out.copyPages(doc, validPages);
            pages.forEach((p) => out.addPage(p));
            const bytes = await out.save();
            downloadPDF(bytes, `${baseName(uploadedPDFs[0].name)}-split.pdf`);
            toast.success(tt.splitToast);
        } catch { toast.error(t.common.errorTryAgain); }
        finally { setIsProcessing(false); }
    };

    const compressPDF = async () => {
        if (uploadedPDFs.length !== 1) { toast.error(tt.splitNeedOne); return; }
        setIsProcessing(true);
        try {
            const buf = await uploadedPDFs[0].file.arrayBuffer();
            const doc = await PDFDocument.load(buf);
            doc.setTitle(''); doc.setAuthor(''); doc.setSubject('');
            doc.setKeywords([]); doc.setProducer(''); doc.setCreator('');
            const bytes = await doc.save({ useObjectStreams: true });
            const original = uploadedPDFs[0].file.size;
            if (bytes.length < original) {
                const reduction = Math.round(((original - bytes.length) / original) * 100);
                downloadPDF(bytes, `${baseName(uploadedPDFs[0].name)}-compressed.pdf`);
                toast.success(`${tt.compressedToast} ${reduction}% (${formatSize(original)} → ${formatSize(bytes.length)})`);
            } else {
                toast.info(s.alreadyOptimized);
            }
        } catch { toast.error(t.common.errorTryAgain); }
        finally { setIsProcessing(false); }
    };

    const removePDF = (id: string) => {
        setUploadedPDFs((prev) => prev.filter((p) => p.id !== id));
        setSelectedPages([]);
    };
    const clearAll = () => { setUploadedPDFs([]); setSelectedPages([]); };

    const movePDF = (index: number, dir: -1 | 1) => {
        setUploadedPDFs((prev) => {
            const target = index + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const togglePage = (idx: number) => {
        setSelectedPages((prev) =>
            prev.includes(idx) ? prev.filter((p) => p !== idx) : [...prev, idx].sort((a, b) => a - b)
        );
    };

    const handleProcess = () => {
        if (activeTab === 'merge') mergePDFs();
        else if (activeTab === 'split') splitPDF();
        else compressPDF();
    };

    const requirementHint =
        uploadedPDFs.length === 0 ? null
            : activeTab === 'merge' && uploadedPDFs.length < 2 ? tt.mergeNeed
            : activeTab !== 'merge' && uploadedPDFs.length !== 1 ? tt.splitNeedOne
            : activeTab === 'split' && selectedPages.length === 0 ? tt.selectAtLeastOne
            : null;

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'merge', label: tt.merge, icon: <FilePlus className="w-4 h-4" /> },
        { key: 'split', label: tt.split, icon: <Scissors className="w-4 h-4" /> },
        { key: 'compress', label: tt.compress, icon: <Minimize2 className="w-4 h-4" /> },
    ];

    return (
        <ToolShell
            icon={<FileText className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="PDF"
            width="xwide"
        >
            <div className="flex justify-center mb-6">
                <div className="inline-flex p-1 bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] rounded-2xl">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'relative px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors inline-flex items-center gap-2',
                                    active ? 'text-[var(--color-cream)]' : 'text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)]'
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="pdf-tab"
                                        className="absolute inset-0 bg-[var(--color-wine-700)] rounded-xl -z-0"
                                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                    />
                                )}
                                <span className="relative z-10 inline-flex items-center gap-2">
                                    {tab.icon}
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <ToolCard>
                <label
                    htmlFor="pdf-upload"
                    className={cn(
                        'block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6',
                        isDragging
                            ? 'border-[var(--color-wine-400)] bg-[var(--color-wine-50)]'
                            : 'border-[var(--color-wine-200)] hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)] focus-within:border-[var(--color-wine-400)]'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
                    }}
                >
                    <input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        multiple={activeTab === 'merge'}
                        className="sr-only"
                        onChange={handleFileUpload}
                    />
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-16 h-16 bg-[var(--color-wine-100)] rounded-2xl flex items-center justify-center mb-4 mx-auto text-[var(--color-wine-700)]"
                    >
                        <Upload className="w-7 h-7" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-[var(--color-wine-700)] mb-1.5">
                        {activeTab === 'merge' ? tt.uploadMerge : tt.uploadSingle}
                    </h3>
                    <p className="text-[13px] text-[var(--color-smoke-600)]">{tt.uploadHint}</p>
                </label>

                {uploadedPDFs.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">{tt.files}</h3>
                            <GhostButton tone="danger" onClick={clearAll}>
                                <Trash2 className="w-3.5 h-3.5" />
                                {t.common.clearAll}
                            </GhostButton>
                        </div>
                        {uploadedPDFs.map((pdf, index) => (
                            <motion.div
                                key={pdf.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-4 bg-[var(--color-wine-50)] rounded-2xl border border-[var(--color-wine-100)]"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="w-7 h-7 text-[var(--color-wine-700)] shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-[var(--color-wine-700)] truncate">{pdf.name}</p>
                                        <p className="text-[12px] text-[var(--color-smoke-600)]">{pdf.pageCount} {tt.pages} · {formatSize(pdf.file.size)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-3">
                                    {activeTab === 'merge' && uploadedPDFs.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => movePDF(index, -1)}
                                                disabled={index === 0}
                                                aria-label={`${s.moveUp}: ${pdf.name}`}
                                                className="p-2 text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)] rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => movePDF(index, 1)}
                                                disabled={index === uploadedPDFs.length - 1}
                                                aria-label={`${s.moveDown}: ${pdf.name}`}
                                                className="p-2 text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)] rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => removePDF(pdf.id)}
                                        aria-label={`${s.remove} ${pdf.name}`}
                                        className="p-2 text-[#a4364c] hover:bg-[#fbe3e7] rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === 'split' && uploadedPDFs.length === 1 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">{tt.selectPages}</h3>
                            <div className="flex items-center gap-1.5">
                                <GhostButton
                                    onClick={() => setSelectedPages(Array.from({ length: uploadedPDFs[0].pageCount }, (_, i) => i))}
                                    disabled={selectedPages.length === uploadedPDFs[0].pageCount}
                                >
                                    {s.selectAll}
                                </GhostButton>
                                <GhostButton onClick={() => setSelectedPages([])} disabled={selectedPages.length === 0}>
                                    {s.clearSelection}
                                </GhostButton>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                            {Array.from({ length: uploadedPDFs[0].pageCount }, (_, i) => i).map((idx) => {
                                const sel = selectedPages.includes(idx);
                                return (
                                    <motion.button
                                        key={idx}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => togglePage(idx)}
                                        aria-pressed={sel}
                                        aria-label={`${s.page} ${idx + 1}`}
                                        className={cn(
                                            'aspect-square rounded-xl border-[1.5px] font-semibold transition-all text-[13px]',
                                            sel
                                                ? 'border-[var(--color-wine-700)] bg-[var(--color-wine-700)] text-[var(--color-cream)]'
                                                : 'border-[var(--color-wine-100)] bg-white text-[var(--color-wine-700)] hover:border-[var(--color-wine-300)]'
                                        )}
                                    >
                                        {idx + 1}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {requirementHint && (
                    <p className="text-[12.5px] text-[var(--color-smoke-600)] text-center mb-3">{requirementHint}</p>
                )}
                <PrimaryButton
                    onClick={handleProcess}
                    disabled={isProcessing || uploadedPDFs.length === 0 || requirementHint !== null}
                    className="w-full py-4"
                >
                    {isProcessing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-[var(--color-cream)] border-t-transparent rounded-full animate-spin" />
                            {tt.processing}
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            {activeTab === 'merge' && tt.actionMerge}
                            {activeTab === 'split' && tt.actionSplit}
                            {activeTab === 'compress' && tt.actionCompress}
                        </>
                    )}
                </PrimaryButton>
            </ToolCard>
        </ToolShell>
    );
}
