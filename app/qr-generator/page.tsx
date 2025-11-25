'use client';

import { useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Download, QrCode, Settings2, Link as LinkIcon, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function QRGenerator() {
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [options, setOptions] = useState({
    width: 1024,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H'
  });

  const generateQR = async () => {
    if (text.trim()) {
      setIsGenerating(true);
      try {
        const url = await QRCode.toDataURL(text, {
          width: options.width,
          margin: options.margin,
          color: options.color,
          errorCorrectionLevel: options.errorCorrectionLevel
        });
        setQrCodeUrl(url);
        toast.success('QR Code generated successfully');
      } catch (err) {
        console.error('Error generating QR code:', err);
        toast.error('Failed to generate QR code. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = qrCodeUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
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
            QR Generator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto"
          >
            Create custom QR codes instantly.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
                <button
                  onClick={() => setActiveTab('url')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'url' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <LinkIcon className="w-4 h-4" />
                  URL
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'text' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none resize-none h-32 text-gray-900 placeholder:text-gray-400"
                    placeholder={activeTab === 'url' ? "https://example.com" : "Enter your text here..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foreground Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={options.color.dark}
                        onChange={(e) => setOptions(prev => ({
                          ...prev,
                          color: { ...prev.color, dark: e.target.value }
                        }))}
                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-gray-50"
                      />
                      <span className="text-sm text-gray-500 uppercase">{options.color.dark}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={options.color.light}
                        onChange={(e) => setOptions(prev => ({
                          ...prev,
                          color: { ...prev.color, light: e.target.value }
                        }))}
                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-gray-50"
                      />
                      <span className="text-sm text-gray-500 uppercase">{options.color.light}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateQR}
                  disabled={isGenerating || !text.trim()}
                  className="w-full py-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  {isGenerating ? (
                    <>
                      <Settings2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      Generate QR Code
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
            className="lg:col-span-5"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center">
              {qrCodeUrl ? (
                <div className="space-y-8 w-full">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 inline-block">
                    <Image
                      src={qrCodeUrl}
                      alt="Generated QR Code"
                      width={300}
                      height={300}
                      className="w-full max-w-[240px] h-auto"
                      unoptimized
                    />
                  </div>

                  <button
                    onClick={downloadQR}
                    className="w-full py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                </div>
              ) : (
                <div className="text-gray-400">
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">No QR Code</p>
                  <p className="text-sm">Enter text to generate a preview</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
