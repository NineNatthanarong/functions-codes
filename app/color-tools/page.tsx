'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Palette, Copy, Plus, Trash2, Pipette, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, SegmentedControl, PrimaryButton, GhostButton } from '@/components/ToolShell';

/* ─── color math ─── */
function hexToRgb(hex: string) {
    const m = hex.replace('#', '').match(/.{1,2}/g);
    if (!m || m.length < 3) return { r: 0, g: 0, b: 0 };
    return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}
function rgbToHex(r: number, g: number, b: number) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function rgbToHsl(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb(h: number, s: number, l: number) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v };
    }
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
}
// sRGB → OKLCH (approximate, good enough for designer use)
function srgbToOklch(r: number, g: number, b: number) {
    const lr = r / 255, lg = g / 255, lb = b / 255;
    const f = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const lin = [f(lr), f(lg), f(lb)];
    const l = 0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2];
    const m = 0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2];
    const s = 0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2];
    const lp = Math.cbrt(l), mp = Math.cbrt(m), sp = Math.cbrt(s);
    const L = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
    const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
    const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
    const C = Math.sqrt(a * a + bb * bb);
    let h = (Math.atan2(bb, a) * 180) / Math.PI;
    if (h < 0) h += 360;
    return { l: L, c: C, h };
}

/* ─── input parsing ─── */
// '#RRGGBB', 'RRGGBB', '#RGB', 'RGB' → '#RRGGBB' (uppercase), else null
function normalizeHex(input: string): string | null {
    const v = input.trim().replace(/^#/, '');
    if (/^[0-9A-Fa-f]{6}$/.test(v)) return '#' + v.toUpperCase();
    if (/^[0-9A-Fa-f]{3}$/.test(v)) return '#' + v.split('').map((c) => c + c).join('').toUpperCase();
    return null;
}
// hex (any of the above), 'rgb(r, g, b)', or 'hsl(h, s%, l%)' → '#RRGGBB', else null
function parseColorInput(input: string): string | null {
    const asHex = normalizeHex(input);
    if (asHex) return asHex;
    const v = input.trim();
    const rgbM = v.match(/^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/][^)]*)?\)$/i);
    if (rgbM) {
        const [r, g, b] = [rgbM[1], rgbM[2], rgbM[3]].map(Number);
        if (r <= 255 && g <= 255 && b <= 255) return rgbToHex(r, g, b);
        return null;
    }
    const hslM = v.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)(?:deg)?\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%\s*(?:[,/][^)]*)?\)$/i);
    if (hslM) {
        const [h, sat, l] = [hslM[1], hslM[2], hslM[3]].map(parseFloat);
        if (h <= 360 && sat <= 100 && l <= 100) {
            const c = hslToRgb(h, sat, l);
            return rgbToHex(c.r, c.g, c.b);
        }
    }
    return null;
}

const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

type Tab = 'convert' | 'gradient';
type Stop = { id: string; color: string; pos: number };

