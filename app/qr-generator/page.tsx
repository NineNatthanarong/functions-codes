'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function QRGenerator() {
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState({
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      } catch (err) {
        console.error('Error generating QR code:', err);
        alert('Failed to generate QR code. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    } else {
      alert('Please enter some text to generate a QR code.');
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">QR Code Generator</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed px-4">
            Create professional QR codes instantly. Customize colors, size, and error correction level for your needs.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 h-fit">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Configuration</h2>
              
              <div className="mb-4 sm:mb-6">
                <label htmlFor="text-input" className="block text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                  Enter text or URL
                </label>
                <textarea
                  id="text-input"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-800 placeholder-gray-500 text-sm sm:text-base"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text, URL, or any data to generate QR code..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min="128"
                    max="512"
                    value={options.width}
                    onChange={(e) => setOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 256 }))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 text-sm sm:text-base"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                    Margin
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={options.margin}
                    onChange={(e) => setOptions(prev => ({ ...prev, margin: parseInt(e.target.value) || 2 }))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 text-sm sm:text-base"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                    Foreground Color
                  </label>
                  <input
                    type="color"
                    value={options.color.dark}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      color: { ...prev.color, dark: e.target.value }
                    }))}
                    className="w-full h-10 sm:h-12 border-2 border-gray-200 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={options.color.light}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      color: { ...prev.color, light: e.target.value }
                    }))}
                    className="w-full h-10 sm:h-12 border-2 border-gray-200 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
                  Error Correction Level
                </label>
                <select
                  value={options.errorCorrectionLevel}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H'
                  }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800 text-sm sm:text-base"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>

              <button
                onClick={generateQR}
                disabled={isGenerating || !text.trim()}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate QR Code'
                )}
              </button>
            </div>

            {/* Output Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Preview & Download</h2>
              
              {qrCodeUrl ? (
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="inline-block p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl shadow-inner border border-gray-200">
                    <Image 
                      src={qrCodeUrl} 
                      alt="Generated QR Code" 
                      width={300}
                      height={300}
                      className="mx-auto rounded-lg shadow-md w-full max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] h-auto"
                    />
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <button
                      onClick={downloadQR}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                      Download QR Code
                    </button>
                    
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Right-click and save, or use the download button above
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 lg:py-16">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No QR Code Yet</h3>
                  <p className="text-gray-600 text-xs sm:text-sm px-4">
                    Enter some text and click &quot;Generate QR Code&quot; to see your QR code here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
