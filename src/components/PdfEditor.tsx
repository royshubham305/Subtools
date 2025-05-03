import React, { useState, useRef, Suspense } from 'react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Upload, 
  Image as ImageIcon, 
  FileDown,
  Loader2,
  GripVertical,
  Merge,
  X
} from 'lucide-react';
import UploadProgress from './UploadProgress';
import DownloadProgress from './DownloadProgress';
import JSZip from 'jszip';

// Lazy load react-pdf components
const Document = React.lazy(() => import('react-pdf').then(module => ({ default: module.Document })));
const Page = React.lazy(() => import('react-pdf').then(module => ({ default: module.Page })));

// Set up the PDF.js worker
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFFile {
  id: string;
  file: File;
}

export default function PdfEditor() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setError('Please upload valid PDF files');
      return;
    }

    setIsUploading(true);
    setCurrentFileName(pdfFiles[0].name);
    setError('');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2.5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const newPdfFiles = pdfFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file
          }));
          setPdfFiles(prev => [...prev, ...newPdfFiles]);
          setIsUploading(false);
          setUploadProgress(0);
        }, 100);
      }
    }, 100);
  };

  const handleMergePDFs = async () => {
    if (pdfFiles.length < 2) {
      setError('Please upload at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const pdfBytes = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setDownloadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            saveAs(blob, 'merged.pdf');
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 100);
        }
      }, 50);
    } catch (err) {
      console.error('Merge error:', err);
      setError('Error merging PDFs. Please ensure all files are valid PDFs.');
      setIsDownloading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const pdfDoc = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageBytes = await file.arrayBuffer();
        
        let image;
        if (file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue;
        }

        // Create a new page with standard A4 dimensions (595.28 x 841.89 points)
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width: imgWidth, height: imgHeight } = image.scale(1);
        
        // Calculate dimensions to fit image within page margins (0.5 inch margins)
        const pageWidth = page.getWidth() - 72; // 72 points = 1 inch
        const pageHeight = page.getHeight() - 72;
        
        // Calculate scaling factor to fit image within page while maintaining aspect ratio
        const scale = Math.min(
          pageWidth / imgWidth,
          pageHeight / imgHeight
        );
        
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        // Center the image on the page
        const x = (page.getWidth() - scaledWidth) / 2;
        const y = (page.getHeight() - scaledHeight) / 2;
        
        // Draw the image
        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setDownloadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            saveAs(blob, 'converted-images.pdf');
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 100);
        }
      }, 50);
    } catch (err) {
      console.error('Image conversion error:', err);
      setError('Error converting images to PDF');
      setIsDownloading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractImages = async () => {
    if (!pdfFiles.length) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const pdfBytes = await pdfFiles[0].file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
      const images: { blob: Blob; pageNum: number; index: number }[] = [];
      const zip = new JSZip();
      const imageFolder = zip.folder('extracted-images');

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: true });

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Set white background for non-transparent images
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport,
          background: 'transparent'
        }).promise;

        // Get the operatorList to find image operations
        const opList = await page.getOperatorList();
        const imageIndices = [];
        for (let i = 0; i < opList.fnArray.length; i++) {
          if (opList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
            imageIndices.push(i);
          }
        }

        // If no specific images found, save the whole page
        if (imageIndices.length === 0) {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const fileName = `page-${pageNum.toString().padStart(3, '0')}.png`;
              if (imageFolder) {
                imageFolder.file(fileName, blob);
              }
            }
          }, 'image/png', 1.0);
        } else {
          // Extract individual images from the page
          for (let i = 0; i < imageIndices.length; i++) {
            const imgCanvas = document.createElement('canvas');
            const imgContext = imgCanvas.getContext('2d');
            
            if (imgContext) {
              // Get image dimensions from the operatorList
              const imgData = opList.argsArray[imageIndices[i]][0];
              imgCanvas.width = imgData.width || canvas.width;
              imgCanvas.height = imgData.height || canvas.height;
              
              // Draw the image portion
              imgContext.drawImage(canvas, 0, 0);
              
              imgCanvas.toBlob(async (blob) => {
                if (blob) {
                  const fileName = `page-${pageNum.toString().padStart(3, '0')}-image-${(i + 1).toString().padStart(2, '0')}.png`;
                  if (imageFolder) {
                    imageFolder.file(fileName, blob);
                  }
                }
              }, 'image/png', 1.0);
            }
          }
        }

        // Update progress
        const progress = (pageNum / pdf.numPages) * 100;
        setDownloadProgress(Math.round(progress));
      }

      // Generate and download the zip file
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      // Save the zip file
      const zipFileName = pdfFiles[0].file.name.replace('.pdf', '-images.zip');
      saveAs(content, zipFileName);
      
      setIsDownloading(false);
      setDownloadProgress(0);
    } catch (err) {
      console.error('Image extraction error:', err);
      setError('Error extracting images from PDF');
      setIsDownloading(false);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(pdfFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPdfFiles(items);
  };

  const removePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
    if (error) setError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">PDF Tools</h1>

      <UploadProgress 
        progress={uploadProgress}
        fileName={currentFileName}
        show={isUploading}
      />
      
      <DownloadProgress
        progress={downloadProgress}
        fileName={currentFileName}
        show={isDownloading}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* PDF Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload PDFs</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-upload"
            ref={fileInputRef}
            multiple
          />
          <label
            htmlFor="pdf-upload"
            className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <span className="text-gray-600">Click to upload PDFs</span>
          </label>
        </div>

        {/* Image to PDF Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Images to PDF</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            multiple
          />
          <label
            htmlFor="image-upload"
            className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <span className="text-gray-600">Upload images to convert</span>
          </label>
        </div>
      </div>

      {pdfFiles.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">PDF Tools</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extract Images
                </label>
                <button
                  onClick={handleExtractImages}
                  className="btn-secondary w-full"
                  disabled={loading}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Extract Images as PNG
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Merge PDFs</h3>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pdf-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {pdfFiles.map((pdf, index) => (
                      <Draggable key={pdf.id} draggableId={pdf.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center bg-gray-50 p-3 rounded-lg"
                          >
                            <div {...provided.dragHandleProps} className="mr-3">
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="flex-1 truncate">{pdf.file.name}</span>
                            <button
                              onClick={() => removePdf(pdf.id)}
                              className="ml-2 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button
              onClick={handleMergePDFs}
              disabled={pdfFiles.length < 2 || loading}
              className="mt-4 w-full btn"
            >
              <Merge className="w-4 h-4 mr-2" />
              Merge PDFs
            </button>
          </div>

          <div className="relative">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading PDF viewer...</span>
              </div>
            }>
              <Document
                file={pdfFiles[0].file}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className="pdf-document"
              >
                <Page
                  pageNumber={currentPage}
                  className="pdf-page"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </Suspense>
          </div>

          {numPages > 1 && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="py-2">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}