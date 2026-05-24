import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Random Picker — สุ่มจากรายการ',
    description: 'Paste a list and pick one at random with an animated reveal. Fully offline.',
    alternates: { canonical: 'https://functions.codes/random-picker' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
