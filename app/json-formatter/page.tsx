'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, CheckCircle, AlertCircle, Braces, AlignLeft, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { GhostButton, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

export default function JsonFormatter() {
    const t = useT();
    const tt = t.pages.json;
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const formatJson = () => {
        if (!input.trim()) return;
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
        if (!input.trim()) return;
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

    const copy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        toast.success(t.common.copied);
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
                    <SecondaryButton onClick={formatJson}>
                        <AlignLeft className="w-4 h-4" />
                        {tt.format}
                    </SecondaryButton>
                    <PrimaryButton onClick={minifyJson}>
                        <Minimize2 className="w-4 h-4" />
                        {tt.minify}
                    </PrimaryButton>
                </>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[600px]">
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col h-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
                            <Braces className="w-3.5 h-3.5" />
                            {tt.inputLabel}
                        </span>
                        <GhostButton tone="danger" onClick={clearAll}>
                            <Trash2 className="w-3.5 h-3.5" />
                            {tt.clear}
                        </GhostButton>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={tt.inputPlaceholder}
                        className="flex-grow w-full p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[13px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60 shadow-[inset_0_1px_2px_rgba(85,40,52,0.04)]"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col h-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        {error || !output ? (
                            <span className={cn(
                                'inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide',
                                error ? 'text-[#a4364c]' : 'text-[var(--color-smoke-600)]'
                            )}>
                                {error ? <AlertCircle className="w-3.5 h-3.5" /> : <Braces className="w-3.5 h-3.5" />}
                                {error ? tt.invalid : '—'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-[#3d6a4a]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {tt.valid}
                            </span>
                        )}
                        <GhostButton onClick={copy}>
                            <Copy className="w-3.5 h-3.5" />
                            {tt.copy}
                        </GhostButton>
                    </div>
                    <textarea
                        readOnly
                        value={error || output}
                        className={cn(
                            'flex-grow w-full p-4 rounded-2xl border-[1.5px] transition-all outline-none resize-none font-mono text-[13px] shadow-[inset_0_1px_2px_rgba(85,40,52,0.04)]',
                            error
                                ? 'border-[#e6b3bd] text-[#a4364c] bg-[#fbf3f4]'
                                : 'border-[var(--color-wine-100)] text-[var(--color-wine-800)] bg-[var(--color-wine-50)]'
                        )}
                    />
                </motion.div>
            </div>
        </ToolShell>
    );
}
