import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Spin Wheel — วงล้อสุ่มชื่อ',
    description: 'Spinning name wheel for classrooms and decisions. Add names, spin, pick a winner.',
    alternates: { canonical: 'https://functions.codes/spin-wheel' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
