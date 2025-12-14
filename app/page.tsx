'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, FileText, Image as ImageIcon, Scissors, QrCode, Lock, Palette, Braces, Type, ArrowRightLeft, Minimize2, ArrowRight, Shield, Zap, Ban, Mic, Edit } from 'lucide-react';

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
    description: 'Convert PDFs, images, and documents. No sketchy "premium" upsells!',
    href: '/file-converter',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <Scissors className="w-6 h-6" />,
    title: 'Background Remover',
    description: 'Remove backgrounds instantly. No watermarks. Yes, really.',
    href: '/bgrm',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <ImageIcon className="w-6 h-6" />,
    title: 'Image Compressor',
    description: 'Squish your images smaller. Like your stress levels here.',
    href: '/image-compressor',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Generator',
    description: 'Create QR codes without dodging 47 banner ads first.',
    href: '/qr-generator',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: <Braces className="w-6 h-6" />,
    title: 'JSON Formatter',
    description: 'Format JSON beautifully. Also validates. Also free. Wild, right?',
    href: '/json-formatter',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Password Generator',
    description: 'Generate secure passwords. Stored nowhere. Promise.',
    href: '/password-generator',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Color Palette',
    description: 'Extract color palettes from images. Makes designers happy.',
    href: '/color-palette',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: <Type className="w-6 h-6" />,
    title: "Lorem Ipsum",
    description: "Lorem ipsum dolor sit... you get the idea. It's free lorem.",
    href: "/lorem-ipsum",
    color: "bg-indigo-50 text-indigo-600"
  },
  {
    icon: <ArrowRightLeft className="w-6 h-6" />,
    title: "Diff Viewer",
    description: "Spot the difference between texts. Like Where's Waldo but useful.",
    href: "/diff-viewer",
    color: "bg-orange-50 text-orange-600"
  },
  {
    icon: <Minimize2 className="w-6 h-6" />,
    title: "Unit Converter",
    description: "Convert CSS units. No ads to slow down your dev flow.",
    href: "/unit-converter",
    color: "bg-teal-50 text-teal-600"
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'PDF Tools',
    description: 'Merge, split, and compress PDFs. Your files never leave your browser.',
    href: '/pdf-tools',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: 'Audio Editor',
    description: 'Edit audio with gorgeous waveforms. No cloud uploads required.',
    href: '/audio-editor',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: <Edit className="w-6 h-6" />,
    title: 'Markdown Editor',
    description: 'Write markdown, see it live, export as PDF. Simple, clean, fast.',
    href: '/markdown-editor',
    color: 'bg-lime-50 text-lime-600',
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:py-24 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 85, 0],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-32 -right-24 w-[420px] h-[380px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-[40%_60%_70%_30%] blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.18, 1, 1.18],
            rotate: [75, 0, 75],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-28 -left-36 w-[460px] h-[400px] bg-gradient-to-tr from-pink-100 to-yellow-100 rounded-[60%_40%_30%_70%] blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.05, 1.25, 1.05],
            rotate: [-45, 45, -45],
            x: [-10, 10, -10],
            y: [10, -10, 10],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[370px] bg-gradient-to-br from-cyan-100 to-purple-100 rounded-[45%_55%_60%_40%] blur-2xl opacity-60"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight text-gray-900 mb-6"
          >
            functions.codes
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <p className="text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Finally, tools without 47 popup ads! 🎉
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Born from frustration with ad-infested tools.<br className="hidden sm:block" />
              Built with love (and a broke developer&apos;s budget).
            </p>
          </motion.div>

          {/* Privacy badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            <motion.div
              initial={{ y: 0, rotate: -1.5 }}
              animate={{
                y: [-4, 6, -4],
                rotate: [-1.5, -2, -1.5]
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.05, rotate: -3 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-[1.5px] border-green-200 rounded-2xl shadow-[0_2px_8px_-2px_rgb(34,197,94,0.15)]"
            >
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">100% Client-Side</span>
            </motion.div>
            <motion.div
              initial={{ y: 0, rotate: 0.5 }}
              animate={{
                y: [-6, 4, -6],
                rotate: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-[1.5px] border-blue-200 rounded-2xl shadow-[0_2px_8px_-2px_rgb(59,130,246,0.15)]"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Zero Data Collection</span>
            </motion.div>
            <motion.div
              initial={{ y: 0, rotate: 1 }}
              animate={{
                y: [-5, 5, -5],
                rotate: [1, 1.5, 1]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border-[1.5px] border-purple-200 rounded-2xl shadow-[0_2px_8px_-2px_rgb(168,85,247,0.15)]"
            >
              <Ban className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">No Server (Can&apos;t Afford It 😅)</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-[1.5px] border-yellow-300/60 rounded-tl-3xl rounded-tr-2xl rounded-bl-2xl rounded-br-3xl p-5 mb-10 max-w-2xl mx-auto shadow-[0_4px_16px_-4px_rgb(251,191,36,0.12)]"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              <motion.span
                className="font-semibold inline-block"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >🔒</motion.span>
              <span className="font-semibold"> Your Privacy:</span> Everything runs in your browser.
              No servers, no databases, no tracking. Not because we&apos;re noble...
              but because servers cost money and this developer is <em>aggressively broke</em>.
              <motion.span
                className="ml-1 inline-block"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, delay: 1 }}
              >🎪</motion.span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative max-w-md mx-auto"
          >
            <motion.div
              className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Search className="h-5 w-5 text-gray-400" />
            </motion.div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white border-[1.5px] border-stone-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-[0_2px_12px_-4px_rgb(0,0,0,0.08)] transition-all hover:border-stone-300 hover:shadow-[0_4px_20px_-4px_rgb(0,0,0,0.12)]"
              placeholder="Search for ad-free tools..."
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
          {filteredTools.map((tool, index) => {
            // Unique hover effects for each card
            const hoverVariants = [
              { y: -6, rotate: -0.5, scale: 1.02 },
              { y: -8, rotate: 0.5, scale: 1.01 },
              { y: -5, rotate: 0, scale: 1.015 },
              { y: -7, rotate: 0.3, scale: 1.02 },
              { y: -6, rotate: -0.3, scale: 1.01 },
              { y: -9, rotate: 0.6, scale: 1.015 },
              { y: -5, rotate: -0.4, scale: 1.02 },
              { y: -7, rotate: 0.2, scale: 1.01 },
              { y: -6, rotate: -0.2, scale: 1.015 },
              { y: -8, rotate: 0.4, scale: 1.02 },
            ];

            const iconRotations = [5, -6, 4, -5, 6, -4, 5, -6, 4, -5];
            const iconSizes = [56, 60, 58, 62, 57, 59, 61, 58, 60, 56];

            const shadowColors = [
              'shadow-[0_8px_32px_-4px_rgb(59,130,246,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(168,85,247,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(236,72,153,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(16,185,129,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(245,158,11,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(239,68,68,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(6,182,212,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(99,102,241,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(251,146,60,0.12)]',
              'shadow-[0_8px_32px_-4px_rgb(20,184,166,0.12)]',
            ];

            return (
              <motion.div
                key={tool.href}
                variants={item}
                whileHover={hoverVariants[index % 10]}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href={tool.href}
                  className={`group block p-8 bg-white rounded-3xl border-[1.5px] border-stone-200 shadow-soft hover:${shadowColors[index % 10]} hover:border-stone-300 transition-all duration-300 h-full flex flex-col relative overflow-hidden`}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50/40 group-hover:via-purple-50/40 group-hover:to-pink-50/40 transition-all duration-500 rounded-3xl" />

                  <div className="relative z-10">
                    <motion.div
                      className={`rounded-2xl flex items-center justify-center mb-6 ${tool.color} transition-all duration-300`}
                      style={{ width: iconSizes[index % 10], height: iconSizes[index % 10] }}
                      whileHover={{ rotate: iconRotations[index % 10], scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      {tool.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6 flex-grow">
                      {tool.description}
                    </p>
                    <div className="flex items-center text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors mt-auto">
                      Try it now
                      <motion.div
                        className="inline-block ml-2"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">No tools found matching &quot;{searchQuery}&quot;</p>
            <p className="text-gray-400 text-sm mt-2">Unlike other sites, we won&apos;t suggest you &quot;upgrade to premium&quot; 🙄</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
