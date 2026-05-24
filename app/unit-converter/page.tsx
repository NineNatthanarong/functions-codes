'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard } from '@/components/ToolShell';

export default function UnitConverter() {
    const t = useT();
    const tt = t.pages.units;
    const [px, setPx] = useState<number>(16);
    const [baseSize, setBaseSize] = useState<number>(16);
    const [rem, setRem] = useState<number>(1);
    const [em, setEm] = useState<number>(1);
    const [percent, setPercent] = useState<number>(100);

    const handlePxChange = (val: number) => {
        setPx(val);
        setRem(val / baseSize);
        setEm(val / baseSize);
        setPercent((val / baseSize) * 100);
    };

    const handleRemChange = (val: number) => {
        setRem(val);
        setPx(val * baseSize);
        setEm(val);
        setPercent(val * 100);
    };

    const handleBaseChange = (val: number) => {
        setBaseSize(val);
        setRem(px / val);
        setEm(px / val);
        setPercent((px / val) * 100);
    };

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${tt.copiedToast} ${label}`);
    };

    return (
        <ToolShell
            icon={<Minimize2 className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="CSS"
            width="wide"
        >
            <div className="space-y-6">
                <ToolCard className="max-w-sm mx-auto text-center">
                    <label className="block text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)] mb-3">
                        {tt.baseLabel}
                    </label>
                    <div className="flex items-center justify-center gap-2">
                        <input
                            type="number"
                            value={baseSize}
                            onChange={(e) => handleBaseChange(Number(e.target.value))}
                            className="w-28 h-12 px-3 text-center rounded-2xl border-[1.5px] border-[var(--color-wine-100)] bg-[var(--color-wine-50)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] font-mono text-lg text-[var(--color-wine-800)]"
                        />
                        <span className="text-[var(--color-smoke-600)] text-sm">px</span>
                    </div>
                </ToolCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <NumberCard label={tt.pixels} unit="px" value={px} onChange={handlePxChange} onCopy={() => copy(`${px}px`, 'px')} />
                    <NumberCard label="REM" unit="rem" value={rem} step={0.0625} onChange={handleRemChange} onCopy={() => copy(`${rem}rem`, 'rem')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <ReadOnlyCard label="EM" value={em.toFixed(3)} unit="em" onCopy={() => copy(`${em.toFixed(3)}em`, 'em')} />
                    <ReadOnlyCard label="%" value={percent.toFixed(1)} unit="%" onCopy={() => copy(`${percent.toFixed(1)}%`, '%')} />
                </div>
            </div>
        </ToolShell>
    );
}

function NumberCard({ label, unit, value, step, onChange, onCopy }: {
    label: string; unit: string; value: number; step?: number;
    onChange: (v: number) => void; onCopy: () => void;
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="bg-white rounded-3xl p-7 border-[1.5px] border-[var(--color-wine-100)] shadow-soft flex flex-col items-center gap-4"
        >
            <label className="text-base font-semibold text-[var(--color-wine-700)]">{label}</label>
            <div className="relative w-full max-w-[200px]">
                <input
                    type="number"
                    value={value}
                    step={step}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full px-4 py-3 text-2xl text-center font-bold text-[var(--color-wine-800)] rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-smoke-600)] text-sm font-medium">{unit}</span>
            </div>
            <button
                onClick={onCopy}
                className="text-[12.5px] text-[var(--color-wine-600)] hover:text-[var(--color-wine-700)] font-semibold inline-flex items-center gap-1.5"
            >
                <Copy className="w-3.5 h-3.5" />
                Copy
            </button>
        </motion.div>
    );
}

function ReadOnlyCard({ label, value, unit, onCopy }: { label: string; value: string; unit: string; onCopy: () => void }) {
    return (
        <div className="bg-[var(--color-wine-50)] rounded-3xl p-6 border-[1.5px] border-[var(--color-wine-100)] flex items-center justify-between">
            <div>
                <p className="text-[12px] tracking-[0.18em] uppercase font-semibold text-[var(--color-smoke-600)] mb-1">{label}</p>
                <p className="text-2xl font-bold text-[var(--color-wine-800)]">
                    {value}<span className="text-base font-normal text-[var(--color-smoke-600)] ml-1">{unit}</span>
                </p>
            </div>
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onCopy}
                className="p-2.5 bg-white rounded-xl border border-[var(--color-wine-100)] hover:bg-[var(--color-wine-100)] transition-colors"
            >
                <Copy className="w-4 h-4 text-[var(--color-wine-700)]" />
            </motion.button>
        </div>
    );
}
