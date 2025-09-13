'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { removeBackground } from '@imgly/background-removal';

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
        // Advanced AI-powered background removal
        const imageBlob = await fetch(originalImage).then(res => res.blob());
        const resultBlob = await removeBackground(imageBlob);
        const processedDataUrl = URL.createObjectURL(resultBlob);
        
        // Convert blob URL to data URL for consistent handling
        const reader = new FileReader();
        reader.onload = () => {
          setProcessedImage(reader.result as string);
          setIsProcessing(false);
        };
        reader.readAsDataURL(resultBlob);
      } else {
        // Basic background removal using canvas
        if (!canvasRef.current) throw new Error('Canvas not available');
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');

        const img = new window.Image();
        img.onload = () => {
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Simple background removal algorithm (removes white/light backgrounds)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate brightness
            const brightness = (r + g + b) / 3;
            
            // Remove light backgrounds (you can adjust this threshold)
            if (brightness > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }

          // Put processed image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to data URL
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Background Remover</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed px-4">
            Remove backgrounds from your images instantly. Works best with images that have solid or light backgrounds.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {!originalImage ? (
            // Upload Section
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div
                className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {dragActive ? 'Drop your image here' : 'Upload an image'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                  Drag and drop an image here, or click to browse
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  Choose Image
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                
                <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                  Supports: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          ) : (
            // Processing Section
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Original Image */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Original Image</h2>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <Image 
                    src={originalImage} 
                    alt="Original" 
                    width={500}
                    height={384}
                    className="w-full h-auto rounded-lg shadow-sm max-h-64 sm:max-h-80 lg:max-h-96 object-contain mx-auto"
                    unoptimized
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="advanced-toggle"
                      checked={useAdvanced}
                      onChange={(e) => setUseAdvanced(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor="advanced-toggle" className="text-xs sm:text-sm font-semibold text-gray-800">
                      Use Advanced AI Background Removal
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 ml-7">
                    {useAdvanced 
                      ? "AI-powered removal works with any background and subject type" 
                      : "Basic removal works best with solid, light backgrounds"
                    }
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {useAdvanced ? 'AI Processing...' : 'Processing...'}
                      </span>
                    ) : (
                      `${useAdvanced ? 'AI Remove' : 'Remove'} Background`
                    )}
                  </button>
                  
                  <button
                    onClick={resetImages}
                    className="px-4 sm:px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Processed Image */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Processed Image</h2>
                
                {processedImage ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 relative">
                      {/* Checkered background to show transparency */}
                      <div className="absolute inset-3 sm:inset-4 rounded-lg opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23000' fill-opacity='0.1'%3e%3crect width='10' height='10'/%3e%3crect x='10' y='10' width='10' height='10'/%3e%3c/g%3e%3c/svg%3e")`
                      }}></div>
                      
                      <Image 
                        src={processedImage} 
                        alt="Background Removed" 
                        width={500}
                        height={384}
                        className="w-full h-auto rounded-lg shadow-sm max-h-64 sm:max-h-80 lg:max-h-96 object-contain mx-auto relative z-10"
                        unoptimized
                      />
                    </div>
                    
                    <button
                      onClick={downloadImage}
                      className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                      Download PNG
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 lg:py-16">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Processed Image</h3>
                    <p className="text-gray-600 text-xs sm:text-sm px-4">
                      Click &quot;Remove Background&quot; to process your image using {useAdvanced ? 'AI-powered' : 'basic'} removal
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}