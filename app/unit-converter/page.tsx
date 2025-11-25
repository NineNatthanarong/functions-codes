'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function UnitConverter() {
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
        // Recalculate from current PX
        setRem(px / val);
        setEm(px / val);
        setPercent((px / val) * 100);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label}`);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        CSS Unit Converter
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Convert between Pixels, REM, EM, and Percentage.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    {/* Base Configuration */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-sm mx-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                            Base Font Size (px)
                        </label>
                        <div className="flex items-center justify-center gap-2">
                            <input
                                type="number"
                                value={baseSize}
                                onChange={(e) => handleBaseChange(Number(e.target.value))}
                                className="w-24 px-3 py-2 text-center rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                            />
                            <span className="text-gray-400 text-sm">px</span>
                        </div>
                    </div>

                    {/* Converters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* PX Input */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
                            <label className="text-lg font-semibold text-gray-900">Pixels</label>
                            <div className="relative w-full max-w-[200px]">
                                <input
                                    type="number"
                                    value={px}
                                    onChange={(e) => handlePxChange(Number(e.target.value))}
                                    className="w-full px-4 py-3 text-2xl text-center font-bold text-gray-900 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">px</span>
                            </div>
                            <button
                                onClick={() => copyToClipboard(`${px}px`, 'Pixels')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <Copy className="w-4 h-4" /> Copy
                            </button>
                        </div>

                        {/* REM Input */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
                            <label className="text-lg font-semibold text-gray-900">REM</label>
                            <div className="relative w-full max-w-[200px]">
                                <input
                                    type="number"
                                    value={rem}
                                    onChange={(e) => handleRemChange(Number(e.target.value))}
                                    step="0.0625"
                                    className="w-full px-4 py-3 text-2xl text-center font-bold text-gray-900 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">rem</span>
                            </div>
                            <button
                                onClick={() => copyToClipboard(`${rem}rem`, 'REM')}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                                <Copy className="w-4 h-4" /> Copy
                            </button>
                        </div>
                    </div>

                    {/* Read Only Conversions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">EM</p>
                                <p className="text-2xl font-bold text-gray-900">{em.toFixed(3)}<span className="text-base font-normal text-gray-400 ml-1">em</span></p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(`${em.toFixed(3)}em`, 'EM')}
                                className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                            >
                                <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Percentage</p>
                                <p className="text-2xl font-bold text-gray-900">{percent.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">%</span></p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(`${percent.toFixed(1)}%`, 'Percentage')}
                                className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                            >
                                <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
