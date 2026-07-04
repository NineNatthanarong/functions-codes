import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'JWT Decoder - Decode JSON Web Tokens Online',
    description: 'Free online JWT decoder. Paste a JSON Web Token to inspect its header, payload, and signature instantly. Human-readable expiry check, claim labels, 100% in your browser. No ads.',
    keywords: ['JWT decoder', 'decode JWT', 'JSON Web Token', 'JWT debugger', 'JWT parser', 'JWT viewer', 'decode token online', 'JWT expiry check', 'JWT claims', 'free JWT tool'],
    openGraph: {
        title: 'JWT Decoder - Free Online Tool',
        description: 'Decode JSON Web Tokens instantly. Header, payload, signature, and expiry check — all in your browser, nothing uploaded.',
        url: 'https://functions.codes/jwt-decoder',
    },
    twitter: {
        title: 'JWT Decoder - Free Tool',
        description: 'Decode JWTs in your browser. Header, payload, expiry check. No ads, nothing uploaded.',
    },
    alternates: {
        canonical: 'https://functions.codes/jwt-decoder',
    },
};

export default function JwtDecoderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'JWT Decoder',
        'Decode JSON Web Tokens online. Inspect header, payload, and signature with a human-readable expiry check. 100% client-side.',
        'jwt-decoder'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('JWT Decoder', 'jwt-decoder');

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
