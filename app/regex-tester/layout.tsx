import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Regex Tester - Test Regular Expressions Online',
    description: 'Free online regex tester with live match highlighting, capture groups, flags, and replace preview. Test regular expressions as you type. No ads, 100% in your browser.',
    keywords: ['regex tester', 'regular expression tester', 'regex online', 'test regex', 'regex match', 'regex replace', 'capture groups', 'regex debugger', 'free regex tool'],
    openGraph: {
        title: 'Regex Tester - Free Online Tool',
        description: 'Test regular expressions live with match highlighting, capture groups, and replace preview. Free, no ads.',
        url: 'https://functions.codes/regex-tester',
    },
    twitter: {
        title: 'Regex Tester - Free Tool',
        description: 'Test regular expressions live in your browser. Match highlighting, capture groups, replace preview.',
    },
    alternates: {
        canonical: 'https://functions.codes/regex-tester',
    },
};

export default function RegexTesterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Regex Tester',
        'Test regular expressions online with live match highlighting, capture groups, flags, and replace preview. Free regex tester, runs entirely in your browser.',
        'regex-tester'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Regex Tester', 'regex-tester');

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
