'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { diffChars, diffWords, diffLines, Change } from 'diff';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type DiffMode = 'chars' | 'words' | 'lines';

export default function DiffViewer() {
    const [oldText, setOldText] = useState('');
    const [newText, setNewText] = useState('');
    const [mode, setMode] = useState<DiffMode>('words');
    const [diffResult, setDiffResult] = useState<Change[]>([]);

    useEffect(() => {
        if (!oldText && !newText) {
            setDiffResult([]);
            return;
        }

        let diff;
        if (mode === 'chars') {
            diff = diffChars(oldText, newText);
        } else if (mode === 'words') {
            diff = diffWords(oldText, newText);
        } else {
            diff = diffLines(oldText, newText);
        }
        setDiffResult(diff);
    }, [oldText, newText, mode]);

    const clearAll = () => {
        setOldText('');
        setNewText('');
        toast.success('Cleared all text');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        Text Diff Viewer
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Compare two blocks of text and highlight the differences.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Diff Mode:</span>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                {(['chars', 'words', 'lines'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                                            mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={clearAll}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Original Text</label>
                            <textarea
                                value={oldText}
                                onChange={(e) => setOldText(e.target.value)}
                                className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none font-mono text-sm"
                                placeholder="Paste original text here..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">New Text</label>
                            <textarea
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none font-mono text-sm"
                                placeholder="Paste new text here..."
                            />
                        </div>
                    </div>

                    {/* Result Area */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-medium text-gray-900">Difference</h3>
                        </div>
                        <div className="p-6 font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {diffResult.map((part, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        part.added ? "bg-green-100 text-green-800 px-0.5 rounded" :
                                            part.removed ? "bg-red-100 text-red-800 px-0.5 rounded decoration-slice line-through opacity-70" :
                                                "text-gray-600"
                                    )}
                                >
                                    {part.value}
                                </span>
                            ))}
                            {diffResult.length === 0 && (
                                <span className="text-gray-400 italic">No differences to show.</span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
