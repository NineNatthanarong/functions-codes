import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Watermark Stamper - Add Text Watermarks to Images Free',
    description: 'Free online watermark tool. Add a text watermark to your images and adjust size, position, opacity, rotation, and color. Fully offline, no ads.',
    keywords: ['watermark', 'image watermark', 'add watermark to photo', 'text watermark', 'watermark maker', 'free watermark tool'],
    openGraph: {
        title: 'Watermark Stamper - Free & Private',
        description: 'Add a text watermark to your images right in the browser. Adjust size, position, opacity, and rotation. Free tool with no ads.',
        url: 'https://functions.codes/watermark',
    },
    twitter: {
        title: 'Watermark Stamper - Free Tool',
        description: 'Add text watermarks to photos in your browser. No uploads, no ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/watermark',
    },
};

export default function WatermarkLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Watermark Stamper',
        'Add a text watermark to your images. Adjust size, position, opacity, and rotation. Free online watermark tool.',
        'watermark'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Watermark Stamper', 'watermark');

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
