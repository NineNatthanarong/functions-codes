import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'JSON Formatter - Format and Validate JSON Online',
    description: 'Free JSON formatter and validator. Format, beautify, and validate JSON code online. Syntax highlighting, error detection, and minification. No ads.',
    keywords: ['JSON formatter', 'JSON validator', 'beautify JSON', 'format JSON', 'JSON pretty print', 'JSON minify', 'free JSON tool'],
    openGraph: {
        title: 'JSON Formatter - Free Online Tool',
        description: 'Format, beautify, and validate JSON code online. Free tool with syntax highlighting.',
        url: 'https://functions.codes/json-formatter',
    },
    twitter: {
        title: 'JSON Formatter - Free Tool',
        description: 'Format and validate JSON code online. No ads, instant formatting.',
    },
    alternates: {
        canonical: 'https://functions.codes/json-formatter',
    },
};

export default function JSONFormatterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'JSON Formatter',
        'Format, beautify, and validate JSON code online. Free JSON formatter with syntax highlighting.',
        'json-formatter'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('JSON Formatter', 'json-formatter');

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
