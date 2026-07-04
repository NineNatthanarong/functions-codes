import type { Metadata } from 'next';
import { generateToolSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
    title: 'Thai Keyboard Fixer — แก้ภาษาแป้นพิมพ์ผิด',
    description: 'Convert text typed on the wrong keyboard layout. Thai ↔ English Kedmanee mapping. Fully offline.',
    keywords: ['Thai keyboard fixer', 'wrong keyboard layout converter', 'Thai English keyboard', 'Kedmanee layout', 'fix mistyped Thai text', 'แก้ภาษาแป้นพิมพ์ผิด'],
    openGraph: {
        title: 'Thai Keyboard Fixer — Convert Wrong-Layout Text',
        description: 'Convert text typed on the wrong keyboard layout between Thai and English. Free, fully offline, no ads.',
        url: 'https://functions.codes/thai-keyboard',
    },
    twitter: {
        title: 'Thai Keyboard Fixer — Free Tool',
        description: 'Fix text typed on the wrong Thai/English keyboard layout instantly. No ads, fully offline.',
    },
    alternates: { canonical: 'https://functions.codes/thai-keyboard' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    const toolSchema = generateToolSchema(
        'Thai Keyboard Fixer',
        'Convert text typed on the wrong keyboard layout between Thai and English Kedmanee mapping. Free online tool.',
        'thai-keyboard'
    );
    const breadcrumbSchema = generateBreadcrumbSchema('Thai Keyboard Fixer', 'thai-keyboard');

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
