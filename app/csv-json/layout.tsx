import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'CSV to JSON Converter - Convert CSV and JSON Online',
    description: 'Free CSV to JSON and JSON to CSV converter. Handles quoted fields, custom delimiters, headers, and type coercion. Live preview, 100% in your browser. No ads.',
    keywords: ['CSV to JSON', 'JSON to CSV', 'CSV converter', 'JSON converter', 'CSV parser', 'convert CSV online', 'Excel to JSON', 'free CSV tool'],
    openGraph: {
        title: 'CSV ↔ JSON Converter - Free Online Tool',
        description: 'Convert CSV to JSON and back, right in your browser. Quoted fields, custom delimiters, live table preview.',
        url: 'https://functions.codes/csv-json',
    },
    twitter: {
        title: 'CSV ↔ JSON Converter - Free Tool',
        description: 'Convert CSV to JSON and JSON to CSV online. No ads, no upload, instant.',
    },
    alternates: {
        canonical: 'https://functions.codes/csv-json',
    },
};

export default function CsvJsonLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'CSV to JSON Converter',
        'Convert CSV to JSON and JSON to CSV online. Handles quoted fields, custom delimiters, and headers. Free, client-side, no upload.',
        'csv-json'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('CSV to JSON Converter', 'csv-json');

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
