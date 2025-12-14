'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const links = [
    { href: '/file-converter', label: 'File Converter' },
    { href: '/bgrm', label: 'Background Remover' },
    { href: '/qr-generator', label: 'QR Generator' },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-lg border-b border-stone-200/60 shadow-[0_1px_3px_rgb(0,0,0,0.04)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <motion.div
                        whileHover={{ rotate: -1.5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors duration-300">
                            functions.codes
                        </Link>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium transition-all duration-300 hover:text-gray-900 hover:scale-105 relative",
                                    pathname === link.href ? "text-gray-900" : "text-gray-500"
                                )}
                            >
                                {link.label}
                                {pathname === link.href && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute -bottom-[21px] left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full"
                                        transition={{ type: "spring", stiffness: 350, damping: 25, bounce: 0.5 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
