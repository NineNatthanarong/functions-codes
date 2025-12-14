'use client';

import { useState } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { Upload, Download, Settings2, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageCompressor() {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [compressedImage, setCompressedImage] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [options, setOptions] = useState({
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            setOriginalImage(file);
            setCompressedImage(null);
        }
    };

    const compressImage = async () => {
        if (!originalImage) return;

        setIsCompressing(true);
        try {
            const compressedFile = await imageCompression(originalImage, options);
            setCompressedImage(compressedFile);
            toast.success('Image compressed successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to compress image');
        } finally {
            setIsCompressing(false);
        }
    };

    const downloadImage = () => {
        if (!compressedImage) return;
        const url = URL.createObjectURL(compressedImage);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${originalImage?.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                        Image Compressor
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Compress PNG, JPEG, and WEBP images locally. Reduce file size without losing quality.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Configuration Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-4 space-y-6"
                    >
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Settings2 className="w-5 h-5" />
                                Settings
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Size (MB)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={options.maxSizeMB}
                                        onChange={(e) => setOptions(prev => ({ ...prev, maxSizeMB: parseFloat(e.target.value) || 1 }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Target file size in Megabytes</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Width/Height
                                    </label>
                                    <input
                                        type="number"
                                        step="100"
                                        value={options.maxWidthOrHeight}
                                        onChange={(e) => setOptions(prev => ({ ...prev, maxWidthOrHeight: parseInt(e.target.value) || 1920 }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Resize image to fit within these dimensions</p>
                                </div>

                                <button
                                    onClick={compressImage}
                                    disabled={isCompressing || !originalImage}
                                    className="w-full py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                >
                                    {isCompressing ? (
                                        <>
                                            <Settings2 className="w-5 h-5 animate-spin" />
                                            Compressing...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-5 h-5" />
                                            Compress Image
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Preview Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-8"
                    >
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
                            {!originalImage ? (
                                <div
                                    className="flex-grow border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Image</h3>
                                    <p className="text-gray-500">Click to browse or drag file here</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Original */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">Original</h3>
                                                <span className="text-sm text-gray-500">{formatSize(originalImage.size)}</span>
                                            </div>
                                            <div className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                                <Image
                                                    src={URL.createObjectURL(originalImage)}
                                                    alt="Original"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>

                                        {/* Compressed */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">Compressed</h3>
                                                {compressedImage && (
                                                    <span className="text-sm text-green-600 font-medium">
                                                        {formatSize(compressedImage.size)}
                                                        <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded-full">
                                                            -{Math.round((1 - compressedImage.size / originalImage.size) * 100)}%
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                                                {compressedImage ? (
                                                    <Image
                                                        src={URL.createObjectURL(compressedImage)}
                                                        alt="Compressed"
                                                        fill
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="text-gray-400 text-center">
                                                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                        <p className="text-sm">Waiting for compression...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                setOriginalImage(null);
                                                setCompressedImage(null);
                                            }}
                                            className="flex-1 py-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={downloadImage}
                                            disabled={!compressedImage}
                                            className="flex-1 py-4 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
