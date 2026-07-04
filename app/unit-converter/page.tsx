'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Minimize2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard } from '@/components/ToolShell';

const round = (v: number) => Number(v.toFixed(4));

const BASE_PRESETS = [14, 16, 18];

export default function UnitConverter() {
    const { locale, t } = useLanguage();
    const tt = t.pages.units;
    const s = locale === 'th' ? {
        reset: 'รีเซ็ตเป็น 16px',
        baseHint: 'ขนาดฐานต้องมากกว่า 0',
        copyFailed: 'คัดลอกไม่สำเร็จ',
    } : {
        reset: 'Reset to 16px',
        baseHint: 'Base size must be greater than 0',
        copyFailed: 'Copy failed',
    };

    const [px, setPx] = useState('16');
    const [baseSize, setBaseSize] = useState('16');
    const [rem, setRem] = useState('1');
    const [em, setEm] = useState(1);
    const [percent, setPercent] = useState(100);

    const pxNum = Number(px);
    const pxValid = px.trim() !== '' && Number.isFinite(pxNum);
    const remNum = Number(rem);
    const remValid = rem.trim() !== '' && Number.isFinite(remNum);
    const baseNum = Number(baseSize);
    const baseValid = baseSize.trim() !== '' && Number.isFinite(baseNum) && baseNum > 0;

    const handlePxChange = (raw: string) => {
        setPx(raw);
        const val = Number(raw);
        if (!raw.trim() || !Number.isFinite(val) || !baseValid) return;
        const r = round(val / baseNum);
        setRem(String(r));
        setEm(r);
        setPercent(round((val / baseNum) * 100));
    };

    const handleRemChange = (raw: string) => {
        setRem(raw);
        const val = Number(raw);
        if (!raw.trim() || !Number.isFinite(val)) return;
        setEm(round(val));
        setPercent(round(val * 100));
        if (baseValid) setPx(String(round(val * baseNum)));
    };

    const handleBaseChange = (raw: string) => {
        setBaseSize(raw);
        const base = Number(raw);
        if (!raw.trim() || !Number.isFinite(base) || base <= 0 || !pxValid) return;
        const r = round(pxNum / base);
        setRem(String(r));
        setEm(r);
        setPercent(round((pxNum / base) * 100));
    };

    const reset = () => {
        setPx('16');
        setBaseSize('16');
        setRem('1');
        setEm(1);
        setPercent(100);
    };

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success(`${tt.copiedToast} ${label}`))
            .catch(() => toast.error(s.copyFailed));
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
                    <label htmlFor="base-size-input" className="block text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)] mb-3">
                        {tt.baseLabel}
                    </label>
                    <div className="flex items-center justify-center gap-2">
                        <input
                            id="base-size-input"
                            type="number"
                            min={1}
                            value={baseSize}
                            onChange={(e) => handleBaseChange(e.target.value)}
                            className="w-28 h-12 px-3 text-center rounded-2xl border-[1.5px] border-[var(--color-wine-100)] bg-[var(--color-wine-50)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] font-mono text-lg text-[var(--color-wine-800)]"
                        />
                        <span className="text-[var(--color-smoke-600)] text-sm">px</span>
                    </div>
                    {!baseValid && (
                        <p className="mt-2 text-[12px] font-medium text-[#a4364c]">{s.baseHint}</p>
                    )}
                    <div className="mt-3 flex items-center justify-center gap-2">
                        {BASE_PRESETS.map((n) => (
                            <button
                                key={n}
                                onClick={() => handleBaseChange(String(n))}
                                className={`px-3 py-1 rounded-full text-[12.5px] font-semibold border-[1.5px] transition-colors ${
                                    baseValid && baseNum === n
                                        ? 'border-[var(--color-wine-600)] bg-[var(--color-wine-600)] text-white'
                                        : 'border-[var(--color-wine-100)] text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)]'
                                }`}
                            >
                                {n}px
                            </button>
                        ))}
                        <button
                            onClick={reset}
                            aria-label={s.reset}
                            title={s.reset}
                            className="p-1.5 rounded-full border-[1.5px] border-[var(--color-wine-100)] text-[var(--color-wine-700)] hover:bg-[var(--color-wine-100)] transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </ToolCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <NumberCard label={tt.pixels} unit="px" value={px} min={0} copyText={tt.copyLabel} copyDisabled={!pxValid} onChange={handlePxChange} onCopy={() => copy(`${round(pxNum)}px`, 'px')} />
                    <NumberCard label="REM" unit="rem" value={rem} step={0.0625} min={0} copyText={tt.copyLabel} copyDisabled={!remValid} onChange={handleRemChange} onCopy={() => copy(`${round(remNum)}rem`, 'rem')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <ReadOnlyCard label="EM" value={em.toFixed(3)} unit="em" copyLabel={tt.copyLabel} onCopy={() => copy(`${round(em)}em`, 'em')} />
                    <ReadOnlyCard label="%" value={percent.toFixed(1)} unit="%" copyLabel={tt.copyLabel} onCopy={() => copy(`${round(percent)}%`, '%')} />
                </div>
            </div>
        </ToolShell>
    );
}

function NumberCard({ label, unit, value, step, min, copyText, copyDisabled, onChange, onCopy }: {
    label: string; unit: string; value: string; step?: number; min?: number;
    copyText: string; copyDisabled?: boolean;
    onChange: (v: string) => void; onCopy: () => void;
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
                    min={min}
                    aria-label={label}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-3 text-2xl text-center font-bold text-[var(--color-wine-800)] rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-smoke-600)] text-sm font-medium">{unit}</span>
            </div>
            <button
                onClick={onCopy}
                disabled={copyDisabled}
                className="text-[12.5px] text-[var(--color-wine-600)] hover:text-[var(--color-wine-700)] font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Copy className="w-3.5 h-3.5" />
                {copyText}
            </button>
        </motion.div>
    );
}

function ReadOnlyCard({ label, value, unit, copyLabel, onCopy }: { label: string; value: string; unit: string; copyLabel: string; onCopy: () => void }) {
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
                aria-label={`${copyLabel} ${label}`}
                title={`${copyLabel} ${label}`}
                className="p-2.5 bg-white rounded-xl border border-[var(--color-wine-100)] hover:bg-[var(--color-wine-100)] transition-colors"
            >
                <Copy className="w-4 h-4 text-[var(--color-wine-700)]" />
            </motion.button>
        </div>
    );
}
