'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LOREM_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?`;

type GenerateType = 'paragraphs' | 'sentences' | 'words';

export default function LoremIpsumGenerator() {
    const [count, setCount] = useState(3);
    const [type, setType] = useState<GenerateType>('paragraphs');
    const [generatedText, setGeneratedText] = useState('');

    const generateLorem = () => {
        let result = '';
        const sourceText = LOREM_TEXT.replace(/\n/g, ' ').trim();

        if (type === 'paragraphs') {
            const paragraphs = LOREM_TEXT.split('\n\n');
            const repeatedParagraphs = [];
            for (let i = 0; i < count; i++) {
                repeatedParagraphs.push(paragraphs[i % paragraphs.length]);
            }
            result = repeatedParagraphs.join('\n\n');
        } else if (type === 'sentences') {
            const sentences = sourceText.match(/[^.!?]+[.!?]+/g) || [];
            const repeatedSentences = [];
            for (let i = 0; i < count; i++) {
                repeatedSentences.push(sentences[i % sentences.length].trim());
            }
            result = repeatedSentences.join(' ');
        } else {
            const words = sourceText.replace(/[.,!?]/g, '').split(' ');
            const repeatedWords = [];
            for (let i = 0; i < count; i++) {
                repeatedWords.push(words[i % words.length]);
            }
            result = repeatedWords.join(' ');
        }

        setGeneratedText(result);
        toast.success('Generated successfully');
    };

    const copyToClipboard = () => {
        if (!generatedText) return;
        navigator.clipboard.writeText(generatedText);
        toast.success('Copied to clipboard');
    };

    // Generate on first load
    useState(() => {
        generateLorem();
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        Lorem Ipsum Generator
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Generate placeholder text for your designs.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Controls */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Count
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={count}
                                    onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type
                                </label>
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    {(['paragraphs', 'sentences', 'words'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={cn(
                                                "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                                                type === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={generateLorem}
                                    className="w-full px-4 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Output */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={copyToClipboard}
                                className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Copy to clipboard"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="prose prose-gray max-w-none">
                            {generatedText.split('\n\n').map((para, i) => (
                                <p key={i} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
