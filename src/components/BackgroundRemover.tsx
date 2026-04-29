import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Eraser, RefreshCw, Layers, Wand2, Undo2, Redo2, RotateCcw } from 'lucide-react';
import UploadProgress from './UploadProgress';
import DownloadProgress from './DownloadProgress';

const BackgroundRemover = () => {
  const fileInputId = 'background-remover-file-input';
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [mode, setMode] = useState<'upload' | 'auto' | 'manual'>('upload');
  const [edgeCleanup, setEdgeCleanup] = useState(0);
  const [brushSize, setBrushSize] = useState(20);
// Removed unused isDrawing state since drawing state is tracked via isDrawingRef
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  
  const [isIsolated, setIsIsolated] = useState(true);
  React.useEffect(() => {
    if (!window.crossOriginIsolated) {
        setIsIsolated(false);
    }
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const baseImageDataRef = useRef<ImageData | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const previewLoadingStartedAtRef = useRef<number | null>(null);
  const downloadStartedAtRef = useRef<number | null>(null);
  const uploadIntervalRef = useRef<number | null>(null);
  const downloadIntervalRef = useRef<number | null>(null);

  const syncHistoryCounts = () => {
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  };

  const snapshotCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return null;
    try {
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      return null;
    }
  };

  const restoreCanvas = (imageData: ImageData) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.putImageData(imageData, 0, 0);
    ctx.beginPath();
  };

  const pushUndoSnapshot = () => {
    const snap = snapshotCanvas();
    if (!snap) return;
    undoStackRef.current.push(snap);
    const maxSnapshots = 30;
    if (undoStackRef.current.length > maxSnapshots) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    syncHistoryCounts();
  };

  const undo = () => {
    if (!contextRef.current || undoStackRef.current.length === 0) return;
    const current = snapshotCanvas();
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    if (current) redoStackRef.current.push(current);
    restoreCanvas(previous);
    syncHistoryCounts();
  };

  const redo = () => {
    if (!contextRef.current || redoStackRef.current.length === 0) return;
    const current = snapshotCanvas();
    const next = redoStackRef.current.pop();
    if (!next) return;
    if (current) undoStackRef.current.push(current);
    restoreCanvas(next);
    syncHistoryCounts();
  };

  const startOver = () => {
    if (!baseImageDataRef.current) return;
    undoStackRef.current = [];
    redoStackRef.current = [];
    restoreCanvas(baseImageDataRef.current);
    syncHistoryCounts();
  };

  const startOverAll = () => {
    if (mode === 'manual') {
      startOver();
      return;
    }
    setProcessedImage(null);
    setEdgeCleanup(0);
    setMode('auto');
  };

  const startPreviewLoading = () => {
    previewLoadingStartedAtRef.current = Date.now();
    setIsPreviewLoading(true);
    setUploadProgress(0);

    if (uploadIntervalRef.current) {
      window.clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    uploadIntervalRef.current = window.setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 95) return 95;
        const step = p < 60 ? 8 : 4;
        return Math.min(95, p + step);
      });
    }, 120);
  };

  const stopPreviewLoading = () => {
    const startedAt = previewLoadingStartedAtRef.current;
    const minMs = 600;

    if (uploadIntervalRef.current) {
      window.clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setUploadProgress(100);

    if (!startedAt) {
      setIsPreviewLoading(false);
      setUploadProgress(0);
      return;
    }
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minMs - elapsed);
    window.setTimeout(() => {
      setIsPreviewLoading(false);
      setUploadProgress(0);
    }, remaining);
  };

  const startDownloading = () => {
    downloadStartedAtRef.current = Date.now();
    setIsDownloading(true);
    setDownloadProgress(0);

    if (downloadIntervalRef.current) {
      window.clearInterval(downloadIntervalRef.current);
      downloadIntervalRef.current = null;
    }
    downloadIntervalRef.current = window.setInterval(() => {
      setDownloadProgress((p) => {
        if (p >= 95) return 95;
        const step = p < 60 ? 10 : 5;
        return Math.min(95, p + step);
      });
    }, 140);
  };

  const stopDownloading = () => {
    const startedAt = downloadStartedAtRef.current;
    const minMs = 600;

    if (downloadIntervalRef.current) {
      window.clearInterval(downloadIntervalRef.current);
      downloadIntervalRef.current = null;
    }
    setDownloadProgress(100);

    if (!startedAt) {
      setIsDownloading(false);
      setDownloadProgress(0);
      return;
    }
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minMs - elapsed);
    window.setTimeout(() => {
      setIsDownloading(false);
      setDownloadProgress(0);
    }, remaining);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setProcessedImage(null);
      startPreviewLoading();
      setMode('auto'); // Go to auto mode first or choice screen? Let's go to choice/preview
    }
    e.target.value = '';
  };

  const toBlobFromCanvas = (canvas: HTMLCanvasElement) => {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) {
          reject(new Error('Failed to export image'));
          return;
        }
        resolve(b);
      }, 'image/png');
    });
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  };

  const applyAlphaCutoff = async (input: Blob, cutoff: number) => {
    if (cutoff <= 0) return input;

    const bitmap = await createImageBitmap(input);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return input;

    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const alphaCutoff = Math.max(0, Math.min(255, cutoff));

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < alphaCutoff) data[i + 3] = 0;
    }

    ctx.putImageData(imageData, 0, 0);
    const outBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    return outBlob ?? input;
  };

  const runAutoRemoval = async () => {
    if (!image || !imageUrl) return;
    
    setIsProcessing(true);
    setProgressText('Initializing AI engine...');
    setDebugInfo('');
    
    try {
      // Dynamic import to prevent loading issues
      const { removeBackground } = await import('@imgly/background-removal');
      
      const config = {
           publicPath: window.location.origin + '/models/', // Absolute path to local models
           model: 'isnet' as const,
           debug: true,
           progress: (key: string, current: number, total: number) => {
              const percent = Math.round((current / total) * 100);
              setProgressText(`Downloading ${key}: ${percent}%`);
            }
          };

      setProgressText('Processing image...');
      // Pass the blob URL instead of File object to be safer
      const blob = await removeBackground(imageUrl, config);
      const processedBlob = await applyAlphaCutoff(blob, Math.round((edgeCleanup / 100) * 255));
      startPreviewLoading();
      const url = URL.createObjectURL(processedBlob);
      setProcessedImage(url);
      setMode('auto'); // Show result
    } catch (error: unknown) {
      console.error('Background removal failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      setDebugInfo(message);
      alert(`Failed to remove background: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const initManualMode = () => {
    setMode('manual');
    startPreviewLoading();
    setTimeout(() => {
      if (canvasRef.current && imageUrl) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = processedImage || imageUrl; // Start from processed or original
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          contextRef.current = ctx;
          originalImageRef.current = img;
          baseImageDataRef.current = snapshotCanvas();
          undoStackRef.current = [];
          redoStackRef.current = [];
          syncHistoryCounts();
          stopPreviewLoading();
        };
        img.onerror = () => {
          stopPreviewLoading();
        };
      }
    }, 100);
  };

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    if (!contextRef.current) return;
    // const { offsetX, offsetY } = nativeEvent; // unused
    // Map screen coordinates to canvas coordinates if scaled
    // For now assume simplified view, but usually need scaling
    pushUndoSnapshot();
    isDrawingRef.current = true;
    // setIsDrawing(true); // removed: state no longer exists
    erase({ nativeEvent } as React.MouseEvent);
  };

  const finishDrawing = () => {
    isDrawingRef.current = false;
    contextRef.current?.beginPath();
  };

  const erase = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawingRef.current || !contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (nativeEvent.clientX - rect.left) * scaleX;
    const y = (nativeEvent.clientY - rect.top) * scaleY;

    const ctx = contextRef.current;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const downloadImage = async () => {
    if (isDownloading) return;
    startDownloading();
    setDebugInfo('');

    try {
      await new Promise((r) => setTimeout(r, 50));
      if (mode === 'manual' && canvasRef.current) {
        setDownloadProgress(60);
        const blob = await toBlobFromCanvas(canvasRef.current);
        setDownloadProgress(95);
        downloadBlob(blob, 'removed-background.png');
        return;
      }

      const sourceUrl = processedImage || imageUrl;
      if (!sourceUrl) return;

      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error('Failed to download image');
      setDownloadProgress(60);
      const blob = await response.blob();
      setDownloadProgress(95);
      downloadBlob(blob, 'removed-background.png');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setDebugInfo(message);
      alert(`Failed to download: ${message}`);
    } finally {
      stopDownloading();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <UploadProgress
        progress={uploadProgress}
        fileName={image?.name ?? 'Image'}
        show={isPreviewLoading}
      />
      <DownloadProgress
        progress={downloadProgress}
        fileName="removed-background.png"
        show={isDownloading}
      />
      <input
        id={fileInputId}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600">
          Background Remover
        </h1>
        <p className="text-gray-600 text-lg">
          Automatically remove backgrounds or edit manually with precision.
        </p>
        {!isIsolated && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm inline-block max-w-2xl">
                ℹ️ Info: Running in compatibility mode. Initial download might take a moment.
            </div>
        )}
        {debugInfo && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm inline-block max-w-2xl text-left font-mono whitespace-pre-wrap">
                <p className="font-bold mb-2">Error: {debugInfo}</p>
            </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 min-h-[600px] flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-10">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <label htmlFor={fileInputId} className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors font-medium">
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </label>
            
            {imageUrl && (
                <>
                    <button 
                        onClick={runAutoRemoval} 
                        disabled={isProcessing}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-colors disabled:opacity-50 font-medium"
                    >
                        {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        {isProcessing ? (progressText || 'Processing...') : 'Auto Remove'}
                    </button>
                    
                    <button 
                        onClick={initManualMode}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${mode === 'manual' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Eraser className="w-4 h-4 mr-2" />
                        Manual Erase
                    </button>

                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-xs font-semibold text-gray-600">Edge Cleanup</span>
                        <input
                            type="range"
                            min="0"
                            max="40"
                            value={edgeCleanup}
                            onChange={(e) => setEdgeCleanup(Number(e.target.value))}
                            className="w-28 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isProcessing}
                        />
                        <span className="text-xs text-gray-600 w-8 text-right">{edgeCleanup}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={undo}
                        disabled={mode !== 'manual' || undoCount === 0}
                        className="flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        title="Undo"
                        type="button"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={redo}
                        disabled={mode !== 'manual' || redoCount === 0}
                        className="flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        title="Redo"
                        type="button"
                      >
                        <Redo2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={startOverAll}
                        className="flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                        title="Start over"
                        type="button"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                </>
            )}
          </div>

          {mode === 'manual' && (
             <div className="flex items-center gap-4 border-l pl-4 border-gray-200">
                <span className="text-sm font-medium text-gray-600">Brush Size:</span>
                <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-8 h-8 rounded-full bg-gray-900" style={{ width: brushSize / 2, height: brushSize / 2 }}></div>
             </div>
          )}

          {imageUrl && (
            <button 
                onClick={downloadImage}
                disabled={isDownloading}
                className="flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 font-medium w-full md:w-auto md:ml-auto disabled:opacity-50"
            >
                <Download className="w-4 h-4 mr-2" />
                Download
            </button>
          )}
        </div>

        {/* Workspace */}
        <div className="flex-1 bg-checkerboard relative overflow-hidden flex items-center justify-center p-8">
            {!imageUrl ? (
                <label htmlFor={fileInputId} className="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-white/50 cursor-pointer hover:bg-white/60 transition-colors">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Upload an Image to Start</h3>
                    <p className="text-gray-500 mb-6">Support for JPG, PNG, and WebP formats</p>
                    <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-medium">
                        <Upload className="w-5 h-5 mr-2" />
                        Select Image
                    </div>
                </label>
            ) : (
                <div className="relative max-w-full max-h-[600px] shadow-2xl rounded-lg overflow-hidden bg-white">
                    {mode === 'manual' ? (
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseUp={finishDrawing}
                            onMouseLeave={finishDrawing}
                            onMouseMove={erase}
                            className="cursor-crosshair max-w-full max-h-[70vh]"
                            style={{ touchAction: 'none' }}
                        />
                    ) : (
                        <img 
                            src={processedImage || imageUrl} 
                            alt="Preview" 
                            className="max-w-full max-h-[70vh] object-contain"
                            onLoad={stopPreviewLoading}
                            onError={stopPreviewLoading}
                        />
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI Auto Removal</h3>
            <p className="text-gray-600">Instantly remove backgrounds from any image with our advanced AI technology.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Eraser className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Fine-tuning</h3>
            <p className="text-gray-600">Use the precision eraser tool to clean up tricky edges or remove unwanted objects.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Transparent Output</h3>
            <p className="text-gray-600">Download high-quality PNG images with transparent backgrounds ready for use.</p>
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemover;
