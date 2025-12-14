import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Unit Converter - Convert CSS Units Online Free',
    description: 'Free CSS unit converter. Convert between px, rem, em, vh, vw, and more. Perfect for web developers. Instant conversion, no ads.',
    keywords: ['unit converter', 'CSS converter', 'px to rem', 'em to px', 'CSS units', 'rem converter', 'developer tool', 'web development'],
    openGraph: {
        title: 'Unit Converter - Free CSS Tool',
        description: 'Convert between CSS units instantly. px, rem, em, vh, vw, and more.',
        url: 'https://functions.codes/unit-converter',
    },
    twitter: {
        title: 'Unit Converter - CSS Units',
        description: 'Convert CSS units instantly. Free tool for developers.',
    },
    alternates: {
        canonical: 'https://functions.codes/unit-converter',
    },
};

export default function UnitConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Unit Converter',
        'Convert between CSS units instantly. Free online CSS unit converter.',
        'unit-converter'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Unit Converter', 'unit-converter');

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
