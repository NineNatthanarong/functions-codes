import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'QR Code Generator - Create Custom QR Codes Free',
    description: 'Free QR code generator. Create custom QR codes for URLs, text, and more. Customize colors, size, and error correction. No ads, download as PNG.',
    keywords: ['QR code generator', 'create QR code', 'custom QR code', 'free QR generator', 'QR code maker', 'generate QR code'],
    openGraph: {
        title: 'QR Code Generator - Free & Customizable',
        description: 'Create custom QR codes instantly. Customize colors, size, and more. Free tool with no ads.',
        url: 'https://functions.codes/qr-generator',
    },
    twitter: {
        title: 'QR Code Generator - Free Tool',
        description: 'Create custom QR codes for URLs and text. No ads, instant generation.',
    },
    alternates: {
        canonical: 'https://functions.codes/qr-generator',
    },
};

export default function QRGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'QR Code Generator',
        'Create custom QR codes for URLs, text, and more. Free online QR code generator.',
        'qr-generator'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('QR Code Generator', 'qr-generator');

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
