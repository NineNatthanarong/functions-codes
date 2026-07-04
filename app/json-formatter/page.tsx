'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, CheckCircle, AlertCircle, Braces, AlignLeft, Minimize2, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { GhostButton, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

const SAMPLE_JSON = '{"name":"functions.codes","free":true,"tools":["json-formatter","qr-generator","text-diff"],"meta":{"version":2,"locales":["th","en"]}}';

export default function JsonFormatter() {
    const { t, locale } = useLanguage();
    const tt = t.pages.json;
    const s = locale === 'th' ? {
        outputLabel: 'ผลลัพธ์',
        outputPlaceholder: 'ผลลัพธ์จะแสดงที่นี่...',
        emptyHint: 'วาง JSON ก่อน',
        sample: 'ลองตัวอย่าง',
        download: 'ดาวน์โหลด',
        copyFailed: 'คัดลอกไม่สำเร็จ',
        chars: 'ตัวอักษร',
    } : {
        outputLabel: 'Result',
        outputPlaceholder: 'Formatted JSON will appear here...',
        emptyHint: 'Paste some JSON first',
        sample: 'Try sample',
        download: 'Download',
        copyFailed: 'Copy failed',
        chars: 'characters',
    };
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const liveValid = useMemo(() => {
        if (!input.trim()) return null;
        try {
            JSON.parse(input);
            return true;
        } catch {
            return false;
        }
    }, [input]);

    const updateInput = (value: string) => {
        setInput(value);
        setOutput('');
        setError(null);
    };

    const formatJson = () => {
        if (!input.trim()) {
            toast(s.emptyHint);
            return;
        }
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed, null, 2));
            setError(null);
            toast.success(tt.formattedToast);
        } catch (err) {
            setError((err as Error).message);
            setOutput('');
            toast.error(tt.invalidToast);
        }
    };

    const minifyJson = () => {
        if (!input.trim()) {
            toast(s.emptyHint);
            return;
        }
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed));
            setError(null);
            toast.success(tt.minifiedToast);
        } catch (err) {
            setError((err as Error).message);
            setOutput('');
            toast.error(tt.invalidToast);
        }
    };

    const copy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            toast.success(t.common.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const downloadJson = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setError(null);
    };

    return (
        <ToolShell
            icon={<Braces className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="JSON"
            width="xwide"
            actions={
                <>
                    <SecondaryButton onClick={formatJson} disabled={!input.trim()}>
                        <AlignLeft className="w-4 h-4" />
                        {tt.format}
                    </SecondaryButton>
                    <PrimaryButton onClick={minifyJson} disabled={!input.trim()}>
                        <Minimize2 className="w-4 h-4" />
                        {tt.minify}
                    </PrimaryButton>
                </>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[600px]">
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col h-[420px] lg:h-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
                            <Braces className="w-3.5 h-3.5" />
                            {tt.inputLabel}
                        </span>
                        <div className="flex items-center gap-1">
                            {!input && (
                                <GhostButton onClick={() => updateInput(SAMPLE_JSON)}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {s.sample}
                                </GhostButton>
                            )}
                            <GhostButton tone="danger" onClick={clearAll} disabled={!input && !output}>
                                <Trash2 className="w-3.5 h-3.5" />
                                {tt.clear}
                            </GhostButton>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => updateInput(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                formatJson();
                            }
                        }}
                        onDragOver={(e) => {
                            if (e.dataTransfer.types.includes('Files')) e.preventDefault();
                        }}
                        onDrop={(e) => {
                            const file = e.dataTransfer.files?.[0];
                            if (!file) return;
                            e.preventDefault();
                            const reader = new FileReader();
                            reader.onload = () => {
                                if (typeof reader.result === 'string') updateInput(reader.result);
                            };
                            reader.readAsText(file);
                        }}
                        placeholder={tt.inputPlaceholder}
                        aria-label={tt.inputLabel}
                        className="flex-grow w-full p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[13px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60 shadow-[inset_0_1px_2px_rgba(85,40,52,0.04)]"
                    />
                    <div className="mt-2 text-[11.5px] font-medium text-[var(--color-smoke-600)]">
                        {input.length.toLocaleString()} {s.chars}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col h-[420px] lg:h-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        {liveValid === null ? (
                            <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[var(--color-smoke-600)]">
                                <Braces className="w-3.5 h-3.5" />
                                —
                            </span>
                        ) : liveValid ? (
                            <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[#3d6a4a]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {tt.valid}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[#a4364c]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {tt.invalid}
                            </span>
                        )}
                        <div className="flex items-center gap-1">
                            <GhostButton onClick={downloadJson} disabled={!output}>
                                <Download className="w-3.5 h-3.5" />
                                {s.download}
                            </GhostButton>
                            <GhostButton onClick={copy} disabled={!output}>
                                <Copy className="w-3.5 h-3.5" />
                                {tt.copy}
                            </GhostButton>
                        </div>
                    </div>
                    <textarea
                        readOnly
                        value={error || output}
                        placeholder={s.outputPlaceholder}
                        aria-label={s.outputLabel}
                        className={cn(
                            'flex-grow w-full p-4 rounded-2xl border-[1.5px] transition-all outline-none resize-none font-mono text-[13px] shadow-[inset_0_1px_2px_rgba(85,40,52,0.04)] placeholder:text-[var(--color-smoke-600)]/60',
                            error
                                ? 'border-[#e6b3bd] text-[#a4364c] bg-[#fbf3f4]'
                                : 'border-[var(--color-wine-100)] text-[var(--color-wine-800)] bg-[var(--color-wine-50)]'
                        )}
                    />
                    <div className="mt-2 text-[11.5px] font-medium text-[var(--color-smoke-600)]">
                        {output.length.toLocaleString()} {s.chars}
                    </div>
                </motion.div>
            </div>
        </ToolShell>
    );
}
