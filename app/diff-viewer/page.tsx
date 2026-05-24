'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { diffChars, diffWords, diffLines, Change } from 'diff';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, GhostButton, FieldLabel, SegmentedControl } from '@/components/ToolShell';

type DiffMode = 'chars' | 'words' | 'lines';

export default function DiffViewer() {
    const t = useT();
    const tt = t.pages.diff;
    const [oldText, setOldText] = useState('');
    const [newText, setNewText] = useState('');
    const [mode, setMode] = useState<DiffMode>('words');
    const [diffResult, setDiffResult] = useState<Change[]>([]);

    useEffect(() => {
        if (!oldText && !newText) { setDiffResult([]); return; }
        let diff;
        if (mode === 'chars') diff = diffChars(oldText, newText);
        else if (mode === 'words') diff = diffWords(oldText, newText);
        else diff = diffLines(oldText, newText);
        setDiffResult(diff);
    }, [oldText, newText, mode]);

    const clearAll = () => {
        setOldText('');
        setNewText('');
        toast.success(tt.clearedToast);
    };

    return (
        <ToolShell
            icon={<ArrowRightLeft className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Diff"
            width="xwide"
        >
            <ToolCard className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <FieldLabel>{tt.modeLabel}</FieldLabel>
                    <SegmentedControl
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: 'chars', label: tt.chars },
                            { value: 'words', label: tt.words },
                            { value: 'lines', label: tt.lines },
                        ]}
                    />
                </div>
                <GhostButton tone="danger" onClick={clearAll}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.common.clearAll}
                </GhostButton>
            </ToolCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <div>
                    <FieldLabel>{tt.oldText}</FieldLabel>
                    <textarea
                        value={oldText}
                        onChange={(e) => setOldText(e.target.value)}
                        placeholder={tt.oldPlaceholder}
                        className="w-full h-64 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[13px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60"
                    />
                </div>
                <div>
                    <FieldLabel>{tt.newText}</FieldLabel>
                    <textarea
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder={tt.newPlaceholder}
                        className="w-full h-64 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[13px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60"
                    />
                </div>
            </div>

            <ToolCard className="overflow-hidden p-0">
                <div className="px-6 py-3.5 border-b border-[var(--color-wine-100)] bg-[var(--color-wine-50)]">
                    <h3 className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
                        {tt.result}
                    </h3>
                </div>
                <div className="p-6 font-mono text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                    <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {diffResult.map((part, idx) => (
                            <span
                                key={idx}
                                className={cn(
                                    part.added ? 'bg-[#dbe8d3] text-[#2c4a26] px-0.5 rounded' :
                                        part.removed ? 'bg-[#f4d6d9] text-[#7a2a36] px-0.5 rounded line-through opacity-80' :
                                            'text-[var(--color-smoke-600)]'
                                )}
                            >
                                {part.value}
                            </span>
                        ))}
                        {diffResult.length === 0 && (
                            <span className="text-[var(--color-smoke-600)]/60 italic">{tt.empty}</span>
                        )}
                    </motion.div>
                </div>
            </ToolCard>
        </ToolShell>
    );
}
