'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, GhostButton, PrimaryButton } from '@/components/ToolShell';

export default function RandomPickerPage() {
    const t = useT();
    const tt = t.pages.randomPicker;
    const [raw, setRaw] = useState('');
    const [winner, setWinner] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [noRepeat, setNoRepeat] = useState(false);
    const [picking, setPicking] = useState(false);
    const [tickItem, setTickItem] = useState<string | null>(null);

    const items = useMemo(
        () => raw.split('\n').map((s) => s.trim()).filter(Boolean),
        [raw]
    );

    const eligible = useMemo(
        () => (noRepeat ? items.filter((x) => !history.includes(x)) : items),
        [items, history, noRepeat]
    );

    const pick = async () => {
        if (eligible.length < 1) return;
        setPicking(true);
        setWinner(null);

        const totalMs = 1800;
        const start = performance.now();
        const tick = () => {
            const elapsed = performance.now() - start;
            const t = elapsed / totalMs;
            if (t >= 1) {
                const choice = eligible[Math.floor(Math.random() * eligible.length)];
                setWinner(choice);
                setHistory((h) => [choice, ...h].slice(0, 12));
                setTickItem(null);
                setPicking(false);
                return;
            }
            setTickItem(eligible[Math.floor(Math.random() * eligible.length)]);
            const delay = 40 + t * 220;
            setTimeout(tick, delay);
        };
        tick();
    };

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
                    <FieldLabel hint={`${items.length} ${tt.countLabel}`}>{tt.listLabel}</FieldLabel>
                    <textarea
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
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
                        <GhostButton tone="danger" onClick={() => { setHistory([]); setWinner(null); }} disabled={!history.length && !winner}>
                            <RotateCcw className="w-3.5 h-3.5" />
                            {tt.reset}
                        </GhostButton>
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
                                    key={tickItem + Math.random()}
                                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: 6 }}
                                    transition={{ duration: 0.1 }}
                                    className="text-3xl sm:text-4xl font-semibold text-[var(--color-wine-700)] break-all"
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
                                    className="relative"
                                >
                                    <div className="absolute inset-x-0 -bottom-1 h-3 bg-[var(--color-wine-200)]/70 rounded-sm" />
                                    <span className="relative text-3xl sm:text-4xl font-bold text-[var(--color-wine-700)] break-all px-2">
                                        {winner}
                                    </span>
                                </motion.div>
                            )}
                            {!picking && !winner && (
                                <p className="text-[var(--color-smoke-600)] text-sm">
                                    {items.length < 2 ? tt.emptyHint : '—'}
                                </p>
                            )}
                        </AnimatePresence>
                    </div>

                    <PrimaryButton onClick={pick} disabled={picking || eligible.length < 1} className="px-8 py-3.5">
                        <Shuffle className="w-4 h-4" />
                        {picking ? tt.picking : tt.pick}
                    </PrimaryButton>

                    {history.length > 0 && (
                        <div className="mt-8 w-full">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">
                                    {tt.history}
                                </span>
                                <button
                                    onClick={() => setHistory([])}
                                    className="inline-flex items-center gap-1 text-[12px] text-[#a4364c] hover:text-[#7a2a36]"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {history.map((h, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] text-[12px] text-[var(--color-wine-700)] font-medium"
                                    >
                                        {h}
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
