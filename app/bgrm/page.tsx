'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { removeBackground } from '@imgly/background-removal';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [useAdvanced, setUseAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      if (useAdvanced) {
        const imageBlob = await fetch(originalImage).then(res => res.blob());
        const resultBlob = await removeBackground(imageBlob);

        const reader = new FileReader();
        reader.onload = () => {
          setProcessedImage(reader.result as string);
          setIsProcessing(false);
        };
        reader.readAsDataURL(resultBlob);
      } else {
        if (!canvasRef.current) throw new Error('Canvas not available');

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');

        const img = new window.Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const brightness = (r + g + b) / 3;

            if (brightness > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          const processedDataUrl = canvas.toDataURL('image/png');
          setProcessedImage(processedDataUrl);
          setIsProcessing(false);
        };

        img.src = originalImage;
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = processedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Background Remover
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto"
          >
            Remove backgrounds instantly. Choose between basic or AI-powered removal.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <div
                className={cn(
                  "relative group cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300",
                  dragActive
                    ? "border-purple-500 bg-purple-50/50"
                    : "border-gray-200 hover:border-purple-400 hover:bg-gray-50/50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className={cn(
                    "p-5 rounded-2xl transition-colors duration-300",
                    dragActive ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-600"
                  )}>
                    <Upload className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">
                      Upload an image
                    </p>
                    <p className="text-gray-500">
                      Drag and drop or click to browse
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Original Image */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Original</h2>
                  <button
                    onClick={resetImages}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-6">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain p-4"
                    unoptimized
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", useAdvanced ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500")}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">AI Enhanced</p>
                      <p className="text-gray-500">Better precision</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAdvanced}
                      onChange={(e) => setUseAdvanced(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Remove Background
                    </>
                  )}
                </button>
              </div>

              {/* Processed Image */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Result</h2>

                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-6 group">
                  {/* Checkerboard pattern */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23000' fill-opacity='1'%3e%3crect width='10' height='10'/%3e%3crect x='10' y='10' width='10' height='10'/%3e%3c/g%3e%3c/svg%3e")`
                  }} />

                  {processedImage ? (
                    <Image
                      src={processedImage}
                      alt="Processed"
                      fill
                      className="object-contain p-4 relative z-10"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm">Processed image will appear here</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={downloadImage}
                  disabled={!processedImage}
                  className="w-full py-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PNG
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}