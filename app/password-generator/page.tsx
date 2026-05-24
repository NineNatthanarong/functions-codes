'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard } from '@/components/ToolShell';

export default function PasswordGenerator() {
    const t = useT();
    const tt = t.pages.password;
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });
    const [strength, setStrength] = useState(0);

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) { setStrength(0); return; }
        if (pass.length > 8) score += 1;
        if (pass.length > 12) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        setStrength(score);
    };

    const generatePassword = useCallback(() => {
        const charset = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
        };
        let chars = '';
        if (options.uppercase) chars += charset.uppercase;
        if (options.lowercase) chars += charset.lowercase;
        if (options.numbers) chars += charset.numbers;
        if (options.symbols) chars += charset.symbols;
        if (!chars) { setPassword(''); return; }

        const arr = new Uint32Array(length);
        window.crypto.getRandomValues(arr);
        let p = '';
        for (let i = 0; i < length; i++) p += chars[arr[i] % chars.length];
        setPassword(p);
        calculateStrength(p);
    }, [length, options]);

    useEffect(() => { generatePassword(); }, [generatePassword]);

    const copy = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        toast.success(tt.copied);
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
                    <span className="font-mono text-xl sm:text-2xl text-[var(--color-wine-800)] break-all">
                        {password}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.9, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            onClick={generatePassword}
                            className="p-2.5 rounded-xl text-[var(--color-wine-700)] hover:bg-white transition-colors"
                            title={tt.regenerate}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={copy}
                            className="p-2.5 rounded-xl text-[var(--color-wine-700)] hover:bg-white transition-colors"
                            title={tt.copy}
                        >
                            <Copy className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>

                <div className="mb-8 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[var(--color-smoke-200)] rounded-full overflow-hidden">
                        <motion.div
                            className={cn('h-full transition-colors', strengthColor)}
                            initial={{ width: 0 }}
                            animate={{ width: `${(strength / 5) * 100}%` }}
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
                            <label className="text-[12.5px] font-semibold tracking-wide text-[var(--color-wine-700)]">
                                {tt.length}
                            </label>
                            <span className="font-mono font-bold text-[var(--color-wine-700)] text-lg">{length}</span>
                        </div>
                        <input
                            type="range"
                            min={4}
                            max={64}
                            value={length}
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
                                        onChange={(e) => setOptions((p) => ({ ...p, [key]: e.target.checked }))}
                                        className="w-5 h-5 accent-[var(--color-wine-700)] rounded"
                                    />
                                </motion.label>
                            );
                        })}
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
