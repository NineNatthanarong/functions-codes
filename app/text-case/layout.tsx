import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Text Case Converter - UPPERCASE, camelCase, snake_case Online',
    description: 'Free text case converter. Convert text to UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case and more — live, in your browser. No ads.',
    keywords: ['text case converter', 'uppercase converter', 'lowercase converter', 'camelCase converter', 'snake_case converter', 'kebab-case converter', 'title case', 'sentence case', 'แปลงตัวพิมพ์', 'free text tool'],
    openGraph: {
        title: 'Text Case Converter - Free Online Tool',
        description: 'Convert text between UPPERCASE, camelCase, snake_case, kebab-case and more. Live results, 100% in your browser.',
        url: 'https://functions.codes/text-case',
    },
    twitter: {
        title: 'Text Case Converter - Free Tool',
        description: 'Convert text to any case style online. No ads, instant results.',
    },
    alternates: {
        canonical: 'https://functions.codes/text-case',
    },
};

export default function TextCaseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Text Case Converter',
        'Convert text to UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case and more — free, live, in your browser.',
        'text-case'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Text Case Converter', 'text-case');

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
