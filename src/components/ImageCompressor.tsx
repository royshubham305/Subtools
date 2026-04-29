import React, { useState } from 'react';
import Compressor from 'compressorjs';
import { Upload, Download, FileText, Settings, Image as ImageIcon, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import UploadProgress from './UploadProgress';
import DownloadProgress from './DownloadProgress';

export default function ImageCompressor() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<Blob | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState<string>('500');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg');
  const [maxWidth, setMaxWidth] = useState<string>('');
  const [maxHeight, setMaxHeight] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setCurrentFileName(file.name);
      
      // 4-second upload animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2.5; // 100% / 40 steps = 2.5% per step
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setOriginalImage(file);
            compressImage(file, quality);
            setIsUploading(false);
            setUploadProgress(0);
          }, 100);
        }
      }, 100); // 4000ms / 40 steps = 100ms per step
    }
  };

  const compressImage = async (
    file: File, 
    qualityValue: number,
    formatValue: string = outputFormat,
    maxWidthValue: string = maxWidth,
    maxHeightValue: string = maxHeight
  ) => {
    setCompressing(true);
    setAttempts(0);
    
    const attemptCompress = (currentQuality: number) => {
      return new Promise<Blob>((resolve, reject) => {
        new Compressor(file, {
          quality: (100 - currentQuality) / 100,
          mimeType: formatValue,
          maxWidth: maxWidthValue ? parseInt(maxWidthValue) : undefined,
          maxHeight: maxHeightValue ? parseInt(maxHeightValue) : undefined,
          success(result) {
            resolve(result);
          },
          error(err) {
            reject(err);
          },
        });
      });
    };

    try {
      let currentQuality = qualityValue;
      let result = await attemptCompress(currentQuality);
      let currentAttempt = 0;

      // Binary search to reach target size
      const targetSizeKB = parseInt(targetSize) || 500;
      while (
        currentAttempt < maxAttempts && 
        result.size > targetSizeKB * 1024 && 
        currentQuality < 100
      ) {
        currentAttempt++;
        setAttempts(currentAttempt);
        
        currentQuality = Math.min(currentQuality + 10, 100);
        result = await attemptCompress(currentQuality);
      }

      setCompressedImage(result);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setCompressing(false);
    }
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuality = parseInt(e.target.value);
    setQuality(newQuality);
    if (originalImage) {
      compressImage(originalImage, newQuality);
    }
  };

  const handleTargetSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (value === '' || /^\d+$/.test(value)) {
      setTargetSize(value);
      if (value && originalImage) {
        compressImage(originalImage, quality);
      }
    }
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value;
    setOutputFormat(newFormat);
    if (originalImage) {
      compressImage(originalImage, quality, newFormat);
    }
  };

  const handleMaxWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setMaxWidth(value);
      if (originalImage) {
        compressImage(originalImage, quality, outputFormat, value);
      }
    }
  };

  const handleMaxHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setMaxHeight(value);
      if (originalImage) {
        compressImage(originalImage, quality, outputFormat, maxWidth, value);
      }
    }
  };

  const handleDownload = () => {
    if (compressedImage) {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      let extension = 'jpg';
      if (outputFormat === 'image/webp') extension = 'webp';

      const fileName = currentFileName.substring(0, currentFileName.lastIndexOf('.')) || currentFileName;
      const downloadName = `${fileName}-compressed.${extension}`;

      // 4-second download animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2.5;
        setDownloadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedImage);
            link.download = downloadName;
            link.click();
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 100);
        }
      }, 100);
    }
  };

  const getDownloadFileName = () => {
    if (!currentFileName) return 'compressed-image.jpg';
    let extension = 'jpg';
    if (outputFormat === 'image/webp') extension = 'webp';
    const fileName = currentFileName.substring(0, currentFileName.lastIndexOf('.')) || currentFileName;
    return `${fileName}-compressed.${extension}`;
  };

  const formatSize = (size: number) => {
    return (size / 1024).toFixed(2) + ' KB';
  };

  const calculateSizeReduction = () => {
    if (originalImage && compressedImage) {
      const reduction = ((originalImage.size - compressedImage.size) / originalImage.size) * 100;
      return reduction.toFixed(1);
    }
    return '0';
  };

  const getCompressionStatus = () => {
    if (!compressedImage || !targetSize) return null;
    
    const currentSize = compressedImage.size / 1024; // Convert to KB
    const targetSizeNum = parseInt(targetSize);
    const difference = Math.abs(currentSize - targetSizeNum);
    const threshold = targetSizeNum * 0.1; // 10% threshold
    
    if (difference <= threshold) {
      return 'success';
    } else if (currentSize > targetSizeNum) {
      return 'above-target';
    } else {
      return 'below-target';
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    setCurrentFileName('');
    setQuality(80);
    setTargetSize('500');
    setMaxWidth('');
    setMaxHeight('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Image Compressor - Reduce File Size to Target KB
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Smart online image compressor that lets you specify your <strong>target file size in KB</strong>. Compress JPG and PNG images by up to 80% without visible quality loss. Perfect for optimizing website images and meeting upload limits on portals.
        </p>
      </div>

      <UploadProgress 
        progress={uploadProgress}
        fileName={currentFileName}
        show={isUploading}
      />
      
      <DownloadProgress
        progress={downloadProgress}
        fileName={getDownloadFileName()}
        show={isDownloading}
      />

      {!originalImage ? (
        <div className="max-w-3xl mx-auto">
          <div className="border-3 border-dashed border-indigo-200 rounded-2xl p-8 md:p-16 text-center bg-white/50 hover:bg-white hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer inline-flex flex-col items-center w-full h-full"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload your image</h3>
              <p className="text-gray-500 mb-6">JPG, PNG, WebP supported</p>
              <span className="btn bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
                Select Image
              </span>
            </label>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Custom Control</h3>
              <p className="text-sm text-gray-500">Adjust quality levels and target file sizes precisely</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
              <p className="text-sm text-gray-500">Smart compression algorithms preserve visual quality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multiple Formats</h3>
              <p className="text-sm text-gray-500">Support for JPEG, PNG and WebP conversion</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeInUp">
          {/* Settings Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-indigo-500" />
                Compression Settings
              </h2>
              <button 
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-red-500 flex items-center transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Start Over
              </button>
            </div>
            
            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Quality Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Compression Level</label>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={quality}
                  onChange={handleQualityChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Higher Quality</span>
                  <span>Max Compression</span>
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Output Format</label>
                <div className="relative">
                  <select
                     value={outputFormat}
                     onChange={handleFormatChange}
                     className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none transition-all"
                   >
                     <option value="image/jpeg">JPEG (Best Compression)</option>
                     <option value="image/webp">WebP (Modern Format)</option>
                     <option value="image/png">PNG (Lossless)</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                     <ImageIcon className="w-4 h-4" />
                   </div>
                </div>
              </div>

              {/* Target Size */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Target Size (KB)</label>
                <div className="relative">
                  <input
                    type="text"
                    pattern="\d*"
                    value={targetSize}
                    onChange={handleTargetSizeChange}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 font-medium text-xs">
                    KB
                  </div>
                </div>
              </div>
              
              {/* Dimensions (Advanced) */}
              <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-100">
                 <details className="group">
                   <summary className="flex items-center text-sm font-medium text-gray-500 cursor-pointer hover:text-indigo-600 transition-colors list-none">
                     <Settings className="w-4 h-4 mr-2" />
                     Advanced: Resize Image (Optional)
                     <span className="ml-auto transform group-open:rotate-180 transition-transform">▼</span>
                   </summary>
                   <div className="grid grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Max Width (px)</label>
                        <input
                          type="text"
                          pattern="\d*"
                          value={maxWidth}
                          onChange={handleMaxWidthChange}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                          placeholder="Original width"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Max Height (px)</label>
                        <input
                          type="text"
                          pattern="\d*"
                          value={maxHeight}
                          onChange={handleMaxHeightChange}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                          placeholder="Original height"
                        />
                      </div>
                   </div>
                 </details>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Original */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Original
                </span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                  {formatSize(originalImage.size)}
                </span>
              </div>
              <div className="flex-1 bg-checkerboard rounded-lg overflow-hidden border border-gray-200 relative group min-h-[300px] flex items-center justify-center">
                <img
                  src={URL.createObjectURL(originalImage)}
                  alt="Original"
                  className="max-w-full max-h-[400px] object-contain"
                />
              </div>
            </div>

            {/* Compressed */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex flex-col relative overflow-hidden">
               {/* Background highlight for success */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="font-semibold text-indigo-700 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                  Compressed
                </span>
                {compressedImage && (
                  <span className="text-sm font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold border border-indigo-100">
                    {formatSize(compressedImage.size)}
                  </span>
                )}
              </div>
              
              <div className="flex-1 bg-checkerboard rounded-lg overflow-hidden border border-indigo-200 relative min-h-[300px] flex items-center justify-center">
                {compressing ? (
                  <div className="text-center p-8">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-indigo-600 font-medium animate-pulse">Compressing...</p>
                    <p className="text-xs text-indigo-400 mt-1">Attempt {attempts + 1}/{maxAttempts}</p>
                  </div>
                ) : compressedImage ? (
                  <img
                    src={URL.createObjectURL(compressedImage)}
                    alt="Compressed"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : null}
              </div>
              
              {/* Stats & Status */}
              {compressedImage && !compressing && (
                <div className="mt-4 space-y-3 relative z-10">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">Size Reduction</span>
                    <span className="text-lg font-bold text-green-600 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-1 transform rotate-90 text-gray-400" />
                      -{calculateSizeReduction()}%
                    </span>
                  </div>

                  {getCompressionStatus() && (
                    <div className={`p-3 rounded-lg text-sm flex items-start ${
                      getCompressionStatus() === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : getCompressionStatus() === 'above-target'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {getCompressionStatus() === 'success' && <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />}
                      {getCompressionStatus() === 'above-target' && <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />}
                      {getCompressionStatus() === 'below-target' && <FileText className="w-5 h-5 mr-2 flex-shrink-0" />}
                      
                      <div>
                        {getCompressionStatus() === 'success' && <p className="font-medium">Perfect! Target size achieved.</p>}
                        {getCompressionStatus() === 'above-target' && <p>Still above target. Try increasing compression level.</p>}
                        {getCompressionStatus() === 'below-target' && <p>Well below target. You can reduce compression for better quality.</p>}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleDownload}
                    className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5 py-3 rounded-xl font-semibold flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Compressed Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}