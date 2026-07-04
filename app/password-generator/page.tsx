'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard } from '@/components/ToolShell';

const AMBIGUOUS = /[0Ol1I|]/g;

// Unbiased random integer in [0, max) via rejection sampling.
function randomInt(max: number) {
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    let v: number;
    do {
        window.crypto.getRandomValues(buf);
        v = buf[0];
    } while (v >= limit);
    return v % max;
}

function strengthScore(pass: string) {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 8) score += 1;
    if (pass.length > 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
}

export default function PasswordGenerator() {
    const t = useT();
    const tt = t.pages.password;
    const { locale } = useLanguage();
    const s = locale === 'th'
        ? {
            excludeAmbiguous: 'ยกเว้นตัวอักษรที่สับสนง่าย (0, O, l, 1, I)',
            copyFailed: 'คัดลอกไม่สำเร็จ',
            clickToCopy: 'คลิกเพื่อคัดลอก',
        }
        : {
            excludeAmbiguous: 'Exclude ambiguous (0, O, l, 1, I)',
            copyFailed: 'Could not copy password',
            clickToCopy: 'Click to copy',
        };
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
    const [strength, setStrength] = useState(0);
    const [copied, setCopied] = useState(false);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current);
    }, []);

    const generatePassword = useCallback(() => {
        const charset = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
        };
        const strip = (set: string) => (excludeAmbiguous ? set.replace(AMBIGUOUS, '') : set);
        const pools: string[] = [];
        if (options.uppercase) pools.push(strip(charset.uppercase));
        if (options.lowercase) pools.push(strip(charset.lowercase));
        if (options.numbers) pools.push(strip(charset.numbers));
        if (options.symbols) pools.push(strip(charset.symbols));
        const chars = pools.join('');
        if (!chars) { setPassword(''); setStrength(0); return; }

        const len = Math.min(64, Math.max(4, Math.floor(length) || 4));
        // Guarantee at least one character from each selected set...
        const result: string[] = pools.map((pool) => pool[randomInt(pool.length)]);
        while (result.length < len) result.push(chars[randomInt(chars.length)]);
        // ...then shuffle so the guaranteed characters land at random positions.
        for (let i = result.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        const p = result.join('');
        setPassword(p);
        setCopied(false);
        setStrength(strengthScore(p));
    }, [length, options, excludeAmbiguous]);

    useEffect(() => { generatePassword(); }, [generatePassword]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return;
            const el = e.target as HTMLElement | null;
            if (el && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) || el.isContentEditable)) return;
            generatePassword();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [generatePassword]);

    const copy = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            toast.success(tt.copied);
            setCopied(true);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const strengthColor = strength <= 2 ? 'bg-[#a4364c]' : strength <= 4 ? 'bg-[#b87a3d]' : 'bg-[#3d6a4a]';
    const strengthLabel = strength <= 2 ? tt.weak : strength <= 4 ? tt.medium : tt.strong;
    const strengthText = strength <= 2 ? 'text-[#a4364c]' : strength <= 4 ? 'text-[#b87a3d]' : 'text-[#3d6a4a]';

    return (
        <ToolShell
            icon={<Lock className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker={t.tools['password-generator'].title}
            width="narrow"
        >
            <ToolCard>
                <motion.div
                    key={password}
                    initial={{ opacity: 0.4, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative mb-6 p-5 rounded-2xl bg-[var(--color-wine-50)] border-[1.5px] border-[var(--color-wine-100)] flex items-center justify-between gap-4"
                >
                    <button
                        type="button"
                        onClick={copy}
                        title={s.clickToCopy}
                        className="font-mono text-xl sm:text-2xl text-[var(--color-wine-800)] break-all text-left cursor-pointer select-all"
                    >
                        {password}
                    </button>
                    <div className="flex gap-1.5 shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.9, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            onClick={generatePassword}
                            className="p-2.5 rounded-xl text-[var(--color-wine-700)] hover:bg-white transition-colors"
                            title={`${tt.regenerate} (Enter)`}
                            aria-label={tt.regenerate}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={copy}
                            className="p-2.5 rounded-xl text-[var(--color-wine-700)] hover:bg-white transition-colors"
                            title={tt.copy}
                            aria-label={tt.copy}
                        >
                            {copied
                                ? <Check className="w-4 h-4 text-[#3d6a4a]" />
                                : <Copy className="w-4 h-4" />}
                        </motion.button>
                    </div>
                </motion.div>

                <div className="mb-8 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[var(--color-smoke-200)] rounded-full overflow-hidden">
                        <motion.div
                            className={cn('h-full transition-colors', strengthColor)}
                            initial={{ width: 0 }}
                            animate={{ width: `${(strength / 6) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                        />
                    </div>
                    <span className={cn('text-[12.5px] font-semibold tracking-wide', strengthText)}>
                        {strengthLabel}
                    </span>
                </div>

                <div className="space-y-7">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label
                                htmlFor="pw-length"
                                className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]"
                            >
                                {tt.length}
                            </label>
                            <input
                                type="number"
                                min={4}
                                max={64}
                                value={length}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    if (Number.isNaN(v)) return;
                                    setLength(Math.min(64, v));
                                }}
                                onBlur={() => setLength((v) => Math.min(64, Math.max(4, v)))}
                                aria-label={tt.length}
                                className="w-16 font-mono font-bold text-[var(--color-wine-700)] text-lg text-right bg-transparent border-b-[1.5px] border-[var(--color-wine-100)] focus:border-[var(--color-wine-400)] outline-none"
                            />
                        </div>
                        <input
                            id="pw-length"
                            type="range"
                            min={4}
                            max={64}
                            value={Math.min(64, Math.max(4, length))}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full h-2 bg-[var(--color-smoke-200)] rounded-full appearance-none cursor-pointer accent-[var(--color-wine-700)]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {([
                            { key: 'uppercase', label: tt.uppercase },
                            { key: 'lowercase', label: tt.lowercase },
                            { key: 'numbers', label: tt.numbers },
                            { key: 'symbols', label: tt.symbols },
                        ] as const).map(({ key, label }) => {
                            const checked = options[key];
                            return (
                                <motion.label
                                    key={key}
                                    whileHover={{ y: -1 }}
                                    className={cn(
                                        'flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-[1.5px]',
                                        checked
                                            ? 'bg-[var(--color-wine-50)] border-[var(--color-wine-300)]'
                                            : 'bg-white border-[var(--color-wine-100)] hover:border-[var(--color-wine-200)]'
                                    )}
                                >
                                    <span className="text-[14px] font-medium text-[var(--color-wine-700)]">{label}</span>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) =>
                                            setOptions((p) => {
                                                const next = { ...p, [key]: e.target.checked };
                                                // Keep at least one character set selected.
                                                if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) return p;
                                                return next;
                                            })
                                        }
                                        className="w-5 h-5 accent-[var(--color-wine-700)] rounded"
                                    />
                                </motion.label>
                            );
                        })}
                        <motion.label
                            whileHover={{ y: -1 }}
                            className={cn(
                                'sm:col-span-2 flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-[1.5px]',
                                excludeAmbiguous
                                    ? 'bg-[var(--color-wine-50)] border-[var(--color-wine-300)]'
                                    : 'bg-white border-[var(--color-wine-100)] hover:border-[var(--color-wine-200)]'
                            )}
                        >
                            <span className="text-[14px] font-medium text-[var(--color-wine-700)]">{s.excludeAmbiguous}</span>
                            <input
                                type="checkbox"
                                checked={excludeAmbiguous}
                                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                                className="w-5 h-5 accent-[var(--color-wine-700)] rounded"
                            />
                        </motion.label>
                    </div>
                </div>
            </ToolCard>

            <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] text-[12.5px] text-[var(--color-smoke-600)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-wine-600)] shrink-0" />
                <span>
                    {t.home.privacyBody}
                </span>
            </div>
        </ToolShell>
    );
}
