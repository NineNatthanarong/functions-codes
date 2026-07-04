'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Trash2, RotateCcw, Sparkles, Copy, Check } from 'lucide-react';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, GhostButton, PrimaryButton } from '@/components/ToolShell';

const HISTORY_DISPLAY_LIMIT = 12;

export default function RandomPickerPage() {
    const t = useT();
    const { locale } = useLanguage();
    const tt = t.pages.randomPicker;
    const s = locale === 'th'
        ? {
            clearHistory: 'ล้างประวัติ',
            copyWinner: 'คัดลอกผลที่ได้',
            copied: 'คัดลอกแล้ว',
            exhausted: 'สุ่มครบทุกรายการแล้ว',
            newRound: 'เริ่มรอบใหม่',
            tryExample: 'ลองตัวอย่าง',
            remaining: (left: number, total: number) => `เหลือ ${left} จาก ${total} รายการ`,
        }
        : {
            clearHistory: 'Clear history',
            copyWinner: 'Copy winner',
            copied: 'Copied',
            exhausted: 'Everyone has been picked.',
            newRound: 'Start a new round',
            tryExample: 'Try an example',
            remaining: (left: number, total: number) => `${left} of ${total} remaining`,
        };

    const [raw, setRaw] = useState('');
    const [winner, setWinner] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [noRepeat, setNoRepeat] = useState(false);
    const [picking, setPicking] = useState(false);
    const [tickItem, setTickItem] = useState<string | null>(null);
    const [tickN, setTickN] = useState(0);
    const [copied, setCopied] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const eligibleRef = useRef<string[]>([]);

    const items = useMemo(
        () => raw.split(/[\n,\t]/).map((x) => x.trim()).filter(Boolean),
        [raw]
    );

    const eligible = useMemo(
        () => (noRepeat ? items.filter((x) => !history.includes(x)) : items),
        [items, history, noRepeat]
    );

    useEffect(() => {
        eligibleRef.current = eligible;
    }, [eligible]);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    }, []);

    const cancelRun = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setTickItem(null);
        setPicking(false);
    }, []);

    const resetAll = useCallback(() => {
        cancelRun();
        setHistory([]);
        setWinner(null);
        setCopied(false);
    }, [cancelRun, setHistory, setWinner, setCopied]);

    const pick = () => {
        if (picking || items.length < 2 || eligibleRef.current.length < 1) return;
        setPicking(true);
        setWinner(null);
        setCopied(false);

        const totalMs = 1800;
        const start = performance.now();
        const tick = () => {
            const pool = eligibleRef.current;
            if (pool.length < 1) {
                // list was emptied mid-animation
                timerRef.current = null;
                setTickItem(null);
                setPicking(false);
                return;
            }
            const elapsed = performance.now() - start;
            const p = elapsed / totalMs;
            if (p >= 1) {
                const choice = pool[Math.floor(Math.random() * pool.length)];
                timerRef.current = null;
                setWinner(choice);
                setHistory((h) => [choice, ...h]);
                setTickItem(null);
                setPicking(false);
                return;
            }
            setTickItem(pool[Math.floor(Math.random() * pool.length)]);
            setTickN((n) => n + 1);
            const delay = 40 + p * 220;
            timerRef.current = setTimeout(tick, delay);
        };
        tick();
    };

    const copyWinner = async () => {
        if (!winner) return;
        try {
            await navigator.clipboard.writeText(winner);
            setCopied(true);
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
            copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
        } catch { /* ignore */ }
    };

    const exampleList = tt.listPlaceholder.split('\n').slice(1).join('\n');
    const exhausted = noRepeat && items.length >= 2 && eligible.length === 0;
    const countHint = noRepeat
        ? s.remaining(eligible.length, items.length)
        : `${items.length} ${tt.countLabel}`;

    return (
        <ToolShell
            icon={<Shuffle className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Random"
            width="wide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToolCard>
                    <FieldLabel hint={countHint}>{tt.listLabel}</FieldLabel>
                    <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                pick();
                            }
                        }}
                        placeholder={tt.listPlaceholder}
                        className="w-full h-80 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[14px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60"
                    />

                    <div className="mt-4 flex items-center justify-between gap-4">
                        <label className="inline-flex items-center gap-2 text-[13px] text-[var(--color-wine-700)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={noRepeat}
                                onChange={(e) => setNoRepeat(e.target.checked)}
                                className="w-4 h-4 accent-[var(--color-wine-700)]"
                            />
                            {tt.noRepeat}
                        </label>
                        <div className="flex items-center gap-1">
                            {items.length === 0 && (
                                <GhostButton onClick={() => setRaw(exampleList)}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {s.tryExample}
                                </GhostButton>
                            )}
                            <GhostButton tone="danger" onClick={resetAll} disabled={!history.length && !winner && !picking}>
                                <RotateCcw className="w-3.5 h-3.5" />
                                {tt.reset}
                            </GhostButton>
                        </div>
                    </div>
                </ToolCard>

                <ToolCard className="flex flex-col items-center justify-center text-center min-h-[420px]">
                    <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-600)] font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        {tt.winnerLabel}
                    </span>

                    <div className="my-6 min-h-[120px] flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {picking && tickItem && (
                                <motion.div
                                    key={tickN}
                                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: 6 }}
                                    transition={{ duration: 0.1 }}
                                    className="text-3xl sm:text-4xl font-semibold text-[var(--color-wine-700)] break-words max-w-full"
                                >
                                    {tickItem}
                                </motion.div>
                            )}
                            {!picking && winner && (
                                <motion.div
                                    key="w-final"
                                    initial={{ opacity: 0, scale: 0.7, rotate: -3 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                                    className="flex items-center justify-center gap-2 max-w-full"
                                >
                                    <span className="relative inline-block min-w-0">
                                        <span aria-hidden className="absolute inset-x-0 -bottom-1 h-3 bg-[var(--color-wine-200)]/70 rounded-sm" />
                                        <span className="relative text-3xl sm:text-4xl font-bold text-[var(--color-wine-700)] break-words px-2">
                                            {winner}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={copyWinner}
                                        aria-label={copied ? s.copied : s.copyWinner}
                                        title={copied ? s.copied : s.copyWinner}
                                        className="shrink-0 p-2 rounded-lg text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] transition-colors"
                                    >
                                        {copied
                                            ? <Check className="w-4 h-4 text-emerald-600" />
                                            : <Copy className="w-4 h-4" />}
                                    </button>
                                </motion.div>
                            )}
                            {!picking && !winner && (
                                <p className="text-[var(--color-smoke-600)] text-sm">
                                    {items.length < 2 ? tt.emptyHint : '—'}
                                </p>
                            )}
                        </AnimatePresence>
                    </div>

                    <PrimaryButton onClick={pick} disabled={picking || items.length < 2 || eligible.length < 1} className="px-8 py-3.5">
                        <Shuffle className="w-4 h-4" />
                        {picking ? tt.picking : tt.pick}
                    </PrimaryButton>

                    {exhausted && !picking && (
                        <p className="mt-3 text-[13px] text-[var(--color-smoke-600)]">
                            {s.exhausted}{' '}
                            <button
                                type="button"
                                onClick={resetAll}
                                className="underline underline-offset-2 font-medium text-[var(--color-wine-700)] hover:text-[var(--color-wine-800)]"
                            >
                                {s.newRound}
                            </button>
                        </p>
                    )}

                    {history.length > 0 && (
                        <div className="mt-8 w-full">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">
                                    {tt.history}
                                </span>
                                <button
                                    onClick={() => setHistory([])}
                                    aria-label={s.clearHistory}
                                    title={s.clearHistory}
                                    className="inline-flex items-center gap-1 p-1 rounded text-[12px] text-[var(--color-smoke-600)] hover:text-[var(--color-wine-700)] transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {history.slice(0, HISTORY_DISPLAY_LIMIT).map((h, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] text-[12px] text-[var(--color-wine-700)] font-medium"
                                    >
                                        <span className="text-[var(--color-smoke-600)]">{history.length - i}.</span> {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </ToolCard>
            </div>
        </ToolShell>
    );
}
