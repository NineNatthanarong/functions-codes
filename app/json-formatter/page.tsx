'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, CheckCircle, AlertCircle, Braces, AlignLeft, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function JsonFormatter() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const formatJson = () => {
        if (!input.trim()) return;
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed, null, 2));
            setError(null);
            toast.success('JSON formatted successfully');
        } catch (err) {
            setError((err as Error).message);
            setOutput('');
            toast.error('Invalid JSON');
        }
    };

    const minifyJson = () => {
        if (!input.trim()) return;
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed));
            setError(null);
            toast.success('JSON minified successfully');
        } catch (err) {
            setError((err as Error).message);
            setOutput('');
            toast.error('Invalid JSON');
        }
    };

    const copyToClipboard = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        toast.success('Copied to clipboard');
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setError(null);
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
                        JSON Formatter
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Format, validate, and minify your JSON data.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                    {/* Input */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col h-full"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Braces className="w-4 h-4" />
                                Input JSON
                            </label>
                            <button
                                onClick={clearAll}
                                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Paste your JSON here..."
                            className="flex-grow w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none font-mono text-sm bg-white"
                        />
                    </motion.div>

                    {/* Output */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col h-full"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                {error ? (
                                    <span className="text-red-500 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Invalid JSON
                                    </span>
                                ) : (
                                    <span className="text-green-600 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Valid JSON
                                    </span>
                                )}
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={formatJson}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Format"
                                >
                                    <AlignLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={minifyJson}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Minify"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Copy"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative flex-grow">
                            <textarea
                                readOnly
                                value={error || output}
                                className={cn(
                                    "w-full h-full p-4 rounded-2xl border transition-all outline-none resize-none font-mono text-sm bg-gray-50",
                                    error
                                        ? "border-red-200 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                        : "border-gray-200 text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                )}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
