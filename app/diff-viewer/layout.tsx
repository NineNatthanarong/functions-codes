import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Text Diff Viewer - Compare Text & Code Online',
    description: 'Free text diff viewer. Compare two texts or code snippets side-by-side. Highlight differences instantly. Perfect for developers. No ads.',
    keywords: ['diff viewer', 'text compare', 'code compare', 'text difference', 'compare files', 'diff tool', 'code diff', 'text comparison'],
    openGraph: {
        title: 'Text Diff Viewer - Free Comparison Tool',
        description: 'Compare two texts or code snippets side-by-side. Highlight differences instantly.',
        url: 'https://functions.codes/diff-viewer',
    },
    twitter: {
        title: 'Text Diff Viewer',
        description: 'Compare text and code snippets. Free tool with instant highlighting.',
    },
    alternates: {
        canonical: 'https://functions.codes/diff-viewer',
    },
};

export default function DiffViewerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Text Diff Viewer',
        'Compare two texts or code snippets side-by-side. Free online diff viewer.',
        'diff-viewer'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Text Diff Viewer', 'diff-viewer');

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
