import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Spin Wheel - Random Name Picker Wheel Free',
    description: 'Free spinning name wheel for classrooms, raffles, and decisions. Add names, spin the wheel, pick a fair winner. No ads, works offline in your browser.',
    keywords: ['spin wheel', 'wheel spinner', 'random name picker', 'name wheel', 'decision wheel', 'raffle wheel', 'wheel of names'],
    openGraph: {
        title: 'Spin Wheel - Random Name Picker',
        description: 'Add names, spin the wheel, pick a fair winner. Free tool with no ads.',
        url: 'https://functions.codes/spin-wheel',
    },
    twitter: {
        title: 'Spin Wheel - Free Random Picker',
        description: 'Spinning name wheel for classrooms, raffles, and decisions. No ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/spin-wheel',
    },
};

export default function SpinWheelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Spin Wheel',
        'Spinning name wheel for random picks. Add names, spin, and get a fair winner.',
        'spin-wheel'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Spin Wheel', 'spin-wheel');

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
