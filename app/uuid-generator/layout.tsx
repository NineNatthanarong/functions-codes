import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'UUID Generator - Generate UUID v4 & v7 Online',
    description: 'Free online UUID generator. Generate up to 500 random UUID v4 or time-sortable UUID v7 (RFC 9562) at once. Uppercase, no-hyphen, and braces formats. Copy or download as .txt. No ads, 100% client-side.',
    keywords: ['UUID generator', 'UUID v4', 'UUID v7', 'GUID generator', 'random UUID', 'bulk UUID generator', 'time-sortable UUID', 'online UUID tool', 'free UUID generator'],
    openGraph: {
        title: 'UUID Generator - Free Online Tool',
        description: 'Generate up to 500 UUID v4 or time-sortable UUID v7 at once. Copy or download instantly. 100% client-side.',
        url: 'https://functions.codes/uuid-generator',
    },
    twitter: {
        title: 'UUID Generator - Free Tool',
        description: 'Generate UUID v4 and v7 in bulk online. No ads, instant results.',
    },
    alternates: {
        canonical: 'https://functions.codes/uuid-generator',
    },
};

export default function UuidGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'UUID Generator',
        'Generate up to 500 random UUID v4 or time-sortable UUID v7 (RFC 9562) at once. Free online UUID generator, 100% client-side.',
        'uuid-generator'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('UUID Generator', 'uuid-generator');

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
