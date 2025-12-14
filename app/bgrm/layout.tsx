import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Background Remover - Remove Image Backgrounds Instantly',
    description: 'Free background remover tool. Remove image backgrounds instantly with AI or basic mode. No watermarks, no ads, 100% client-side processing.',
    keywords: ['background remover', 'remove background', 'AI background removal', 'image background', 'transparent background', 'free background remover', 'no watermark'],
    openGraph: {
        title: 'Background Remover - Free & No Watermarks',
        description: 'Remove image backgrounds instantly with AI or basic mode. No watermarks, no ads, completely free.',
        url: 'https://functions.codes/bgrm',
    },
    twitter: {
        title: 'Background Remover - Free Tool',
        description: 'Remove image backgrounds instantly. No watermarks, 100% client-side processing.',
    },
    alternates: {
        canonical: 'https://functions.codes/bgrm',
    },
};

export default function BackgroundRemoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Background Remover',
        'Remove image backgrounds instantly with AI or basic mode. No watermarks, completely free.',
        'bgrm'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Background Remover', 'bgrm');

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
