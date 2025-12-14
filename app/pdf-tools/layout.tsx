import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'PDF Tools - Merge, Split & Compress PDFs Free',
    description: 'Free PDF tools online. Merge, split, and compress PDF files. No file size limits, no watermarks. 100% client-side processing, completely free.',
    keywords: ['PDF tools', 'merge PDF', 'split PDF', 'compress PDF', 'PDF merger', 'PDF splitter', 'free PDF tools', 'no watermark'],
    openGraph: {
        title: 'PDF Tools - Free Online PDF Editor',
        description: 'Merge, split, and compress PDF files. No watermarks, no file limits, completely free.',
        url: 'https://functions.codes/pdf-tools',
    },
    twitter: {
        title: 'PDF Tools - Free & No Watermarks',
        description: 'Merge, split, and compress PDFs. 100% client-side, no file limits.',
    },
    alternates: {
        canonical: 'https://functions.codes/pdf-tools',
    },
};

export default function PDFToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'PDF Tools',
        'Merge, split, and compress PDF files online. Free PDF tools with no watermarks.',
        'pdf-tools'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('PDF Tools', 'pdf-tools');

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
