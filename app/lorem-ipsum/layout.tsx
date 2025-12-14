import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Lorem Ipsum Generator - Free Placeholder Text Generator',
    description: 'Free lorem ipsum generator. Generate placeholder text for your designs and mockups. Customizable paragraphs, words, and sentences. No ads.',
    keywords: ['lorem ipsum', 'placeholder text', 'dummy text', 'text generator', 'lorem ipsum generator', 'filler text', 'design tool'],
    openGraph: {
        title: 'Lorem Ipsum Generator - Free Tool',
        description: 'Generate placeholder text for designs and mockups. Customizable paragraphs, words, and sentences.',
        url: 'https://functions.codes/lorem-ipsum',
    },
    twitter: {
        title: 'Lorem Ipsum Generator',
        description: 'Generate placeholder text instantly. No ads, free tool.',
    },
    alternates: {
        canonical: 'https://functions.codes/lorem-ipsum',
    },
};

export default function LoremIpsumLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Lorem Ipsum Generator',
        'Generate placeholder text for designs and mockups. Free lorem ipsum generator.',
        'lorem-ipsum'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Lorem Ipsum Generator', 'lorem-ipsum');

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
