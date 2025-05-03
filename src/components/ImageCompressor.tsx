import React, { useState } from 'react';
import Compressor from 'compressorjs';
import { Upload, Download, FileText, Settings } from 'lucide-react';
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

  const compressImage = async (file: File, qualityValue: number) => {
    setCompressing(true);
    setAttempts(0);
    
    const attemptCompress = (currentQuality: number) => {
      return new Promise<Blob>((resolve, reject) => {
        new Compressor(file, {
          quality: (100 - currentQuality) / 100,
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

  const handleDownload = () => {
    if (compressedImage) {
      setIsDownloading(true);
      setDownloadProgress(0);
      
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
            link.download = 'compressed-image.jpg';
            link.click();
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 100);
        }
      }, 100);
    }
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Image Compressor</h1>

      <UploadProgress 
        progress={uploadProgress}
        fileName={currentFileName}
        show={isUploading}
      />
      
      <DownloadProgress
        progress={downloadProgress}
        fileName="compressed-image.jpg"
        show={isDownloading}
      />

      {!originalImage && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer inline-flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <span className="text-gray-600">Click to upload an image</span>
          </label>
        </div>
      )}

      {originalImage && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Compression Settings</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compression Level: {quality}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={quality}
                    onChange={handleQualityChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Maximum Quality</span>
                    <span>Maximum Compression</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Size (KB)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      pattern="\d*"
                      value={targetSize}
                      onChange={handleTargetSizeChange}
                      className="input"
                      placeholder="Enter target size in KB"
                    />
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Original Image</h3>
                <div className="relative">
                  <img
                    src={URL.createObjectURL(originalImage)}
                    alt="Original"
                    className="w-full rounded-lg"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {formatSize(originalImage.size)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Compressed Image</h3>
                {compressing ? (
                  <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-gray-600">Compressing... Attempt {attempts + 1}/{maxAttempts}</p>
                    </div>
                  </div>
                ) : (
                  compressedImage && (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(compressedImage)}
                        alt="Compressed"
                        className="w-full rounded-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {formatSize(compressedImage.size)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {compressedImage && !compressing && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Original Size</p>
                    <p className="text-lg font-semibold">{formatSize(originalImage.size)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Compressed Size</p>
                    <p className="text-lg font-semibold">{formatSize(compressedImage.size)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Size Reduction</p>
                    <p className="text-lg font-semibold text-green-600">
                      {calculateSizeReduction()}%
                    </p>
                  </div>
                </div>

                {getCompressionStatus() && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    getCompressionStatus() === 'success'
                      ? 'bg-green-50 text-green-700'
                      : getCompressionStatus() === 'above-target'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {getCompressionStatus() === 'success' && (
                      <p>✓ Target size achieved successfully!</p>
                    )}
                    {getCompressionStatus() === 'above-target' && (
                      <p>⚠️ File size is still above target. Try increasing compression level.</p>
                    )}
                    {getCompressionStatus() === 'below-target' && (
                      <p>ℹ️ File size is below target. You can reduce compression if desired.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={compressing}
              className="w-full btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Compressed Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
