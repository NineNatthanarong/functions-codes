'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Save, FileText, Eye, Code, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { GhostButton, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

export default function MarkdownEditor() {
    const t = useT();
    const tt = t.pages.markdown;
    const [markdown, setMarkdown] = useState<string>(tt.defaultText);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('markdown-draft');
        if (saved) {
            setMarkdown(saved);
            toast.success(tt.loadedToast);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('markdown-draft', markdown);
        }, 5000);
        const words = markdown.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setCharCount(markdown.length);
        return () => clearTimeout(timer);
    }, [markdown]);

    const exportAsHTML = () => {
        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Markdown export</title>
<style>
body { font-family: 'IBM Plex Sans Thai', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1c0d12; background: #f7f4f4; }
h1, h2, h3 { color: #552834; }
code { background: #f1dde2; padding: 2px 6px; border-radius: 4px; font-family: 'IBM Plex Mono', monospace; color: #552834; }
pre { background: #2a131a; color: #faf6f3; padding: 16px; border-radius: 12px; overflow-x: auto; }
pre code { background: none; padding: 0; color: inherit; }
blockquote { border-left: 4px solid #c98a98; padding-left: 16px; color: #6f5f5f; margin: 16px 0; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; }
th, td { border: 1px solid #e2dada; padding: 12px; text-align: left; }
th { background: #f1dde2; }
a { color: #552834; }
</style></head><body>${document.getElementById('markdown-preview')?.innerHTML || ''}</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'markdown-export.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(tt.htmlToast);
    };

    const exportAsPDF = async () => {
        const element = document.getElementById('markdown-preview');
        if (!element) return;
        toast.info(tt.pdfBuildingToast);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save('markdown-export.pdf');
            toast.success(tt.pdfDoneToast);
        } catch (err) {
            console.error(err);
            toast.error(tt.pdfFailToast);
        }
    };

    const insertMarkdown = (syntax: string, placeholder = 'text') => {
        const ta = document.getElementById('markdown-input') as HTMLTextAreaElement;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const sel = markdown.substring(start, end) || placeholder;
        const before = markdown.substring(0, start);
        const after = markdown.substring(end);
        let newText = '';
        let cursor = start;
        switch (syntax) {
            case 'bold': newText = `${before}**${sel}**${after}`; cursor = start + 2; break;
            case 'italic': newText = `${before}*${sel}*${after}`; cursor = start + 1; break;
            case 'code': newText = `${before}\`${sel}\`${after}`; cursor = start + 1; break;
            case 'link': newText = `${before}[${sel}](url)${after}`; cursor = start + sel.length + 3; break;
            case 'h1': newText = `${before}# ${sel}${after}`; cursor = start + 2; break;
            case 'h2': newText = `${before}## ${sel}${after}`; cursor = start + 3; break;
            case 'ul': newText = `${before}- ${sel}${after}`; cursor = start + 2; break;
        }
        setMarkdown(newText);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor); }, 0);
    };

    const clearDraft = () => {
        if (confirm(tt.confirmClear)) {
            setMarkdown('');
            localStorage.removeItem('markdown-draft');
            toast.success(tt.clearedToast);
        }
    };

    const toolBtn = "px-3 py-2 rounded-xl text-[13px] font-medium text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] transition-colors";

    return (
        <ToolShell
            icon={<Edit className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Markdown"
            width="xwide"
        >
            <div className="bg-white rounded-2xl p-3 border-[1.5px] border-[var(--color-wine-100)] shadow-soft mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1">
                    <button onClick={() => insertMarkdown('h1')} className={toolBtn}>H1</button>
                    <button onClick={() => insertMarkdown('h2')} className={toolBtn}>H2</button>
                    <span className="w-px h-5 bg-[var(--color-wine-100)] mx-1" />
                    <button onClick={() => insertMarkdown('bold')} className={`${toolBtn} font-bold`}>B</button>
                    <button onClick={() => insertMarkdown('italic')} className={`${toolBtn} italic`}>I</button>
                    <button onClick={() => insertMarkdown('code')} className={`${toolBtn} font-mono`}>{'</>'}</button>
                    <span className="w-px h-5 bg-[var(--color-wine-100)] mx-1" />
                    <button onClick={() => insertMarkdown('link')} className={toolBtn}>Link</button>
                    <button onClick={() => insertMarkdown('ul')} className={toolBtn}>• List</button>
                </div>
                <div className="flex items-center gap-2">
                    <SecondaryButton onClick={exportAsHTML}>
                        <Code className="w-3.5 h-3.5" />
                        {tt.exportHtml}
                    </SecondaryButton>
                    <PrimaryButton onClick={exportAsPDF}>
                        <Download className="w-3.5 h-3.5" />
                        {tt.exportPdf}
                    </PrimaryButton>
                    <GhostButton tone="danger" onClick={clearDraft}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </GhostButton>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[660px]"
            >
                <div className="flex flex-col bg-white rounded-3xl border-[1.5px] border-[var(--color-wine-100)] shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-wine-100)] bg-[var(--color-wine-50)]">
                        <h3 className="font-semibold text-[var(--color-wine-700)] text-[13px] inline-flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            {tt.editor}
                        </h3>
                        <div className="text-[12px] text-[var(--color-smoke-600)]">
                            {wordCount} {tt.words} · {charCount} {tt.chars}
                        </div>
                    </div>
                    <textarea
                        id="markdown-input"
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="flex-grow w-full p-6 resize-none outline-none font-mono text-[13.5px] text-[var(--color-wine-800)] bg-white"
                        placeholder="Write Markdown here..."
                    />
                </div>

                <div className="flex flex-col bg-white rounded-3xl border-[1.5px] border-[var(--color-wine-100)] shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-wine-100)] bg-[var(--color-wine-50)]">
                        <h3 className="font-semibold text-[var(--color-wine-700)] text-[13px] inline-flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" />
                            {tt.preview}
                        </h3>
                    </div>
                    <div
                        id="markdown-preview"
                        className="flex-grow overflow-auto p-6 prose prose-sm max-w-none
                          prose-headings:text-[var(--color-wine-700)]
                          prose-p:text-[var(--color-smoke-800)]
                          prose-a:text-[var(--color-wine-600)] prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-[var(--color-wine-700)]
                          prose-code:text-[var(--color-wine-700)] prose-code:bg-[var(--color-wine-100)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-[var(--color-wine-800)] prose-pre:text-[var(--color-cream)]
                          prose-blockquote:border-[var(--color-wine-300)] prose-blockquote:text-[var(--color-smoke-600)]
                          prose-ul:text-[var(--color-smoke-800)]
                          prose-ol:text-[var(--color-smoke-800)]
                          prose-li:text-[var(--color-smoke-800)]"
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>
            </motion.div>

            <div className="text-center mt-4 text-[12.5px] text-[var(--color-smoke-600)] inline-flex items-center gap-1.5 w-full justify-center">
                <Save className="w-3.5 h-3.5" />
                {tt.autosave}
            </div>
        </ToolShell>
    );
}
