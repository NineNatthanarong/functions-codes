'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FileImage, Image as ImageIcon, QrCode, Search } from 'lucide-react';

const tools = [
  {
    id: 'converter',
    title: 'File Converter',
    description: 'Convert PDF, HEIC, and images to PNG, JPEG, or WEBP instantly.',
    icon: FileImage,
    href: '/file-converter',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'bgrm',
    title: 'Background Remover',
    description: 'Remove image backgrounds automatically with AI precision.',
    icon: ImageIcon,
    href: '/bgrm',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'qr',
    title: 'QR Generator',
    description: 'Create custom QR codes for URLs, text, and more.',
    icon: QrCode,
    href: '/qr-generator',
    color: 'bg-emerald-50 text-emerald-600',
  },
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
            <motion.div key={tool.id} variants={item}>
              <Link
                href={tool.href}
                className="group block p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${tool.color} transition-transform group-hover:scale-110 duration-300`}>
                  <tool.icon className="w-7 h-7" strokeWidth={1.5} />
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
