'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextInput, SegmentedControl, PrimaryButton } from '@/components/ToolShell';

const LOREM_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?`;

type GenerateType = 'paragraphs' | 'sentences' | 'words';

export default function LoremIpsumGenerator() {
    const t = useT();
    const tt = t.pages.lorem;
    const [count, setCount] = useState(3);
    const [type, setType] = useState<GenerateType>('paragraphs');
    const [generatedText, setGeneratedText] = useState('');

    const generateLorem = () => {
        let result = '';
        const sourceText = LOREM_TEXT.replace(/\n/g, ' ').trim();

        if (type === 'paragraphs') {
            const paragraphs = LOREM_TEXT.split('\n\n');
            const out: string[] = [];
            for (let i = 0; i < count; i++) out.push(paragraphs[i % paragraphs.length]);
            result = out.join('\n\n');
        } else if (type === 'sentences') {
            const sentences = sourceText.match(/[^.!?]+[.!?]+/g) || [];
            const out: string[] = [];
            for (let i = 0; i < count; i++) out.push(sentences[i % sentences.length].trim());
            result = out.join(' ');
        } else {
            const words = sourceText.replace(/[.,!?]/g, '').split(' ');
            const out: string[] = [];
            for (let i = 0; i < count; i++) out.push(words[i % words.length]);
            result = out.join(' ');
        }
        setGeneratedText(result);
    };

    useEffect(() => { generateLorem(); /* eslint-disable-next-line */ }, []);

    const copy = () => {
        if (!generatedText) return;
        navigator.clipboard.writeText(generatedText);
        toast.success(tt.copied);
    };

    return (
        <ToolShell
            icon={<Type className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Lorem Ipsum"
            width="wide"
        >
            <ToolCard className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                    <div>
                        <FieldLabel>{tt.count}</FieldLabel>
                        <TextInput
                            type="number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                        />
                    </div>
                    <div>
                        <FieldLabel>{tt.type}</FieldLabel>
                        <SegmentedControl
                            value={type}
                            onChange={setType}
                            options={[
                                { value: 'paragraphs', label: tt.paragraphs },
                                { value: 'sentences', label: tt.sentences },
                                { value: 'words', label: tt.words },
                            ]}
                        />
                    </div>
                    <div className="flex">
                        <PrimaryButton onClick={() => { generateLorem(); toast.success(tt.successToast); }} className="w-full">
                            <RefreshCw className="w-4 h-4" />
                            {tt.generate}
                        </PrimaryButton>
                    </div>
                </div>
            </ToolCard>

            <ToolCard className="relative group">
                <button
                    onClick={copy}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white border border-[var(--color-wine-100)] text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] opacity-0 group-hover:opacity-100 transition-opacity"
                    title={tt.copy}
                >
                    <Copy className="w-4 h-4" />
                </button>
                <motion.div
                    key={generatedText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose-style"
                >
                    {generatedText.split('\n\n').map((para, i) => (
                        <p key={i} className="text-[15px] text-[var(--color-smoke-600)] leading-relaxed mb-4 last:mb-0">
                            {para}
                        </p>
                    ))}
                </motion.div>
            </ToolCard>
        </ToolShell>
    );
}
