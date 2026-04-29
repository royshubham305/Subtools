import React, { useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Upload, Download, Maximize, Lock, Unlock, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, RefreshCw, Crop, Sliders, Move } from 'lucide-react';
import UploadProgress from './UploadProgress';
import DownloadProgress from './DownloadProgress';

const ASPECT_RATIOS = [
  { name: 'Square', value: 1, label: '1:1' },
  { name: 'Passport', value: 35/45, label: '35:45' },
  { name: 'Landscape', value: 4/3, label: '4:3' },
  { name: 'Portrait', value: 3/4, label: '3:4' },
  { name: 'Wide', value: 16/9, label: '16:9' },
  { name: 'Story', value: 9/16, label: '9:16' },
];

export default function ImageResizer() {
  const [image, setImage] = useState<string>('');
  const [selectedRatio, setSelectedRatio] = useState<string | number>(1);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(800);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
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
                    background: false, // We'll handle background in CSS
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

  const handleRotate = (degree: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotate(degree);
    }
  };

  const handleFlipHorizontal = () => {
    if (cropperRef.current) {
      const newScaleX = scaleX === 1 ? -1 : 1;
      cropperRef.current.scaleX(newScaleX);
      setScaleX(newScaleX);
    }
  };

  const handleFlipVertical = () => {
    if (cropperRef.current) {
      const newScaleY = scaleY === 1 ? -1 : 1;
      cropperRef.current.scaleY(newScaleY);
      setScaleY(newScaleY);
    }
  };

  const handleReset = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
      setScaleX(1);
      setScaleY(1);
      setSelectedRatio(1);
      if (maintainAspectRatio) {
        cropperRef.current.setAspectRatio(1);
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

  const handleNewUpload = () => {
    setImage('');
    if (cropperRef.current) {
      cropperRef.current.destroy();
    }
    setCurrentFileName('');
    setUploadProgress(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Free Online Image Resizer & Cropper
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Resize and crop your images online for free. Use our pre-set templates to create perfect <strong>Instagram Stories (9:16)</strong>, <strong>YouTube Thumbnails (16:9)</strong>, and <strong>Passport Photos (35:45)</strong>. Support for custom dimensions with locked aspect ratio ensures your images are never stretched.
        </p>
      </div>
      
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

      {!image ? (
         <div className="max-w-3xl mx-auto">
           <div className="border-3 border-dashed border-indigo-200 rounded-2xl p-16 text-center bg-white/50 hover:bg-white hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md group">
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
               <p className="text-gray-500 mb-6">JPG, PNG, GIF supported</p>
               <span className="btn bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
                 Select Image
               </span>
             </label>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6 mt-12">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <Crop className="w-6 h-6" />
               </div>
               <h3 className="font-semibold text-gray-900 mb-2">Smart Crop</h3>
               <p className="text-sm text-gray-500">Crop images to any aspect ratio or custom dimensions</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <Maximize className="w-6 h-6" />
               </div>
               <h3 className="font-semibold text-gray-900 mb-2">Pixel Perfect</h3>
               <p className="text-sm text-gray-500">Resize without losing clarity with high-quality algorithms</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
               <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <RotateCw className="w-6 h-6" />
               </div>
               <h3 className="font-semibold text-gray-900 mb-2">Transform</h3>
               <p className="text-sm text-gray-500">Rotate and flip tools for quick orientation fixes</p>
             </div>
           </div>
         </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 animate-fadeInUp">
          {/* Controls Panel */}
          <div className="w-full lg:w-80 space-y-6 flex-shrink-0">
             <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Sliders className="w-5 h-5 mr-2 text-indigo-500" />
                    Editor
                  </h2>
                  <button 
                    onClick={handleNewUpload}
                    className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
                  >
                    New Image
                  </button>
                </div>
                
                {/* Dimensions */}
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700">Dimensions</label>
                    <button
                      onClick={toggleAspectRatio}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title={maintainAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                    >
                      {maintainAspectRatio ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Width</label>
                      <input
                        type="number"
                        value={width}
                        onChange={handleWidthChange}
                        min="1"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Height</label>
                      <input
                        type="number"
                        value={height}
                        onChange={handleHeightChange}
                        min="1"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.name}
                        onClick={() => handleAspectRatioChange(ratio.value)}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                          selectedRatio === ratio.value
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {ratio.name}
                        <span className="block text-[10px] opacity-70">{ratio.label}</span>
                      </button>
                    ))}
                    <button
                        onClick={() => handleAspectRatioChange('custom')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                          selectedRatio === 'custom'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Free
                        <span className="block text-[10px] opacity-70">Custom</span>
                      </button>
                  </div>
                </div>

                {/* Transform Tools */}
                <div className="mb-8">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">Transform</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => handleRotate(-90)} className="btn-icon-sm" title="Rotate Left">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRotate(90)} className="btn-icon-sm" title="Rotate Right">
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button onClick={handleFlipHorizontal} className="btn-icon-sm" title="Flip Horizontal">
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={handleFlipVertical} className="btn-icon-sm" title="Flip Vertical">
                      <FlipVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full mt-3 flex items-center justify-center text-xs text-red-500 hover:bg-red-50 py-2 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset Changes
                  </button>
                </div>

                {/* Action */}
                <button
                  onClick={handleDownload}
                  className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-200 transition-all py-3 rounded-xl font-semibold flex items-center justify-center mb-3"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Image
                </button>

                <button
                  onClick={handleNewUpload}
                  className="w-full btn bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all py-3 rounded-xl font-semibold flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Start Over
                </button>
             </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 min-h-[500px] flex flex-col">
            <div className="flex-1 bg-checkerboard rounded-xl overflow-hidden border border-gray-200 relative flex items-center justify-center">
              <img
                ref={imageRef}
                src={image}
                alt="Upload"
                className="max-w-full max-h-[70vh]"
              />
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
               <span className="flex items-center">
                 <Move className="w-4 h-4 mr-2" />
                 Drag to move • Scroll to zoom
               </span>
               <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                 {width} x {height} px
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}