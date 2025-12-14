import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'File Converter - Convert PDF, HEIC & Images',
    description: 'Free online file converter. Convert PDF, HEIC, and images to PNG, JPEG, or WEBP. No ads, 100% client-side processing, zero data collection.',
    keywords: ['file converter', 'PDF converter', 'HEIC converter', 'image converter', 'PNG converter', 'JPEG converter', 'WEBP converter', 'free converter', 'no ads'],
    openGraph: {
        title: 'File Converter - Convert PDF, HEIC & Images',
        description: 'Free online file converter. Convert PDF to images, HEIC to JPEG, PNG, and WEBP. No ads, instant conversion.',
        url: 'https://functions.codes/file-converter',
    },
    twitter: {
        title: 'File Converter - Free & Ad-Free',
        description: 'Convert PDF, HEIC, and images to PNG, JPEG, or WEBP. No ads, 100% client-side processing.',
    },
    alternates: {
        canonical: 'https://functions.codes/file-converter',
    },
};

export default function FileConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'File Converter',
        'Convert PDF, HEIC, and images to PNG, JPEG, or WEBP. Free online file converter with no ads.',
        'file-converter'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('File Converter', 'file-converter');

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
