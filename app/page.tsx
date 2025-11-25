'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, FileText, Image as ImageIcon, Scissors, QrCode, Lock, Palette, Braces, Type, ArrowRightLeft, Minimize2, ArrowRight, FileImage, ShieldCheck } from 'lucide-react';

import { ReactNode } from 'react';

interface Tool {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}

const tools: Tool[] = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'File Converter',
    description: 'Convert PDFs, images, and documents with ease.',
    href: '/file-converter',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <Scissors className="w-6 h-6" />,
    title: 'Background Remover',
    description: 'Remove image backgrounds instantly with AI.',
    href: '/bgrm',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <ImageIcon className="w-6 h-6" />,
    title: 'Image Compressor',
    description: 'Compress images without losing quality.',
    href: '/image-compressor',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Generator',
    description: 'Create custom QR codes for any link or text.',
    href: '/qr-generator',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: <Braces className="w-6 h-6" />,
    title: 'JSON Formatter',
    description: 'Format, validate, and minify JSON data.',
    href: '/json-formatter',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Password Generator',
    description: 'Generate secure, random passwords.',
    href: '/password-generator',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Color Palette',
    description: 'Extract color palettes from images.',
    href: '/color-palette',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: <Type className="w-6 h-6" />,
    title: "Lorem Ipsum",
    description: "Generate placeholder text for your designs.",
    href: "/lorem-ipsum",
    color: "bg-indigo-50 text-indigo-600"
  },
  {
    icon: <ArrowRightLeft className="w-6 h-6" />,
    title: "Diff Viewer",
    description: "Compare text and highlight differences.",
    href: "/diff-viewer",
    color: "bg-orange-50 text-orange-600"
  },
  {
    icon: <Minimize2 className="w-6 h-6" />,
    title: "Unit Converter",
    description: "Convert CSS units (px, rem, em, %).",
    href: "/unit-converter",
    color: "bg-teal-50 text-teal-600"
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(tool =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight text-gray-900 mb-8"
          >
            functions.codes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-500 leading-relaxed mb-10"
          >
            Essential tools for digital creators. <br className="hidden sm:block" />
            Simple, fast, and running entirely in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-md mx-auto"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {filteredTools.map((tool) => (
            <motion.div key={tool.href} variants={item}>
              <Link
                key={tool.href}
                href={tool.href} className="group block p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${tool.color} transition-transform group-hover:scale-110 duration-300`}>
                  {tool.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-6 flex-grow">
                  {tool.description}
                </p>
                <div className="flex items-center text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors mt-auto">
                  Try it now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">No tools found matching &quot;{searchQuery}&quot;</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
