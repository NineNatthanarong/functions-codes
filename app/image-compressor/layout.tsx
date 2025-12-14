import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Image Compressor - Compress Images for Free',
    description: 'Free online image compressor. Reduce image file sizes without losing quality. Compress PNG, JPEG, and WEBP images. No ads, 100% client-side.',
    keywords: ['image compressor', 'compress images', 'reduce image size', 'optimize images', 'image optimizer', 'free image compression', 'PNG compressor', 'JPEG compressor'],
    openGraph: {
        title: 'Image Compressor - Free & No Ads',
        description: 'Compress PNG, JPEG, and WEBP images without losing quality. Free online tool with no ads.',
        url: 'https://functions.codes/image-compressor',
    },
    twitter: {
        title: 'Image Compressor - Free Tool',
        description: 'Reduce image file sizes without losing quality. No ads, 100% client-side processing.',
    },
    alternates: {
        canonical: 'https://functions.codes/image-compressor',
    },
};

export default function ImageCompressorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Image Compressor',
        'Compress images without losing quality. Free online image compression tool.',
        'image-compressor'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Image Compressor', 'image-compressor');

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
