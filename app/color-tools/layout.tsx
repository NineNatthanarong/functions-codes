import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Color Converter & Gradient — แปลงสีและไล่ระดับ',
    description: 'Convert HEX, RGB, HSL, OKLCH and build CSS linear, radial, and conic gradients. Copy as CSS.',
    alternates: { canonical: 'https://functions.codes/color-tools' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
