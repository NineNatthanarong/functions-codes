import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Color Picker — เลือกสีจากหน้าจอ',
    description: 'Pick colors from your screen with EyeDropper, or click an uploaded image to sample any pixel.',
    alternates: { canonical: 'https://functions.codes/color-picker' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
