import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Markdown Editor - Write & Preview Markdown Online',
    description: 'Free markdown editor with live preview. Write markdown, see results instantly, export as PDF. Clean interface, no ads, 100% client-side.',
    keywords: ['markdown editor', 'markdown preview', 'write markdown', 'markdown to PDF', 'online markdown editor', 'free markdown tool'],
    openGraph: {
        title: 'Markdown Editor - Free Online Tool',
        description: 'Write markdown with live preview. Export as PDF. Simple, clean, fast.',
        url: 'https://functions.codes/markdown-editor',
    },
    twitter: {
        title: 'Markdown Editor',
        description: 'Write markdown with live preview. Free tool, no ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/markdown-editor',
    },
};

export default function MarkdownEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Markdown Editor',
        'Write markdown with live preview and export as PDF. Free online markdown editor.',
        'markdown-editor'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Markdown Editor', 'markdown-editor');

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
