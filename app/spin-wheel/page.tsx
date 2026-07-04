'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Disc3, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, GhostButton } from '@/components/ToolShell';

const SLICE_COLORS = [
    '#14213d', '#d98a00', '#3a4a6b', '#a06000',
    '#1f2c4d', '#5a6478', '#2e3f63', '#8a5200',
];

const STORAGE_KEY = 'spin-wheel-items';

export default function SpinWheelPage() {
    const t = useT();
    const tt = t.pages.spinWheel;
    const { locale } = useLanguage();
    const s = locale === 'th'
        ? {
            placeholder: 'พิมพ์ชื่อแล้วกด Enter',
            remove: 'ลบ',
            removeWinner: 'เอาผู้ชนะออกจากวงล้อ',
            clearAll: 'ล้างทั้งหมด',
        }
        : {
            placeholder: 'Type a name and press Enter',
            remove: 'Remove',
            removeWinner: 'Remove winner from wheel',
            clearAll: 'Clear all',
        };
    const [items, setItems] = useState<string[]>(['Alice', 'Bob', 'Charlie', 'Dana', 'Eli', 'Frankie']);
    const [draft, setDraft] = useState('');
    const [angle, setAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipSaveRef = useRef(true);

    // Hydrate saved list on mount (kept out of the initial render for SSR safety).
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: unknown = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === 'string')) {
                    setItems(parsed);
                }
            }
        } catch {
            // ignore corrupted storage
        }
    }, []);

    // Persist list changes (skip the initial mount so defaults never clobber saved data).
    useEffect(() => {
        if (skipSaveRef.current) {
            skipSaveRef.current = false;
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // storage unavailable
        }
    }, [items]);

    useEffect(() => () => {
        if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    }, []);

    const slice = items.length > 0 ? 360 / items.length : 0;

    const segments = useMemo(() =>
        items.map((label, i) => {
            let color = SLICE_COLORS[i % SLICE_COLORS.length];
            // Keep the last slice from matching the first (they are adjacent on the wheel).
            if (i > 0 && i === items.length - 1 && items.length % SLICE_COLORS.length === 1) {
                color = SLICE_COLORS[1];
            }
            return {
                label,
                start: i * slice,
                end: (i + 1) * slice,
                color,
            };
        }),
        [items, slice]
    );

    const conicGradient = useMemo(() => {
        if (segments.length === 0) return 'var(--color-wine-100)';
        const stops = segments.map((seg) => `${seg.color} ${seg.start}deg ${seg.end}deg`);
        return `conic-gradient(from 0deg, ${stops.join(', ')})`;
    }, [segments]);

    const addItem = () => {
        if (spinning) return;
        const v = draft.trim();
        if (!v) return;
        setItems((p) => [...p, v]);
        setDraft('');
    };

    const removeItem = (idx: number) => {
        if (spinning) return;
        setItems((p) => p.filter((_, i) => i !== idx));
    };

    const clearAll = () => {
        if (spinning) return;
        setItems([]);
        setWinner(null);
    };

    const removeWinner = () => {
        if (spinning || !winner) return;
        setItems((p) => {
            const idx = p.indexOf(winner);
            return idx === -1 ? p : p.filter((_, i) => i !== idx);
        });
        setWinner(null);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        const parts = text.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1 && !spinning) {
            e.preventDefault();
            setItems((p) => [...p, ...parts]);
            setDraft('');
        }
    };

    const spin = () => {
        if (items.length < 2 || spinning) return;
        setSpinning(true);
        setWinner(null);

        const winnerIdx = Math.floor(Math.random() * items.length);
        const w = items[winnerIdx];
        const turns = 5 + Math.random() * 2;
        // conic-gradient(from 0deg) starts at the top — same place as the pointer —
        // so rotate until the winning segment center lands back at the top.
        const winnerCenter = winnerIdx * slice + slice / 2;
        const targetAngle = turns * 360 + (360 - winnerCenter);
        // accumulate so visual continuity: keep current angle modulo 360, add to it
        const next = angle + targetAngle - (angle % 360);
        setAngle(next);

        spinTimeoutRef.current = setTimeout(() => {
            setWinner(w);
            setHistory((h) => [w, ...h].slice(0, 50));
            setSpinning(false);
        }, 4200);
    };

    return (
        <ToolShell
            icon={<Disc3 className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Spin"
            width="wide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
                <ToolCard className="flex flex-col items-center justify-center">
                    <div
                        className={`relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] ${!spinning && items.length >= 2 ? 'cursor-pointer' : ''}`}
                        onClick={spin}
                    >
                        {/* Pointer */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-[var(--color-wine-700)] drop-shadow-md" />
                        </div>

                        {/* Wheel */}
                        <motion.div
                            animate={{ rotate: angle }}
                            transition={{ duration: spinning ? 4 : 0, ease: [0.16, 0.84, 0.32, 1] }}
                            className="absolute inset-0 rounded-full shadow-deep border-[6px] border-[var(--color-cream)]"
                            style={{ background: conicGradient }}
                        >
                            {segments.map((seg, i) => {
                                const mid = (seg.start + seg.end) / 2;
                                return (
                                    <div
                                        key={i}
                                        className="absolute inset-0 flex items-start justify-center pointer-events-none"
                                        style={{ transform: `rotate(${mid}deg)` }}
                                    >
                                        <span
                                            title={seg.label}
                                            className="mt-6 text-[12px] sm:text-[13px] font-semibold tracking-tight max-w-[120px] truncate text-center"
                                            style={{ color: '#faf6f3', transform: `rotate(90deg) translateY(0)`, transformOrigin: 'center' }}
                                        >
                                            {seg.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </motion.div>

                        {/* Hub */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[var(--color-cream)] border-[6px] border-[var(--color-wine-700)] flex items-center justify-center shadow-soft z-10">
                            <Disc3 className="w-6 h-6 text-[var(--color-wine-700)]" />
                        </div>
                    </div>

                    <div className="mt-8 text-center min-h-[60px]" aria-live="polite">
                        {winner && !spinning ? (
                            <motion.div
                                key={winner}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                            >
                                <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-wine-600)] font-semibold">
                                    {tt.winnerLabel}
                                </span>
                                <p className="text-2xl sm:text-3xl font-bold text-[var(--color-wine-700)] mt-1">
                                    {winner}
                                </p>
                                <GhostButton tone="danger" onClick={removeWinner} className="mt-2">
                                    <Trash2 className="w-3 h-3" />
                                    {s.removeWinner}
                                </GhostButton>
                            </motion.div>
                        ) : (
                            <p className="text-[var(--color-smoke-600)] text-sm">
                                {items.length < 2 ? tt.emptyHint : '—'}
                            </p>
                        )}
                    </div>

                    <PrimaryButton onClick={spin} disabled={spinning || items.length < 2} className="mt-6 px-10 py-3.5">
                        <Disc3 className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
                        {spinning ? tt.spinning : tt.spin}
                    </PrimaryButton>
                </ToolCard>

                <ToolCard>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
                            {tt.listLabel}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11.5px] text-[var(--color-smoke-600)]">{items.length}</span>
                            {items.length > 0 && (
                                <GhostButton tone="danger" onClick={clearAll} disabled={spinning}>
                                    <Trash2 className="w-3 h-3" />
                                    {s.clearAll}
                                </GhostButton>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            onPaste={handlePaste}
                            placeholder={s.placeholder}
                            className="flex-1 h-11 px-4 rounded-2xl bg-white border-[1.5px] border-[var(--color-wine-100)] text-[14px] text-[var(--color-wine-800)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)]"
                        />
                        <PrimaryButton onClick={addItem} disabled={spinning || !draft.trim()}>
                            <Plus className="w-4 h-4" />
                            {tt.addItem}
                        </PrimaryButton>
                    </div>

                    <div className="space-y-1.5 max-h-[320px] overflow-auto pr-1">
                        {items.map((it, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ background: segments[i].color }}
                                    />
                                    <span className="text-[13.5px] text-[var(--color-wine-700)] truncate">{it}</span>
                                </div>
                                <button
                                    onClick={() => removeItem(i)}
                                    disabled={spinning}
                                    aria-label={`${s.remove} ${it}`}
                                    className="p-1.5 rounded-lg text-[#a4364c] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {history.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">
                                    {tt.history}
                                </span>
                                <GhostButton tone="danger" onClick={() => setHistory([])}>
                                    <RotateCcw className="w-3 h-3" />
                                    {tt.clearWinners}
                                </GhostButton>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {history.map((h, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-[var(--color-wine-700)] text-[var(--color-cream)] text-[12px] font-medium"
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
