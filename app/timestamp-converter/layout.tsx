import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Unix Timestamp Converter - Epoch to Date Online',
    description: 'Free unix timestamp converter. Convert epoch seconds or milliseconds to local time, UTC ISO 8601, and Thai Buddhist Era dates — and dates back to timestamps. Live unix clock, 100% in your browser, no ads.',
    keywords: ['unix timestamp converter', 'epoch converter', 'timestamp to date', 'date to timestamp', 'unix time', 'epoch time', 'ISO 8601', 'Buddhist Era date', 'แปลง timestamp', 'free timestamp tool'],
    openGraph: {
        title: 'Unix Timestamp Converter - Free Online Tool',
        description: 'Convert unix timestamps (seconds or milliseconds) to readable dates including Thai Buddhist Era, and dates back to timestamps. Live unix clock included.',
        url: 'https://functions.codes/timestamp-converter',
    },
    twitter: {
        title: 'Unix Timestamp Converter - Free Tool',
        description: 'Convert unix timestamps to readable dates and back. No ads, instant conversion in your browser.',
    },
    alternates: {
        canonical: 'https://functions.codes/timestamp-converter',
    },
};

export default function TimestampConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Unix Timestamp Converter',
        'Convert unix timestamps (seconds or milliseconds) to local time, UTC ISO 8601, and Thai Buddhist Era dates — and convert dates back to timestamps. Free, client-side, no ads.',
        'timestamp-converter'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Unix Timestamp Converter', 'timestamp-converter');

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
