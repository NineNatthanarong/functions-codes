import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Color Picker - Pick Colors from Screen or Image',
    description: 'Free online color picker. Pick any color from your screen with the EyeDropper, or upload an image and click a pixel to get HEX, RGB, and HSL values. No ads.',
    keywords: ['color picker', 'eyedropper', 'pick color from screen', 'pick color from image', 'hex color picker', 'image color picker'],
    openGraph: {
        title: 'Color Picker - Free EyeDropper Tool',
        description: 'Pick colors from your screen or an uploaded image. Get HEX, RGB, and HSL values instantly. Free tool with no ads.',
        url: 'https://functions.codes/color-picker',
    },
    twitter: {
        title: 'Color Picker - Free Tool',
        description: 'Pick any color from your screen or an image. HEX, RGB, and HSL values. No ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/color-picker',
    },
};

export default function ColorPickerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Color Picker',
        'Pick colors from your screen with the EyeDropper, or click an uploaded image to sample any pixel. Free online color picker.',
        'color-picker'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Color Picker', 'color-picker');

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
