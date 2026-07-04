import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'EXIF Stripper - Remove Photo Metadata Online Free',
    description: 'Free EXIF metadata remover. Strip GPS location, dates, and camera info from photos before sharing. Inspect and clean image metadata in your browser.',
    keywords: ['EXIF remover', 'strip EXIF data', 'remove photo metadata', 'GPS location remover', 'image metadata cleaner', 'EXIF stripper'],
    openGraph: {
        title: 'EXIF Stripper - Remove Photo Metadata Free',
        description: 'Strip GPS, dates, and camera info from photos before sharing. Runs entirely in your browser.',
        url: 'https://functions.codes/exif-stripper',
    },
    twitter: {
        title: 'EXIF Stripper - Free Tool',
        description: 'Remove GPS location and camera metadata from photos. Private, in-browser, no ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/exif-stripper',
    },
};

export default function ExifStripperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'EXIF Stripper',
        'Inspect and remove EXIF metadata — GPS location, dates, and camera info — from photos in your browser.',
        'exif-stripper'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('EXIF Stripper', 'exif-stripper');

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