export default function ColorToolsPage() {
    const { locale, t } = useLanguage();
    const tt = t.pages.colorTools;
    const s = locale === 'th'
        ? {
            pickColor: 'เลือกสี',
            eyedropper: 'ดูดสีจากหน้าจอ',
            invalidColor: 'รูปแบบสีไม่ถูกต้อง — ใช้ HEX, rgb() หรือ hsl()',
            copyFailed: 'คัดลอกไม่สำเร็จ',
            shuffle: 'สุ่ม',
            stopColor: 'สีของจุดที่',
            stopPos: 'ตำแหน่ง (%) ของจุดที่',
        }
        : {
            pickColor: 'Pick color',
            eyedropper: 'Pick a color from the screen',
            invalidColor: 'Invalid color — use HEX, rgb() or hsl()',
            copyFailed: 'Copy failed',
            shuffle: 'Shuffle',
            stopColor: 'Color of stop',
            stopPos: 'Position (%) of stop',
        };
    const [tab, setTab] = useState<Tab>('convert');
    const [hex, setHex] = useState('#552834');
    // While the user edits the HSL fields, hold their exact values so rounding
    // in hsl→rgb→hex→hsl round-trips doesn't snap the inputs (e.g. S/H on grays).
    const [hslOverride, setHslOverride] = useState<{ h: number; s: number; l: number } | null>(null);
    const [stops, setStops] = useState<Stop[]>([
        { id: 'stop-a', color: '#F7F4F4', pos: 0 },
        { id: 'stop-b', color: '#552834', pos: 100 },
    ]);
    const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear');
    const [angle, setAngle] = useState(135);
    const [hasEyeDropper, setHasEyeDropper] = useState(false);

    useEffect(() => {
        setHasEyeDropper('EyeDropper' in window);
    }, []);

    const rgb = useMemo(() => hexToRgb(hex), [hex]);
    const derivedHsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
    const hsl = hslOverride ?? derivedHsl;
    const oklch = useMemo(() => srgbToOklch(rgb.r, rgb.g, rgb.b), [rgb]);

    // Any non-HSL edit drops the HSL override so the fields re-derive from hex.
    const applyHex = (h: string) => {
        setHslOverride(null);
        setHex(h);
    };

    const css = useMemo(() => {
        const sorted = [...stops].sort((a, b) => a.pos - b.pos);
        const stopStr = sorted.map((st) => `${st.color} ${st.pos}%`).join(', ');
        if (type === 'linear') return `linear-gradient(${angle}deg, ${stopStr})`;
        if (type === 'radial') return `radial-gradient(circle, ${stopStr})`;
        return `conic-gradient(from ${angle}deg, ${stopStr})`;
    }, [stops, type, angle]);

    const copy = async (v: string) => {
        try {
            await navigator.clipboard.writeText(v);
            toast.success(t.common.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const handleHexEdit = (v: string): string | null => {
        const parsed = parseColorInput(v);
        if (parsed) {
            applyHex(parsed);
            return parsed;
        }
        if (v.trim()) toast.error(s.invalidColor);
        return null;
    };

    const pickFromScreen = async () => {
        const ED = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
        if (!ED) return;
        try {
            const res = await new ED().open();
            const parsed = parseColorInput(res.sRGBHex);
            if (parsed) applyHex(parsed);
        } catch {
            /* user cancelled */
        }
    };

    // New stop lands in the middle of the widest gap, with the blended color.
    const addStop = () => {
        setStops((p) => {
            if (p.length >= 8) return p;
            const sorted = [...p].sort((a, b) => a.pos - b.pos);
            let bestIdx = 0, bestGap = -1;
            for (let i = 0; i < sorted.length - 1; i++) {
                const gap = sorted[i + 1].pos - sorted[i].pos;
                if (gap > bestGap) { bestGap = gap; bestIdx = i; }
            }
            const a = sorted[bestIdx];
            const b = sorted[bestIdx + 1] ?? a;
            const ca = hexToRgb(a.color), cb = hexToRgb(b.color);
            return [...p, {
                id: newId(),
                color: rgbToHex((ca.r + cb.r) / 2, (ca.g + cb.g) / 2, (ca.b + cb.b) / 2),
                pos: Math.round((a.pos + b.pos) / 2),
            }];
        });
    };

    const shuffleGradient = () => {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 40 + Math.floor(Math.random() * 140)) % 360;
        const c1 = hslToRgb(h1, 65 + Math.floor(Math.random() * 30), 55 + Math.floor(Math.random() * 20));
        const c2 = hslToRgb(h2, 65 + Math.floor(Math.random() * 30), 40 + Math.floor(Math.random() * 25));
        setStops([
            { id: newId(), color: rgbToHex(c1.r, c1.g, c1.b), pos: 0 },
            { id: newId(), color: rgbToHex(c2.r, c2.g, c2.b), pos: 100 },
        ]);
        setAngle(Math.floor(Math.random() * 361));
    };

    return (
        <ToolShell
            icon={<Palette className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Color"
            width="wide"
        >
            <div className="flex justify-center mb-6">
                <SegmentedControl
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'convert' as Tab, label: tt.tabConvert },
                        { value: 'gradient' as Tab, label: tt.tabGradient },
                    ]}
                />
            </div>

            {tab === 'convert' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ToolCard className="p-0 overflow-hidden">
                        <div
                            className="h-56 transition-colors flex items-end gap-3 p-6"
                            style={{ background: hex }}
                        >
                            <input
                                type="color"
                                value={hex}
                                onChange={(e) => applyHex(e.target.value.toUpperCase())}
                                aria-label={s.pickColor}
                                title={s.pickColor}
                                className="w-14 h-14 rounded-xl cursor-pointer border-[3px] border-white/80 bg-transparent p-0"
                            />
                            {hasEyeDropper && (
                                <button
                                    onClick={pickFromScreen}
                                    aria-label={s.eyedropper}
                                    title={s.eyedropper}
                                    className="w-14 h-14 rounded-xl border-[3px] border-white/80 bg-white/85 text-[var(--color-wine-700)] flex items-center justify-center hover:bg-white transition-colors"
                                >
                                    <Pipette className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="p-5 space-y-3">
                            <ValueRow label="HEX" value={hex.toUpperCase()} onCopy={copy} editable onEdit={handleHexEdit} />
                            <ValueRow label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onCopy={copy} />
                            <ValueRow label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} onCopy={copy} />
                            <ValueRow label="OKLCH" value={`oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`} onCopy={copy} />
                        </div>
                    </ToolCard>

                    <ToolCard>
                        <FieldLabel hint="0–255">RGB</FieldLabel>
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {(['r', 'g', 'b'] as const).map((k) => (
                                <div key={k}>
                                    <label className="text-[11px] uppercase tracking-wider text-[var(--color-smoke-600)] font-semibold block mb-1.5">{k.toUpperCase()}</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={255}
                                        value={rgb[k]}
                                        onChange={(e) => {
                                            const v = Math.max(0, Math.min(255, parseInt(e.target.value || '0') || 0));
                                            const next = { ...rgb, [k]: v };
                                            applyHex(rgbToHex(next.r, next.g, next.b));
                                        }}
                                        aria-label={`RGB ${k.toUpperCase()}`}
                                        className="w-full h-11 px-3 rounded-2xl bg-white border-[1.5px] border-[var(--color-wine-100)] text-[14px] text-[var(--color-wine-800)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] font-mono"
                                    />
                                </div>
                            ))}
                        </div>

                        <FieldLabel>HSL</FieldLabel>
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { k: 'h', label: 'H', max: 360 },
                                { k: 's', label: 'S%', max: 100 },
                                { k: 'l', label: 'L%', max: 100 },
                            ] as const).map((cfg) => (
                                <div key={cfg.k}>
                                    <label className="text-[11px] uppercase tracking-wider text-[var(--color-smoke-600)] font-semibold block mb-1.5">{cfg.label}</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={cfg.max}
                                        value={hsl[cfg.k]}
                                        onChange={(e) => {
                                            const v = Math.max(0, Math.min(cfg.max, parseInt(e.target.value || '0') || 0));
                                            const next = { ...hsl, [cfg.k]: v };
                                            setHslOverride(next);
                                            const r = hslToRgb(next.h, next.s, next.l);
                                            setHex(rgbToHex(r.r, r.g, r.b));
                                        }}
                                        aria-label={`HSL ${cfg.label}`}
                                        className="w-full h-11 px-3 rounded-2xl bg-white border-[1.5px] border-[var(--color-wine-100)] text-[14px] text-[var(--color-wine-800)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] font-mono"
                                    />
                                </div>
                            ))}
                        </div>
                    </ToolCard>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                    <ToolCard className="p-0 overflow-hidden">
                        <div
                            className="h-72 sm:h-96 transition-all"
                            style={{ background: css }}
                        />
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--color-smoke-600)] font-semibold">CSS</span>
                                <button
                                    onClick={() => copy(`background: ${css};`)}
                                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)]"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    {tt.copyCss}
                                </button>
                            </div>
                            <code className="block bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] rounded-xl p-3 text-[12.5px] font-mono text-[var(--color-wine-800)] break-all">
                                background: {css};
                            </code>
                        </div>
                    </ToolCard>

                    <ToolCard>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div>
                                <FieldLabel>{tt.gradientType}</FieldLabel>
                                <SegmentedControl
                                    value={type}
                                    onChange={setType}
                                    options={[
                                        { value: 'linear' as const, label: tt.linear },
                                        { value: 'radial' as const, label: tt.radial },
                                        { value: 'conic' as const, label: tt.conic },
                                    ]}
                                />
                            </div>
                            {type !== 'radial' && (
                                <div>
                                    <FieldLabel hint={`${angle}°`}>{tt.angle}</FieldLabel>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        value={angle}
                                        onChange={(e) => setAngle(parseInt(e.target.value))}
                                        aria-label={tt.angle}
                                        className="w-full h-2 bg-[var(--color-wine-100)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)] mt-3"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            {stops.map((stop, i) => (
                                <div key={stop.id} className="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)]">
                                    <input
                                        type="color"
                                        value={stop.color}
                                        onChange={(e) => {
                                            const next = [...stops];
                                            next[i] = { ...next[i], color: e.target.value.toUpperCase() };
                                            setStops(next);
                                        }}
                                        aria-label={`${s.stopColor} ${i + 1}`}
                                        title={s.pickColor}
                                        className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--color-wine-200)] p-0.5 bg-white"
                                    />
                                    <HexField
                                        value={stop.color}
                                        onCommit={(hexValue) => {
                                            setStops((p) => p.map((st, idx) => (idx === i ? { ...st, color: hexValue } : st)));
                                        }}
                                        ariaLabel={`${s.stopColor} ${i + 1}`}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={stop.pos}
                                        onChange={(e) => {
                                            const next = [...stops];
                                            next[i] = { ...next[i], pos: Math.max(0, Math.min(100, parseInt(e.target.value || '0') || 0)) };
                                            setStops(next);
                                        }}
                                        aria-label={`${s.stopPos} ${i + 1}`}
                                        className="w-16 h-10 px-2 rounded-lg bg-white border border-[var(--color-wine-200)] text-[13px] font-mono text-[var(--color-wine-800)] text-center focus:outline-none focus:border-[var(--color-wine-600)]"
                                    />
                                    <span className="text-[12px] text-[var(--color-smoke-600)]">%</span>
                                    <button
                                        onClick={() => setStops((p) => p.filter((_, idx) => idx !== i))}
                                        disabled={stops.length <= 2}
                                        aria-label={`${tt.removeStop} ${i + 1}`}
                                        title={tt.removeStop}
                                        className="p-1.5 text-[#a4364c] hover:bg-white rounded-lg disabled:opacity-30"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <PrimaryButton
                                onClick={addStop}
                                disabled={stops.length >= 8}
                                className="flex-1"
                            >
                                <Plus className="w-4 h-4" />
                                {tt.addStop}
                            </PrimaryButton>
                            <GhostButton onClick={shuffleGradient} className="shrink-0">
                                <Shuffle className="w-4 h-4" />
                                {s.shuffle}
                            </GhostButton>
                        </div>
                    </ToolCard>
                </div>
            )}
        </ToolShell>
    );
}

