'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Languages, Copy, Check, ClipboardPaste, ArrowLeftRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, SegmentedControl, GhostButton } from '@/components/ToolShell';

// Kedmanee layout — Thai char ↔ position on a US-QWERTY keyboard.
// Mapping is symmetric in spirit: the same physical key produces these chars.
const TH_TO_EN: Record<string, string> = {
    'ๅ': '1', '/': '2', '-': '3', 'ภ': '4', 'ถ': '5', 'ุ': '6', 'ึ': '7', 'ค': '8', 'ต': '9', 'จ': '0', 'ข': '-', 'ช': '=',
    'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p', 'บ': '[', 'ล': ']', 'ฃ': '\\',
    'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': "'",
    'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/',
    // Shifted Thai
    '+': '!', '๑': '@', '๒': '#', '๓': '$', '๔': '%', 'ู': '^', '฿': '&', '๕': '*', '๖': '(', '๗': ')', '๘': '_', '๙': '+',
    '๐': 'Q', '"': 'W', 'ฎ': 'E', 'ฑ': 'R', 'ธ': 'T', 'ํ': 'Y', '๊': 'U', 'ณ': 'I', 'ฯ': 'O', 'ญ': 'P', 'ฐ': '{', ',': '}', 'ฅ': '|',
    'ฤ': 'A', 'ฆ': 'S', 'ฏ': 'D', 'โ': 'F', 'ฌ': 'G', '็': 'H', '๋': 'J', 'ษ': 'K', 'ศ': 'L', 'ซ': ':', '.': '"',
    '(': 'Z', ')': 'X', 'ฉ': 'C', 'ฮ': 'V', 'ฺ': 'B', '์': 'N', '?': 'M', 'ฒ': '<', 'ฬ': '>', 'ฦ': '?',
};

const EN_TO_TH: Record<string, string> = {};
for (const [th, en] of Object.entries(TH_TO_EN)) {
    if (!(en in EN_TO_TH)) EN_TO_TH[en] = th;
}

type Mode = 'auto' | 'en2th' | 'th2en';

function isThaiChar(ch: string) {
    const code = ch.charCodeAt(0);
    return code >= 0x0e00 && code <= 0x0e7f;
}

function detectMode(text: string): 'en2th' | 'th2en' | null {
    let thai = 0, latin = 0;
    for (const c of text) {
        if (isThaiChar(c)) thai++;
        else if (/[A-Za-z]/.test(c)) latin++;
    }
    if (thai === 0 && latin === 0) return null;
    return latin > thai ? 'en2th' : 'th2en';
}

function convert(text: string, dir: 'en2th' | 'th2en'): string {
    const map = dir === 'en2th' ? EN_TO_TH : TH_TO_EN;
    let out = '';
    for (const ch of text) {
        out += map[ch] ?? ch;
    }
    return out;
}

export default function ThaiKeyboardPage() {
    const t = useT();
    const { locale } = useLanguage();
    const tt = t.pages.thaiKeyboard;
    const s = locale === 'th'
        ? { paste: 'วาง', example: 'ลองตัวอย่าง', detected: 'ตรวจพบ', copyFailed: 'คัดลอกไม่สำเร็จ', pasteFailed: 'วางไม่สำเร็จ — เบราว์เซอร์ไม่อนุญาตให้อ่านคลิปบอร์ด', chars: 'ตัวอักษร' }
        : { paste: 'Paste', example: 'Try example', detected: 'Detected', copyFailed: 'Copy failed', pasteFailed: 'Paste failed — clipboard access was blocked', chars: 'chars' };
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<Mode>('auto');
    const [copied, setCopied] = useState(false);

    const detected = useMemo(() => (input ? detectMode(input) : null), [input]);
    const dir = mode === 'auto' ? detected : mode;

    const output = useMemo(() => {
        if (!input) return '';
        if (!dir) return input;
        return convert(input, dir);
    }, [input, dir]);

    useEffect(() => {
        if (!copied) return;
        const id = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(id);
    }, [copied]);

    const swap = () => {
        setInput(output);
        setMode((m) => (m === 'en2th' ? 'th2en' : m === 'th2en' ? 'en2th' : m));
    };
    const clear = () => setInput('');
    const copy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            toast.success(t.common.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };
    const paste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) setInput(text);
        } catch {
            toast.error(s.pasteFailed);
        }
    };

    return (
        <ToolShell
            icon={<Languages className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="TH ⇄ EN"
            width="wide"
        >
            <ToolCard className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <FieldLabel>{tt.modeLabel}</FieldLabel>
                    <SegmentedControl
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: 'auto' as Mode, label: tt.modeAuto },
                            { value: 'en2th' as Mode, label: tt.modeEnToTh },
                            { value: 'th2en' as Mode, label: tt.modeThToEn },
                        ]}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <GhostButton onClick={swap} disabled={!output}>
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        {tt.swap}
                    </GhostButton>
                    <GhostButton tone="danger" onClick={clear} disabled={!input}>
                        <Trash2 className="w-3.5 h-3.5" />
                        {tt.clear}
                    </GhostButton>
                </div>
            </ToolCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="thai-keyboard-input"
                            className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]"
                        >
                            {tt.inputLabel}
                        </label>
                        <div className="flex items-center gap-3">
                            {input.length > 0 && (
                                <span className="text-[11px] text-[var(--color-smoke-600)]/70">
                                    {input.length} {s.chars}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={paste}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)]"
                            >
                                <ClipboardPaste className="w-3.5 h-3.5" />
                                {s.paste}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInput('l;ylfu')}
                                className="text-[12px] font-semibold text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)] underline underline-offset-2 decoration-[var(--color-wine-100)]"
                            >
                                {s.example}
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="thai-keyboard-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                e.preventDefault();
                                copy();
                            }
                        }}
                        autoFocus
                        placeholder={tt.inputPlaceholder}
                        className="w-full h-72 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] focus:outline-none focus:border-[var(--color-wine-600)] focus:ring-4 focus:ring-[var(--color-wine-100)] transition-all resize-none font-mono text-[14px] bg-white text-[var(--color-wine-800)] placeholder:text-[var(--color-smoke-600)]/60"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                            <span
                                id="thai-keyboard-output-label"
                                className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]"
                            >
                                {tt.outputLabel}
                            </span>
                            {mode === 'auto' && dir && (
                                <span className="text-[11px] font-medium text-[var(--color-wine-600)] bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] rounded-full px-2 py-0.5">
                                    {s.detected}: {dir === 'en2th' ? 'EN → TH' : 'TH → EN'}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={copy}
                            disabled={!output}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-wine-700)] hover:text-[var(--color-wine-600)] disabled:opacity-50"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {tt.copy}
                        </button>
                    </div>
                    <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        role="region"
                        aria-labelledby="thai-keyboard-output-label"
                        aria-live="polite"
                        className="w-full h-72 p-4 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] bg-[var(--color-wine-50)] font-mono text-[14px] text-[var(--color-wine-800)] overflow-auto whitespace-pre-wrap"
                    >
                        {output || <span className="text-[var(--color-smoke-600)]/60 italic">{tt.emptyHint}</span>}
                    </motion.div>
                </div>
            </div>
        </ToolShell>
    );
}
