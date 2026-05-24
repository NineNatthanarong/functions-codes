import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Image Cropper & Resizer — ครอบและปรับขนาดรูป',
    description: 'Crop, resize, rotate, and flip images in your browser. No upload, no watermark.',
    alternates: { canonical: 'https://functions.codes/image-cropper' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
