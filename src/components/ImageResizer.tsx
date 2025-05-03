import React, { useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Upload, Download, Maximize, Lock, Unlock } from 'lucide-react';
import UploadProgress from './UploadProgress';
import DownloadProgress from './DownloadProgress';

const ASPECT_RATIOS = [
  { name: 'Square (1:1)', value: 1 },
  { name: 'Passport (35:45)', value: 35/45 },
  { name: 'Landscape (4:3)', value: 4/3 },
  { name: 'Portrait (3:4)', value: 3/4 },
  { name: 'Wide (16:9)', value: 16/9 },
  { name: 'Custom', value: 'custom' }
];

export default function ImageResizer() {
  const [image, setImage] = useState<string>('');
  const [selectedRatio, setSelectedRatio] = useState<string | number>(1);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(800);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const cropperRef = useRef<Cropper>();
  const imageRef = useRef<HTMLImageElement>(null);
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
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const reader = new FileReader();
            reader.onload = () => {
              setImage(reader.result as string);
              setTimeout(() => {
                if (imageRef.current) {
                  cropperRef.current = new Cropper(imageRef.current, {
                    aspectRatio: 1,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 1,
                    responsive: true,
                    cropBoxResizable: true,
                    cropBoxMovable: true,
                    guides: true,
                    highlight: false,
                    background: true,
                    modal: true,
                  });
                }
                setIsUploading(false);
                setUploadProgress(0);
              }, 500);
            };
            reader.readAsDataURL(file);
          }, 500);
        }
      }, 50);
    }
  };

  const handleAspectRatioChange = (ratio: number | string) => {
    setSelectedRatio(ratio);
    if (cropperRef.current) {
      if (ratio === 'custom') {
        cropperRef.current.setAspectRatio(NaN);
      } else {
        cropperRef.current.setAspectRatio(ratio as number);
      }
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value);
    setWidth(newWidth);
    if (maintainAspectRatio && selectedRatio !== 'custom' && selectedRatio !== 0) {
      setHeight(Math.round(newWidth / (selectedRatio as number)));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value);
    setHeight(newHeight);
    if (maintainAspectRatio && selectedRatio !== 'custom' && selectedRatio !== 0) {
      setWidth(Math.round(newHeight * (selectedRatio as number)));
    }
  };

  const toggleAspectRatio = () => {
    setMaintainAspectRatio(!maintainAspectRatio);
    if (cropperRef.current) {
      if (maintainAspectRatio) {
        cropperRef.current.setAspectRatio(NaN);
      } else {
        cropperRef.current.setAspectRatio(width / height);
      }
    }
  };

  const handleDownload = () => {
    if (cropperRef.current) {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // Simulate download progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setDownloadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const canvas = cropperRef.current!.getCroppedCanvas({
              width: width,
              height: height,
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high',
            });
            
            const link = document.createElement('a');
            link.download = 'resized-image.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 500);
        }
      }, 50);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Image Resizer</h1>
      
      <UploadProgress 
        progress={uploadProgress}
        fileName={currentFileName}
        show={isUploading}
      />
      
      <DownloadProgress
        progress={downloadProgress}
        fileName="resized-image.png"
        show={isDownloading}
      />

      {!image && (
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

      {image && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Aspect Ratio</h2>
              <div className="flex flex-wrap gap-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.name}
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      selectedRatio === ratio.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {ratio.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Custom Size</h2>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="label" htmlFor="width">Width (px)</label>
                  <input
                    type="number"
                    id="width"
                    value={width}
                    onChange={handleWidthChange}
                    min="1"
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <label className="label" htmlFor="height">Height (px)</label>
                  <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={handleHeightChange}
                    min="1"
                    className="input"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={toggleAspectRatio}
                    className="btn-secondary h-10"
                    title={maintainAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                  >
                    {maintainAspectRatio ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Unlock className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                ref={imageRef}
                src={image}
                alt="Upload"
                className="max-w-full"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full btn"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Resized Image
          </button>
        </div>
      )}
    </div>
  );
}