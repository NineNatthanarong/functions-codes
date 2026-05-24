import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EXIF Stripper — ลบข้อมูลแฝงในรูป',
    description: 'Strip GPS, dates, and camera info from photos before sharing. Inspect and clean image metadata in your browser.',
    alternates: { canonical: 'https://functions.codes/exif-stripper' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
