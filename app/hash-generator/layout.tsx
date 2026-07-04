import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Hash Generator - MD5, SHA-1, SHA-256, SHA-512 Online',
    description: 'Free online hash generator. Compute MD5, SHA-1, SHA-256, SHA-384, and SHA-512 checksums from text or files. Verify download checksums. 100% client-side, no ads.',
    keywords: ['hash generator', 'MD5 generator', 'SHA-256 generator', 'SHA-512', 'checksum calculator', 'file checksum', 'verify checksum', 'hash text online', 'free hash tool'],
    openGraph: {
        title: 'Hash Generator - Free Online Tool',
        description: 'Compute MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or files. Verify checksums in your browser.',
        url: 'https://functions.codes/hash-generator',
    },
    twitter: {
        title: 'Hash Generator - Free Tool',
        description: 'MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes from text or files. No ads, fully client-side.',
    },
    alternates: {
        canonical: 'https://functions.codes/hash-generator',
    },
};

export default function HashGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Hash Generator',
        'Compute MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or files. Verify download checksums entirely in your browser.',
        'hash-generator'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Hash Generator', 'hash-generator');

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
