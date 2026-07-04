import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Word Counter - Count Words, Characters & Reading Time Online',
    description: 'Free word and character counter with full Thai word segmentation. Count words, characters, sentences, paragraphs, reading and speaking time, keyword density, and check Twitter/X, Instagram, and SEO character limits. No ads.',
    keywords: ['word counter', 'character counter', 'count words online', 'Thai word counter', 'นับคำ', 'นับตัวอักษร', 'reading time calculator', 'character limit checker', 'keyword density', 'free word count tool'],
    openGraph: {
        title: 'Word Counter - Free Online Tool',
        description: 'Count words, characters, sentences, and reading time live. Thai language support, character-limit checks, no ads.',
        url: 'https://functions.codes/word-counter',
    },
    twitter: {
        title: 'Word Counter - Free Tool',
        description: 'Count words and characters online with Thai support. No ads, live results.',
    },
    alternates: {
        canonical: 'https://functions.codes/word-counter',
    },
};

export default function WordCounterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Word Counter',
        'Count words, characters, sentences, paragraphs, and reading time online. Free word counter with Thai word segmentation.',
        'word-counter'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Word Counter', 'word-counter');

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {children}
        </>
    );
}
