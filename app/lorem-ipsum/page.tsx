'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextInput, SegmentedControl, PrimaryButton } from '@/components/ToolShell';

const LOREM_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?`;

type GenerateType = 'paragraphs' | 'sentences' | 'words';

const PARAGRAPHS = LOREM_TEXT.split('\n\n');
const SENTENCES = (LOREM_TEXT.replace(/\n/g, ' ').match(/[^.!?]+[.!?]+/g) || []).map((s) => s.trim());
const WORDS = LOREM_TEXT.replace(/\n/g, ' ').replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);

// Deterministic PRNG so output is a pure function of (count, type, seed).
// Seed 0 keeps the canonical "Lorem ipsum dolor sit amet..." order, which
// makes the initial render hydration-safe; Generate picks a fresh seed.
function mulberry32(seed: number) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

function buildLorem(count: number, type: GenerateType, seed: number): string {
    if (seed === 0) {
        const pool = type === 'paragraphs' ? PARAGRAPHS : type === 'sentences' ? SENTENCES : WORDS;
        const out: string[] = [];
        for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
        return out.join(type === 'paragraphs' ? '\n\n' : ' ');
    }

    const rand = mulberry32(seed);

    if (type === 'words') {
        let pool = shuffle(WORDS, rand);
        const out: string[] = [];
        for (let i = 0; i < count; i++) {
            if (i > 0 && i % pool.length === 0) pool = shuffle(WORDS, rand);
            out.push(pool[i % pool.length]);
        }
        return out.join(' ');
    }

    // Draw sentences from a shuffled pool, reshuffling on each full pass so
    // long outputs never repeat the same block verbatim.
    let pool = shuffle(SENTENCES, rand);
    let drawn = 0;
    const nextSentence = () => {
        if (drawn > 0 && drawn % pool.length === 0) pool = shuffle(SENTENCES, rand);
        return pool[drawn++ % pool.length];
    };

    if (type === 'sentences') {
        const out: string[] = [];
        for (let i = 0; i < count; i++) out.push(nextSentence());
        return out.join(' ');
    }

    const paragraphs: string[] = [];
    for (let p = 0; p < count; p++) {
        const len = 4 + Math.floor(rand() * 3);
        const sentences: string[] = [];
        for (let i = 0; i < len; i++) sentences.push(nextSentence());
        paragraphs.push(sentences.join(' '));
    }
    return paragraphs.join('\n\n');
}

export default function LoremIpsumGenerator() {
    const { locale, t } = useLanguage();
    const tt = t.pages.lorem;
    const s = locale === 'th'
        ? { copyFailed: 'คัดลอกไม่สำเร็จ', words: 'คำ', characters: 'อักขระ' }
        : { copyFailed: 'Copy failed', words: 'words', characters: 'characters' };

    const [count, setCount] = useState(3);
    const [countInput, setCountInput] = useState('3');
    const [type, setType] = useState<GenerateType>('paragraphs');
    const [seed, setSeed] = useState(0);

    const generatedText = useMemo(() => buildLorem(count, type, seed), [count, type, seed]);
    const wordCount = useMemo(() => generatedText.split(/\s+/).filter(Boolean).length, [generatedText]);

    const handleCountChange = (raw: string) => {
        setCountInput(raw);
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) setCount(Math.max(1, Math.min(100, parsed)));
    };

    const regenerate = () => {
        setSeed(Math.floor(Math.random() * 0xffffffff) || 1);
        toast.success(tt.successToast);
    };

    const copy = async () => {
        if (!generatedText) return;
        try {
            await navigator.clipboard.writeText(generatedText);
            toast.success(tt.copied);
        } catch {
            toast.error(s.copyFailed);
        }
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
                            value={countInput}
                            onChange={(e) => handleCountChange(e.target.value)}
                            onBlur={() => setCountInput(String(count))}
                            onKeyDown={(e) => { if (e.key === 'Enter') regenerate(); }}
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
                        <PrimaryButton onClick={regenerate} className="w-full">
                            <RefreshCw className="w-4 h-4" />
                            {tt.generate}
                        </PrimaryButton>
                    </div>
                </div>
            </ToolCard>

            <ToolCard className="relative group">
                <button
                    onClick={copy}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white border border-[var(--color-wine-100)] text-[var(--color-wine-700)] hover:bg-[var(--color-wine-50)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
                    title={tt.copy}
                    aria-label={tt.copy}
                >
                    <Copy className="w-4 h-4" />
                </button>
                <motion.div
                    key={generatedText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {generatedText.split('\n\n').map((para, i) => (
                        <p key={i} className="text-[15px] text-[var(--color-smoke-600)] leading-relaxed mb-4 last:mb-0">
                            {para}
                        </p>
                    ))}
                </motion.div>
                <p className="mt-5 pt-4 border-t border-[var(--color-line)] text-[12px] text-[var(--color-ink-3)]">
                    {wordCount.toLocaleString()} {s.words} · {generatedText.length.toLocaleString()} {s.characters}
                </p>
            </ToolCard>
        </ToolShell>
    );
}