function ValueRow({ label, value, onCopy, editable, onEdit }: {
    label: string; value: string; onCopy: (v: string) => void;
    editable?: boolean; onEdit?: (v: string) => string | null;
}) {
    const { t } = useLanguage();
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const escaped = useRef(false);

    // Keep the field in sync with external changes (picker, RGB/HSL inputs)
    // without clobbering the user's in-progress typing.
    useEffect(() => {
        if (document.activeElement !== inputRef.current) setDraft(value);
    }, [value]);

    return (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)]">
            <div className="flex items-baseline gap-3 min-w-0">
                <span className="text-[10px] tracking-[0.22em] uppercase font-semibold text-[var(--color-smoke-600)] w-12 shrink-0">{label}</span>
                {editable ? (
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            // Apply complete 6-digit hex values live while typing.
                            if (/^#?[0-9A-Fa-f]{6}$/.test(e.target.value.trim())) onEdit?.(e.target.value);
                        }}
                        onBlur={() => {
                            if (escaped.current) {
                                escaped.current = false;
                                setDraft(value);
                                return;
                            }
                            const normalized = onEdit?.(draft) ?? null;
                            setDraft(normalized ?? value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') {
                                escaped.current = true;
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        aria-label={label}
                        spellCheck={false}
                        className="bg-transparent text-[13px] font-mono text-[var(--color-wine-800)] focus:outline-none flex-1 min-w-0"
                    />
                ) : (
                    <span className="text-[13px] font-mono text-[var(--color-wine-800)] truncate">{value}</span>
                )}
            </div>
            <button
                onClick={() => onCopy(value)}
                aria-label={`${t.common.copy} ${label}`}
                title={`${t.common.copy} ${label}`}
                className="p-1.5 rounded-lg text-[var(--color-wine-700)] hover:bg-white shrink-0"
            >
                <Copy className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function HexField({ value, onCommit, ariaLabel }: {
    value: string; onCommit: (hex: string) => void; ariaLabel: string;
}) {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document.activeElement !== inputRef.current) setDraft(value);
    }, [value]);

    return (
        <input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
                setDraft(e.target.value);
                // Apply complete 6-digit hex values live while typing.
                if (/^#?[0-9A-Fa-f]{6}$/.test(e.target.value.trim())) {
                    const n = normalizeHex(e.target.value);
                    if (n) onCommit(n);
                }
            }}
            onBlur={() => {
                const n = normalizeHex(draft);
                if (n) onCommit(n);
                setDraft(n ?? value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-label={ariaLabel}
            spellCheck={false}
            className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-white border border-[var(--color-wine-200)] text-[13px] font-mono text-[var(--color-wine-800)] focus:outline-none focus:border-[var(--color-wine-600)]"
        />
    );
}
