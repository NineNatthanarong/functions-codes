'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PasswordGenerator() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });
    const [strength, setStrength] = useState(0);

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

        if (!chars) {
            setPassword('');
            return;
        }

        let generatedPassword = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            generatedPassword += chars[array[i] % chars.length];
        }

        setPassword(generatedPassword);
        calculateStrength(generatedPassword);
    }, [length, options]);

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) {
            setStrength(0);
            return;
        }
        if (pass.length > 8) score += 1;
        if (pass.length > 12) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        setStrength(score);
    };

    useEffect(() => {
        generatePassword();
    }, [generatePassword]);

    const copyToClipboard = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        toast.success('Password copied to clipboard');
    };

    const getStrengthColor = () => {
        if (strength <= 2) return 'bg-red-500';
        if (strength <= 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthLabel = () => {
        if (strength <= 2) return 'Weak';
        if (strength <= 4) return 'Medium';
        return 'Strong';
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        Password Generator
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Generate strong, secure, and random passwords instantly.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
                >
                    {/* Display */}
                    <div className="relative mb-8">
                        <div className="w-full p-6 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between group hover:border-blue-300 transition-colors">
                            <span className="font-mono text-2xl sm:text-3xl text-gray-900 break-all mr-4">
                                {password}
                            </span>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={generatePassword}
                                    className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Regenerate"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                    title="Copy"
                                >
                                    <Copy className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Strength Indicator */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn("h-full transition-colors duration-300", getStrengthColor())}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(strength / 5) * 100}%` }}
                                />
                            </div>
                            <span className={cn("text-sm font-medium",
                                strength <= 2 ? "text-red-500" :
                                    strength <= 4 ? "text-yellow-600" : "text-green-600"
                            )}>
                                {getStrengthLabel()}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between mb-4">
                                <label className="font-medium text-gray-900">Password Length</label>
                                <span className="text-blue-600 font-mono font-bold">{length}</span>
                            </div>
                            <input
                                type="range"
                                min="4"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Uppercase (A-Z)</span>
                                <input
                                    type="checkbox"
                                    checked={options.uppercase}
                                    onChange={(e) => setOptions(prev => ({ ...prev, uppercase: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Lowercase (a-z)</span>
                                <input
                                    type="checkbox"
                                    checked={options.lowercase}
                                    onChange={(e) => setOptions(prev => ({ ...prev, lowercase: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Numbers (0-9)</span>
                                <input
                                    type="checkbox"
                                    checked={options.numbers}
                                    onChange={(e) => setOptions(prev => ({ ...prev, numbers: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-700">Symbols (!@#$)</span>
                                <input
                                    type="checkbox"
                                    checked={options.symbols}
                                    onChange={(e) => setOptions(prev => ({ ...prev, symbols: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </label>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
