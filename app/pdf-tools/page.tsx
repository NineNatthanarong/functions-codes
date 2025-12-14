'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Trash2, FilePlus, Scissors, Minimize2, FileText, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { cn } from '@/lib/utils';

type Tab = 'merge' | 'split' | 'compress';

interface UploadedPDF {
    id: string;
    file: File;
    name: string;
    pageCount: number;
}

export default function PDFTools() {
    const [activeTab, setActiveTab] = useState<Tab>('merge');
    const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPDFs: UploadedPDF[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== 'application/pdf') {
                toast.error(`${file.name} is not a PDF file`);
                continue;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pageCount = pdfDoc.getPageCount();

                newPDFs.push({
                    id: `${Date.now()}-${i}`,
                    file,
                    name: file.name,
                    pageCount,
                });
            } catch (error) {
                toast.error(`Failed to load ${file.name}`);
            }
        }

        setUploadedPDFs((prev) => [...prev, ...newPDFs]);
        toast.success(`${newPDFs.length} PDF(s) uploaded`);
    };

    const mergePDFs = async () => {
        if (uploadedPDFs.length < 2) {
            toast.error('Please upload at least 2 PDFs to merge');
            return;
        }

        setIsProcessing(true);
        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdf of uploadedPDFs) {
                const arrayBuffer = await pdf.file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            downloadPDF(mergedPdfBytes, 'merged.pdf');
            toast.success('PDFs merged successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to merge PDFs');
        } finally {
            setIsProcessing(false);
        }
    };

    const splitPDF = async () => {
        if (uploadedPDFs.length !== 1) {
            toast.error('Please upload exactly 1 PDF to split');
            return;
        }

        if (selectedPages.length === 0) {
            toast.error('Please select pages to extract');
            return;
        }

        setIsProcessing(true);
        try {
            const arrayBuffer = await uploadedPDFs[0].file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            downloadPDF(pdfBytes, 'split.pdf');
            toast.success('PDF split successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to split PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    const compressPDF = async () => {
        if (uploadedPDFs.length !== 1) {
            toast.error('Please upload exactly 1 PDF to compress');
            return;
        }

        setIsProcessing(true);
        try {
            const arrayBuffer = await uploadedPDFs[0].file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Remove metadata to reduce size
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            const pdfBytes = await pdfDoc.save({
                useObjectStreams: false,
            });

            const originalSize = uploadedPDFs[0].file.size;
            const newSize = pdfBytes.length;
            const reduction = Math.round(((originalSize - newSize) / originalSize) * 100);

            downloadPDF(pdfBytes, 'compressed.pdf');
            toast.success(`PDF compressed! Reduced by ${reduction}%`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to compress PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const removePDF = (id: string) => {
        setUploadedPDFs((prev) => prev.filter((pdf) => pdf.id !== id));
    };

    const clearAll = () => {
        setUploadedPDFs([]);
        setSelectedPages([]);
    };

    const togglePageSelection = (pageIndex: number) => {
        setSelectedPages((prev) =>
            prev.includes(pageIndex)
                ? prev.filter((p) => p !== pageIndex)
                : [...prev, pageIndex].sort((a, b) => a - b)
        );
    };

    const handleProcess = () => {
        if (activeTab === 'merge') mergePDFs();
        else if (activeTab === 'split') splitPDF();
        else if (activeTab === 'compress') compressPDF();
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        PDF Tools Suite
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Merge, split, and compress PDFs. All processing happens in your browser.
                    </motion.p>
                </div>

                {/* Tab Switcher */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex bg-gray-100 rounded-2xl p-1">
                        <button
                            onClick={() => setActiveTab('merge')}
                            className={cn(
                                'px-6 py-3 rounded-xl font-medium transition-all',
                                activeTab === 'merge'
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            <FilePlus className="w-4 h-4 inline-block mr-2" />
                            Merge
                        </button>
                        <button
                            onClick={() => setActiveTab('split')}
                            className={cn(
                                'px-6 py-3 rounded-xl font-medium transition-all',
                                activeTab === 'split'
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            <Scissors className="w-4 h-4 inline-block mr-2" />
                            Split
                        </button>
                        <button
                            onClick={() => setActiveTab('compress')}
                            className={cn(
                                'px-6 py-3 rounded-xl font-medium transition-all',
                                activeTab === 'compress'
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            <Minimize2 className="w-4 h-4 inline-block mr-2" />
                            Compress
                        </button>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
                >
                    {/* Upload Area */}
                    <div
                        className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all mb-8"
                        onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                        <input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            multiple={activeTab === 'merge'}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6 mx-auto text-violet-500">
                            <Upload className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {activeTab === 'merge' ? 'Upload PDFs to Merge' : 'Upload PDF'}
                        </h3>
                        <p className="text-gray-500">
                            Click to browse or drag files here
                        </p>
                    </div>

                    {/* Uploaded Files */}
                    {uploadedPDFs.length > 0 && (
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Uploaded Files</h3>
                                <button
                                    onClick={clearAll}
                                    className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </button>
                            </div>
                            {uploadedPDFs.map((pdf) => (
                                <div
                                    key={pdf.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-violet-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">{pdf.name}</p>
                                            <p className="text-sm text-gray-500">{pdf.pageCount} pages</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removePDF(pdf.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Page Selection for Split */}
                    {activeTab === 'split' && uploadedPDFs.length === 1 && (
                        <div className="mb-8">
                            <h3 className="font-semibold text-gray-900 mb-4">Select Pages to Extract</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {Array.from({ length: uploadedPDFs[0].pageCount }, (_, i) => i).map((pageIndex) => (
                                    <button
                                        key={pageIndex}
                                        onClick={() => togglePageSelection(pageIndex)}
                                        className={cn(
                                            'aspect-square rounded-xl border-2 font-medium transition-all',
                                            selectedPages.includes(pageIndex)
                                                ? 'border-violet-500 bg-violet-50 text-violet-600'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
                                        )}
                                    >
                                        {pageIndex + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || uploadedPDFs.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                {activeTab === 'merge' && 'Merge PDFs'}
                                {activeTab === 'split' && 'Extract Pages'}
                                {activeTab === 'compress' && 'Compress PDF'}
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
