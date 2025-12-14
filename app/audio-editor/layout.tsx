import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Audio Editor - Edit Audio Files Online Free',
    description: 'Free online audio editor. Edit audio files with waveform visualization. Trim, cut, and export audio. No cloud uploads, 100% client-side processing.',
    keywords: ['audio editor', 'edit audio', 'audio trimmer', 'audio cutter', 'waveform editor', 'free audio editor', 'online audio editor'],
    openGraph: {
        title: 'Audio Editor - Free Online Tool',
        description: 'Edit audio files with gorgeous waveforms. Trim, cut, and export. No cloud uploads required.',
        url: 'https://functions.codes/audio-editor',
    },
    twitter: {
        title: 'Audio Editor - Free Tool',
        description: 'Edit audio with waveform visualization. No uploads, 100% client-side.',
    },
    alternates: {
        canonical: 'https://functions.codes/audio-editor',
    },
};

export default function AudioEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Audio Editor',
        'Edit audio files with waveform visualization. Free online audio editor.',
        'audio-editor'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Audio Editor', 'audio-editor');

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
