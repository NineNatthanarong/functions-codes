import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'URL Encoder/Decoder & Inspector - Free Online URL Tools',
    description: 'Free URL encoder, decoder, and inspector. Encode or decode URLs (Thai text supported), parse any link into protocol, host, path, and editable query parameters, then rebuild it instantly. No ads, 100% client-side.',
    keywords: ['URL encoder', 'URL decoder', 'URL parser', 'URL inspector', 'encodeURIComponent', 'percent encoding', 'query string editor', 'UTM link builder', 'decode URL online', 'free URL tool'],
    openGraph: {
        title: 'URL Tools - Free Online Encoder, Decoder & Inspector',
        description: 'Encode/decode URLs and dissect any link into an editable breakdown. Edit query params and rebuild the URL live.',
        url: 'https://functions.codes/url-tools',
    },
    twitter: {
        title: 'URL Tools - Free Encoder, Decoder & Inspector',
        description: 'Encode, decode, and inspect URLs online. Edit query params and rebuild links live. No ads.',
    },
    alternates: {
        canonical: 'https://functions.codes/url-tools',
    },
};

export default function UrlToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const toolSchema = generateToolSchema(
        'URL Tools',
        'Encode, decode, and inspect URLs online. Parse links into protocol, host, path, and editable query parameters, then rebuild the URL instantly.',
        'url-tools'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('URL Tools', 'url-tools');

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
