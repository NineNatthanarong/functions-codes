import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Image Cropper & Resizer - Crop, Resize, Rotate Images Free',
    description: 'Crop, resize, rotate, and flip images in your browser. No upload, no watermark.',
    keywords: ['image cropper', 'crop image online', 'resize image', 'rotate image', 'flip image', 'free image cropper'],
    openGraph: {
        title: 'Image Cropper & Resizer - Free Online Tool',
        description: 'Crop, resize, rotate, and flip images right in your browser. No upload, no watermark, no ads.',
        url: 'https://functions.codes/image-cropper',
    },
    twitter: {
        title: 'Image Cropper & Resizer - Free Tool',
        description: 'Crop, resize, rotate, and flip images in your browser. No upload, no watermark.',
    },
    alternates: {
        canonical: 'https://functions.codes/image-cropper',
    },
};

export default function ImageCropperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Image Cropper & Resizer',
        'Crop, resize, rotate, and flip images in your browser. Free online image cropper.',
        'image-cropper'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Image Cropper & Resizer', 'image-cropper');

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
