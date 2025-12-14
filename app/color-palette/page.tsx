'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import ColorThief from 'colorthief';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Palette, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ColorPalette() {
    const [image, setImage] = useState<string | null>(null);
    const [palette, setPalette] = useState<string[]>([]);
    const [dominantColor, setDominantColor] = useState<string>('');
    const imgRef = useRef<HTMLImageElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const extractColors = () => {
        if (!imgRef.current) return;
        const colorThief = new ColorThief();

        try {
            const dominant = colorThief.getColor(imgRef.current);
            const paletteColors = colorThief.getPalette(imgRef.current, 5);

            setDominantColor(`rgb(${dominant.join(',')})`);
            setPalette(paletteColors.map((color: number[]) => `rgb(${color.join(',')})`));
        } catch (error) {
            console.error('Error extracting colors:', error);
            toast.error('Failed to extract colors');
        }
    };

    const copyToClipboard = (color: string) => {
        // Convert RGB to Hex
        const rgb = color.match(/\d+/g);
        if (rgb) {
            const hex = '#' + rgb.map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');

            navigator.clipboard.writeText(hex.toUpperCase());
            toast.success(`Copied ${hex.toUpperCase()}`);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        Color Palette Generator
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Extract beautiful color palettes from your images instantly.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            <div
                                className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-6 group cursor-pointer"
                                onClick={() => document.getElementById('image-upload')?.click()}
                            >
                                {image ? (
                                    <Image
                                        ref={imgRef}
                                        src={image}
                                        alt="Source"
                                        fill
                                        className="object-contain"
                                        onLoad={extractColors}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                                        <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="font-medium">Click to upload image</p>
                                    </div>
                                )}

                                {image && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" />
                                            Change Image
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />

                            <div className="flex items-center justify-center">
                                <p className="text-sm text-gray-500">
                                    Supported formats: JPEG, PNG, WEBP
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Palette Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        {palette.length > 0 ? (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 h-full">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Palette className="w-5 h-5" />
                                    Generated Palette
                                </h2>

                                <div className="space-y-4">
                                    {/* Dominant Color */}
                                    <div
                                        className="h-32 rounded-2xl flex items-end p-4 shadow-inner cursor-pointer transition-transform hover:scale-[1.02]"
                                        style={{ backgroundColor: dominantColor }}
                                        onClick={() => copyToClipboard(dominantColor)}
                                    >
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-mono font-medium shadow-sm flex items-center gap-2">
                                            Dominant
                                            <Copy className="w-3 h-3" />
                                        </div>
                                    </div>

                                    {/* Palette Grid */}
                                    <div className="grid grid-cols-5 gap-2 h-24">
                                        {palette.map((color, index) => (
                                            <div
                                                key={index}
                                                className="h-full rounded-xl cursor-pointer transition-transform hover:scale-110 hover:z-10 shadow-sm hover:shadow-md relative group"
                                                style={{ backgroundColor: color }}
                                                onClick={() => copyToClipboard(color)}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Copy className="w-4 h-4 text-white drop-shadow-md" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
                                        Click any color to copy its HEX code
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <Palette className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Palette Yet</h3>
                                <p>Upload an image to extract its colors</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
