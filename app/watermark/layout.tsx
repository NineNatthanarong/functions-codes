import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Watermark Stamper — ติดลายน้ำบนรูป',
    description: 'Add a text watermark to your images. Adjust size, position, opacity, and rotation. Fully offline.',
    alternates: { canonical: 'https://functions.codes/watermark' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
