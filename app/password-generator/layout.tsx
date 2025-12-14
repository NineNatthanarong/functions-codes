import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Password Generator - Generate Secure Passwords Free',
    description: 'Free secure password generator. Create strong, random passwords with custom length and character options. No storage, 100% client-side generation.',
    keywords: ['password generator', 'secure password', 'random password', 'strong password', 'generate password', 'free password generator'],
    openGraph: {
        title: 'Password Generator - Secure & Free',
        description: 'Generate strong, secure passwords instantly. Customizable options, no storage, completely free.',
        url: 'https://functions.codes/password-generator',
    },
    twitter: {
        title: 'Password Generator - Free Tool',
        description: 'Create secure passwords with custom options. No storage, 100% client-side.',
    },
    alternates: {
        canonical: 'https://functions.codes/password-generator',
    },
};

export default function PasswordGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'Password Generator',
        'Generate strong, secure passwords with custom options. No storage, completely free.',
        'password-generator'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Password Generator', 'password-generator');

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
