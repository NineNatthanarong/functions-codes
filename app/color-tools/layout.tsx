import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Color Converter & Gradient — แปลงสีและไล่ระดับ',
    description: 'Convert HEX, RGB, HSL, OKLCH and build CSS linear, radial, and conic gradients. Copy as CSS.',
    keywords: ['color converter', 'hex to rgb', 'rgb to hsl', 'oklch converter', 'css gradient generator', 'linear gradient', 'radial gradient', 'conic gradient'],
    openGraph: {
        title: 'Color Converter & Gradient Generator - Free Tool',
        description: 'Convert between HEX, RGB, HSL, OKLCH and build CSS linear, radial, and conic gradients. Free tool with no ads.',
        url: 'https://functions.codes/color-tools',
    },
    twitter: {
        title: 'Color Converter & Gradient Generator - Free Tool',
        description: 'Convert HEX, RGB, HSL, OKLCH and build CSS gradients. No ads, instant results.',
    },
    alternates: { canonical: 'https://functions.codes/color-tools' },
};

export default function ColorToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Color Converter & Gradient Generator',
        'Convert between HEX, RGB, HSL, OKLCH and build CSS linear, radial, and conic gradients.',
        'color-tools'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Color Converter & Gradient Generator', 'color-tools');

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
