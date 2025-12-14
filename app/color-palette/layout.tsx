import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Color Palette Extractor - Extract Colors from Images',
    description: 'Free color palette extractor. Extract dominant colors from any image. Get hex codes instantly. Perfect for designers. No ads, 100% client-side.',
    keywords: ['color palette', 'color extractor', 'extract colors', 'image colors', 'color picker', 'palette generator', 'hex colors', 'design tool'],
    openGraph: {
        title: 'Color Palette Extractor - Free Tool',
        description: 'Extract dominant colors from images. Get hex codes instantly, perfect for designers.',
        url: 'https://functions.codes/color-palette',
    },
    twitter: {
        title: 'Color Palette Extractor - Free',
        description: 'Extract colors from images and get hex codes. No ads, instant results.',
    },
    alternates: {
        canonical: 'https://functions.codes/color-palette',
    },
};

export default function ColorPaletteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Color Palette Extractor',
        'Extract dominant colors from images and get hex codes. Free online color palette tool.',
        'color-palette'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Color Palette Extractor', 'color-palette');

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
