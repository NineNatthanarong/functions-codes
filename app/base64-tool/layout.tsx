import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Base64 Encoder / Decoder - Encode Text and Files Online',
    description: 'Free Base64 encoder and decoder. Convert text and files to Base64 or data URLs and back, with URL-safe variant and full unicode/Thai support. 100% in your browser, no ads.',
    keywords: ['Base64 encoder', 'Base64 decoder', 'Base64 converter', 'encode Base64', 'decode Base64', 'data URL generator', 'file to Base64', 'Base64 to file', 'URL-safe Base64', 'free Base64 tool'],
    openGraph: {
        title: 'Base64 Encoder / Decoder - Free Online Tool',
        description: 'Encode and decode Base64 for text and files. Data URL generator, URL-safe variant, unicode support. Runs entirely in your browser.',
        url: 'https://functions.codes/base64-tool',
    },
    twitter: {
        title: 'Base64 Encoder / Decoder - Free Tool',
        description: 'Encode and decode Base64 text and files online. No ads, no uploads, instant conversion.',
    },
    alternates: {
        canonical: 'https://functions.codes/base64-tool',
    },
};

export default function Base64ToolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Base64 Encoder / Decoder',
        'Encode and decode Base64 for text and files. Data URL generator with URL-safe variant and full unicode support, running entirely in the browser.',
        'base64-tool'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Base64 Encoder / Decoder', 'base64-tool');

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
