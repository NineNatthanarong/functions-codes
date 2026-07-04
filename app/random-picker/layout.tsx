import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Random Picker - Pick a Random Name or Item Free',
    description: 'Free random picker. Paste a list of names or items and pick one at random with an animated reveal. No-repeat mode, fully offline, no ads.',
    keywords: ['random picker', 'random name picker', 'pick random winner', 'random list picker', 'raffle picker', 'random choice generator'],
    openGraph: {
        title: 'Random Picker - Free Random Name & Item Picker',
        description: 'Paste a list and pick one at random with an animated reveal. No-repeat mode, free tool with no ads.',
        url: 'https://functions.codes/random-picker',
    },
    twitter: {
        title: 'Random Picker - Free Tool',
        description: 'Pick a random name or item from any list. Animated reveal, no ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/random-picker',
    },
};

export default function RandomPickerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Random Picker',
        'Paste a list of names or items and pick one at random with an animated reveal. Free online random picker.',
        'random-picker'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Random Picker', 'random-picker');

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
