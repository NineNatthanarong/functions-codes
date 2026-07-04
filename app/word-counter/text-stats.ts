/**
 * Pure text-analysis helpers for the word counter.
 * Client-safe, dependency-free, deterministic for a given input.
 *
 * Thai support: Thai has no spaces between words, so when the input
 * contains Thai characters we segment the whole text with
 * Intl.Segmenter('th', { granularity: 'word' }) and count word-like
 * segments. When Segmenter is unavailable we fall back to a
 * whitespace split.
 */

export type KeywordStat = { word: string; count: number };

export type TextStats = {
    /** Characters including spaces (counted by code point) */
    chars: number;
    /** Characters excluding all whitespace */
    charsNoSpace: number;
    words: number;
    sentences: number;
    paragraphs: number;
    readingSeconds: number;
    speakingSeconds: number;
    /** Top 8 most frequent tokens, 1-char tokens excluded */
    keywords: KeywordStat[];
};

export const READING_WPM = 200;
export const SPEAKING_WPM = 130;

const THAI_CHAR = /[\u0E00-\u0E7F]/;

/* ── Intl.Segmenter (typed locally so we do not depend on lib versions) ── */

type ThaiSegmenter = {
    segment(text: string): Iterable<{ segment: string; isWordLike?: boolean }>;
};

type SegmenterCtor = new (
    locale: string,
    options: { granularity: 'word' }
) => ThaiSegmenter;

let segmenterCache: ThaiSegmenter | null | undefined;

function getThaiSegmenter(): ThaiSegmenter | null {
    if (segmenterCache !== undefined) return segmenterCache;
    try {
        const Ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
        segmenterCache = typeof Ctor === 'function' ? new Ctor('th', { granularity: 'word' }) : null;
    } catch {
        segmenterCache = null;
    }
    return segmenterCache;
}

/* ── Lazily-built regexes (constructed at runtime: the project targets
      ES2017, so \p{...} / lookbehind regex literals would not compile) ── */

let trimPunctCache: RegExp | null | undefined;

/** Strips leading/trailing punctuation from a token. */
function getTrimPunct(): RegExp {
    if (trimPunctCache === undefined) {
        try {
            trimPunctCache = new RegExp('^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$', 'gu');
        } catch {
            trimPunctCache = null;
        }
    }
    return (
        trimPunctCache ??
        /^[^A-Za-z0-9\u00C0-\u024F\u0E00-\u0E7F]+|[^A-Za-z0-9\u00C0-\u024F\u0E00-\u0E7F]+$/g
    );
}

let thaiBreakCache: RegExp | null | undefined;

/**
 * Whitespace between two Thai characters — in Thai writing a space is the
 * conventional sentence/clause boundary, so we treat it as a sentence break.
 */
function getThaiSentenceBreak(): RegExp | null {
    if (thaiBreakCache === undefined) {
        try {
            thaiBreakCache = new RegExp('(?<=[\\u0E00-\\u0E7F])\\s+(?=[\\u0E00-\\u0E7F])');
        } catch {
            thaiBreakCache = null;
        }
    }
    return thaiBreakCache;
}

/* ── Tokenizing ── */

export function tokenize(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    if (THAI_CHAR.test(trimmed)) {
        const segmenter = getThaiSegmenter();
        if (segmenter) {
            const out: string[] = [];
            for (const part of segmenter.segment(trimmed)) {
                if (part.isWordLike) out.push(part.segment.toLowerCase());
            }
            return out;
        }
    }

    // Fallback / non-Thai path: whitespace split, strip edge punctuation.
    const trimPunct = getTrimPunct();
    const out: string[] = [];
    for (const raw of trimmed.split(/\s+/)) {
        const cleaned = raw.replace(trimPunct, '').toLowerCase();
        if (cleaned) out.push(cleaned);
    }
    return out;
}

/* ── Sentences ── */

export function countSentences(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;

    // First split on explicit terminators (Latin + ellipsis).
    const chunks = trimmed.split(/[.!?…]+/);
    let count = 0;

    for (const rawChunk of chunks) {
        const chunk = rawChunk.trim();
        if (!chunk) continue;

        if (!THAI_CHAR.test(chunk)) {
            count += 1;
            continue;
        }

        // Thai heuristic: newlines and Thai-adjacent whitespace end sentences.
        const breaker = getThaiSentenceBreak();
        let parts = 0;
        for (const line of chunk.split(/\n+/)) {
            const l = line.trim();
            if (!l) continue;
            const pieces = breaker ? l.split(breaker) : l.split(/\s{2,}/);
            parts += pieces.filter((p) => p.trim().length > 0).length;
        }
        count += Math.max(parts, 1);
    }

    return count;
}

/* ── Paragraphs ── */

export function countParagraphs(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    let count = 0;
    for (const block of trimmed.split(/\n+/)) {
        if (block.trim()) count += 1;
    }
    return count;
}

/* ── Everything at once ── */

export function computeTextStats(text: string): TextStats {
    const chars = Array.from(text).length;
    const charsNoSpace = Array.from(text.replace(/\s+/g, '')).length;

    const tokens = tokenize(text);
    const words = tokens.length;
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);

    const readingSeconds = words === 0 ? 0 : Math.max(1, Math.round((words / READING_WPM) * 60));
    const speakingSeconds = words === 0 ? 0 : Math.max(1, Math.round((words / SPEAKING_WPM) * 60));

    const freq = new Map<string, number>();
    for (const token of tokens) {
        if (Array.from(token).length < 2) continue; // skip 1-char tokens
        freq.set(token, (freq.get(token) ?? 0) + 1);
    }
    const keywords: KeywordStat[] = Array.from(freq.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
        .slice(0, 8);

    return {
        chars,
        charsNoSpace,
        words,
        sentences,
        paragraphs,
        readingSeconds,
        speakingSeconds,
        keywords,
    };
}
