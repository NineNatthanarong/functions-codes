import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Thai Keyboard Fixer — แก้ภาษาแป้นพิมพ์ผิด',
    description: 'Convert text typed on the wrong keyboard layout. Thai ↔ English Kedmanee mapping. Fully offline.',
    alternates: { canonical: 'https://functions.codes/thai-keyboard' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
