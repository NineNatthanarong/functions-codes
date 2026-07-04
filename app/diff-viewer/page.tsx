'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { diffChars, diffLines, diffArrays, Change } from 'diff';
import { ArrowRightLeft, Trash2, Copy, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, GhostButton, FieldLabel, SegmentedControl } from '@/components/ToolShell';

type DiffMode = 'chars' | 'words' | 'lines';

/** Above this combined input size, chars/words diffs fall back to lines to keep the UI responsive. */
const LARGE_INPUT_THRESHOLD = 50_000;

/**
 * Locale-aware word tokenizer so "Words" mode works for Thai and other
 * non-Latin scripts (jsdiff's diffWords only recognizes Latin word chars).
 * Whitespace runs are kept as tokens so whitespace-only edits stay visible.
 */
function segmentWords(text: string): string[] {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
        return Array.from(segmenter.segment(text), (segment) => segment.segment);
    }
    return text.split(/(\s+)/).filter(Boolean);
}

const EXAMPLE_OLD = 'สวัสดีครับ ยินดีต้อนรับสู่ functions.codes\nThe quick brown fox jumps over the lazy dog.\nTotal: 100 baht';
const EXAMPLE_NEW = 'สวัสดีค่ะ ยินดีต้อนรับสู่ functions.codes\nThe quick red fox leaps over the lazy dog.\nTotal: 150 baht';

export default function DiffViewer() {
    const { t, locale } = useLanguage();
    const tt = t.pages.diff;
    const s = locale === 'th' ? {
        swap: 'สลับ',
        example: 'ตัวอย่าง',
        identical: 'ข้อความทั้งสองเหมือนกันทุกประการ',
        largeNote: 'ข้อความยาวมาก จึงเปรียบเทียบแบบรายบรรทัดเพื่อความเร็ว',
        added: 'เพิ่ม',
        removed: 'ลบ',
    } : {
        swap: 'Swap',
        example: 'Example',
        identical: 'The two texts are identical.',
        largeNote: 'Large input — comparing by lines for performance.',
        added: 'added',
        removed: 'removed',
    };

    const [oldText, setOldText] = useState('');
    const [newText, setNewText] = useState('');
    const [mode, setMode] = useState<DiffMode>('words');

    // Debounce the inputs so the diff never runs on every keystroke.
    const [debouncedTexts, setDebouncedTexts] = useState<[string, string]>(['', '']);
    useEffect(() => {
        if (!oldText && !newText) { setDebouncedTexts(['', '']); return; }
        const timer = setTimeout(() => setDebouncedTexts([oldText, newText]), 200);
        return () => clearTimeout(timer);
    }, [oldText, newText]);
    const [dOld, dNew] = debouncedTexts;

    const isLargeInput = dOld.length + dNew.length > LARGE_INPUT_THRESHOLD;
    const effectiveMode: DiffMode = isLargeInput && mode !== 'lines' ? 'lines' : mode;

    const diffResult = useMemo<Change[]>(() => {
        if (!dOld && !dNew) return [];
        if (effectiveMode === 'chars') return diffChars(dOld, dNew);
        if (effectiveMode === 'words') {
            return diffArrays(segmentWords(dOld), segmentWords(dNew)).map((part) => ({
                ...part,
                value: part.value.join(''),
            }));
        }
        return diffLines(dOld, dNew);
    }, [dOld, dNew, effectiveMode]);

    const stats = useMemo(() => {
        let added = 0;
        let removed = 0;
        for (const part of diffResult) {
            if (part.added) added += part.count;
            else if (part.removed) removed += part.count;
        }
        return { added, removed };
    }, [diffResult]);

    const isIdentical = diffResult.length > 0 && stats.added === 0 && stats.removed === 0;

    const clearAll = () => {
        setOldText('');
        setNewText('');
        toast.success(tt.clearedToast);
    };

    const swap = () => {
        setOldText(newText);
        setNewText(oldText);
    };

    const loadExample = () => {
        setOldText(EXAMPLE_OLD);
        setNewText(EXAMPLE_NEW);
    };

    const copyResult = async () => {
        try {
            await navigator.clipboard.writeText(diffResult.map((part) => part.value).join(''));
            toast.success(t.common.copied);
        } catch {
            toast.error(t.common.errorTryAgain);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
    };

    const handleDrop = (setter: (value: string) => void) => (e: React.DragEvent<HTMLTextAreaElement>) => {
        if (e.dataTransfer.files.length === 0) return; // plain-text drops keep default behavior
        e.preventDefault();
        e.dataTransfer.files[0].text()
            .then(setter)
            .catch(() => toast.error(t.common.errorTryAgain));
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
                <div className="flex items-center gap-1.5 flex-wrap">
                    <GhostButton onClick={loadExample}>
                        <FileText className="w-3.5 h-3.5" />
                        {s.example}
                    </GhostButton>
                    <GhostButton onClick={swap} disabled={!oldText && !newText}>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {s.swap}
                    </GhostButton>
                    <GhostButton tone="danger" onClick={clearAll}>
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.common.clearAll}
                    </GhostButton>
                </div>
            </ToolCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <div>
                    <FieldLabel>{tt.oldText}</FieldLabel>
                    <textarea
                        id="diff-old-text"
                        aria-label={tt.oldText}
                        value={oldText}
                        onChange={(e) => setOldText(e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop(setOldText)}
                        placeholder={tt.oldPlaceholder}
                        className="w-full h-64 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[13px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60"
                    />
                </div>
                <div>
                    <FieldLabel>{tt.newText}</FieldLabel>
                    <textarea
                        id="diff-new-text"
                        aria-label={tt.newText}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop(setNewText)}
                        placeholder={tt.newPlaceholder}
                        className="w-full h-64 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[13px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60"
                    />
                </div>
            </div>

            <ToolCard className="overflow-hidden p-0">
                <div className="px-6 py-3.5 border-b border-[var(--color-wine-100)] bg-[var(--color-wine-50)] flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
                        {tt.result}
                    </h3>
                    <div className="flex items-center gap-2">
                        {diffResult.length > 0 && !isIdentical && (
                            <span className="font-mono text-[11.5px] whitespace-nowrap">
                                <span className="bg-[#dbe8d3] text-[#2c4a26] px-1.5 py-0.5 rounded">+{stats.added} {s.added}</span>
                                {' '}
                                <span className="bg-[#f4d6d9] text-[#7a2a36] px-1.5 py-0.5 rounded">−{stats.removed} {s.removed}</span>
                            </span>
                        )}
                        <GhostButton onClick={copyResult} disabled={diffResult.length === 0} className="px-2 py-1">
                            <Copy className="w-3.5 h-3.5" />
                            {t.common.copy}
                        </GhostButton>
                    </div>
                </div>
                {isLargeInput && mode !== 'lines' && (
                    <div className="px-6 py-2 border-b border-[var(--color-wine-100)] bg-[#faf3dc] text-[12px] text-[#8a6d1f]">
                        {s.largeNote}
                    </div>
                )}
                <div className="p-6 font-mono text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                    <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {isIdentical ? (
                            <span className="inline-flex items-center gap-2 text-[#2c4a26] font-medium">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                                {s.identical}
                            </span>
                        ) : (
                            diffResult.map((part, idx) => (
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
                            ))
                        )}
                        {diffResult.length === 0 && (
                            <span className="text-[var(--color-smoke-600)]/60 italic">{tt.empty}</span>
                        )}
                    </motion.div>
                </div>
            </ToolCard>
        </ToolShell>
    );
}
