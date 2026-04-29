import React, { useState, useRef, Suspense, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
// @ts-expect-error
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { 
  Image as ImageIcon, 
  FileDown,
  Loader2,
  GripVertical,
  Merge,
  Lock,
  Unlock,
  Scissors,
  Layers,
  RotateCcw,
  RotateCw,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react';
import UploadProgress from './UploadProgress';
import DownloadProgress from './DownloadProgress';
import JSZip from 'jszip';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import createQpdfModule from '@neslinesli93/qpdf-wasm';
import qpdfWasmUrl from '@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PDFFile {
  id: string;
  file: File;
}

interface ImageItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

interface ExtractPagePreview {
  pageNum: number;
  url: string;
  selected: boolean;
}

interface OrganizePageItem {
  id: string;
  pageNum: number;
  url: string;
  rotation: 0 | 90 | 180 | 270;
  removed: boolean;
}

type QpdfWasmModule = {
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
  };
  callMain: (args: string[]) => unknown;
};

let qpdfWasmPromise: Promise<QpdfWasmModule> | null = null;
let qpdfStdout: string[] = [];
let qpdfStderr: string[] = [];
const getQpdfWasm = async () => {
  if (!qpdfWasmPromise) {
    qpdfWasmPromise = (async () => {
      const mod = (await createQpdfModule({
        locateFile: (path: string) => (path.endsWith('.wasm') ? qpdfWasmUrl : path),
        noInitialRun: true,
        print: (text: unknown) => {
          qpdfStdout.push(String(text));
          if (qpdfStdout.length > 200) qpdfStdout = qpdfStdout.slice(-200);
        },
        printErr: (text: unknown) => {
          qpdfStderr.push(String(text));
          if (qpdfStderr.length > 200) qpdfStderr = qpdfStderr.slice(-200);
        },
      })) as QpdfWasmModule;
      return mod;
    })();
  }
  return qpdfWasmPromise;
};

const runQpdfTransform = async (source: File, args: string[], onProgress?: (percent: number) => void) => {
  onProgress?.(10);
  const mod = await getQpdfWasm();
  onProgress?.(35);

  qpdfStdout = [];
  qpdfStderr = [];

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = `/input-${stamp}.pdf`;
  const outputPath = `/output-${stamp}.pdf`;

  const sourceBytes = new Uint8Array(await source.arrayBuffer());
  mod.FS.writeFile(inputPath, sourceBytes);

  try {
    onProgress?.(60);
    try {
      mod.callMain([...args, inputPath, outputPath]);
    } catch (err) {
      const detail = qpdfStderr.join('\n') || qpdfStdout.join('\n') || (err instanceof Error ? err.message : String(err));
      throw new Error(detail);
    }
    onProgress?.(90);
    return mod.FS.readFile(outputPath);
  } finally {
    try {
      mod.FS.unlink(inputPath);
    } catch {
    }
    try {
      mod.FS.unlink(outputPath);
    } catch {
    }
  }
};

export default function PdfEditor() {
  type ToolKey =
    | 'images_to_pdf'
    | 'merge'
    | 'extract'
    | 'compress'
    | 'unlock'
    | 'lock'
    | 'organize'
    | 'split';

  const [openTool, setOpenTool] = useState<ToolKey | null>(null);
  const [mergePdfFiles, setMergePdfFiles] = useState<PDFFile[]>([]);
  const [extractPdfFile, setExtractPdfFile] = useState<File | null>(null);
  const [compressPdfFile, setCompressPdfFile] = useState<File | null>(null);
  const [unlockPdfFile, setUnlockPdfFile] = useState<File | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [lockPdfFile, setLockPdfFile] = useState<File | null>(null);
  const [lockPassword, setLockPassword] = useState('');
  const [organizePdfFile, setOrganizePdfFile] = useState<File | null>(null);
  const [organizePages, setOrganizePages] = useState<OrganizePageItem[]>([]);
  const [isPreparingOrganize, setIsPreparingOrganize] = useState(false);
  const [organizePrepareProgress, setOrganizePrepareProgress] = useState(0);
  const [splitPdfFile, setSplitPdfFile] = useState<File | null>(null);
  const [splitRangesText, setSplitRangesText] = useState('1-1');
  const [splitMode, setSplitMode] = useState<'ranges' | 'single'>('ranges');
  const [splitPageCount, setSplitPageCount] = useState<number | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [extractPagePreviews, setExtractPagePreviews] = useState<ExtractPagePreview[]>([]);
  const [isPreparingExtract, setIsPreparingExtract] = useState(false);
  const [extractPrepareProgress, setExtractPrepareProgress] = useState(0);
  const [extractFormat, setExtractFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      setPageWidth(Math.min(window.innerWidth - 64, 600));
    };
    
    // Initial set
    updateWidth();

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [compressPreset, setCompressPreset] = useState<'small' | 'balanced' | 'best'>('balanced');
  const [compressLevel, setCompressLevel] = useState(70);
  const [compressTargetEnabled, setCompressTargetEnabled] = useState(false);
  const [compressTargetMb, setCompressTargetMb] = useState(2);
  const [compressResultBytes, setCompressResultBytes] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'merge' | 'extract' | 'compress'>('merge');

  const previewPdfFile =
    (previewMode === 'merge'
      ? mergePdfFiles[0]?.file
      : previewMode === 'extract'
        ? extractPdfFile
        : compressPdfFile) ??
    extractPdfFile ??
    compressPdfFile ??
    mergePdfFiles[0]?.file;
  const imageItemsRef = useRef<ImageItem[]>([]);
  const extractPagePreviewsRef = useRef<ExtractPagePreview[]>([]);
  const organizePagesRef = useRef<OrganizePageItem[]>([]);

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(0);
  }, [previewPdfFile]);

  useEffect(() => {
    imageItemsRef.current = imageItems;
  }, [imageItems]);

  useEffect(() => {
    extractPagePreviewsRef.current = extractPagePreviews;
  }, [extractPagePreviews]);

  useEffect(() => {
    organizePagesRef.current = organizePages;
  }, [organizePages]);

  useEffect(() => {
    return () => {
      imageItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  useEffect(() => {
    return () => {
      organizePagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  useEffect(() => {
    return () => {
      extractPagePreviewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const detectRasterKind = (bytes: Uint8Array): 'jpeg' | 'png' | 'unknown' => {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'png';
    }
    return 'unknown';
  };

  const decodeToPngBytes = async (file: File): Promise<Uint8Array> => {
    const blobUrl = URL.createObjectURL(file);
    try {
      const canvas = document.createElement('canvas');

      let width = 0;
      let height = 0;

      try {
        const bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
      } catch {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('Unsupported image format'));
          el.src = blobUrl;
        });
        width = img.naturalWidth || img.width;
        height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        ctx.drawImage(img, 0, 0);
      }

      const outBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode PNG'))), 'image/png');
      });
      return new Uint8Array(await outBlob.arrayBuffer());
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  const getCompressLevelForPreset = (preset: 'small' | 'balanced' | 'best') => {
    if (preset === 'small') return 90;
    if (preset === 'best') return 30;
    return 60;
  };

  const getCompressSettingsFromLevel = (level: number) => {
    const ratio = clampNumber(level / 100, 0, 1);
    const quality = clampNumber(0.95 - ratio * 0.7, 0.25, 0.95);
    const scale = clampNumber(2.0 - ratio * 1.15, 0.85, 2.0);
    return { quality, scale };
  };

  const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const parseRangeSegments = (text: string) =>
    text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const parsePageGroup = (segment: string, maxPages: number) => {
    const match = segment.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`Invalid range: ${segment}`);

    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;
    if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error(`Invalid range: ${segment}`);
    if (start < 1 || end < 1) throw new Error(`Pages must be >= 1: ${segment}`);
    if (start > maxPages || end > maxPages) throw new Error(`Range exceeds page count: ${segment}`);

    const a = Math.min(start, end);
    const b = Math.max(start, end);
    const pages: number[] = [];
    for (let p = a; p <= b; p++) pages.push(p);
    return pages;
  };

  const getSplitGroups = (maxPages: number) => {
    if (splitMode === 'single') {
      const groups: number[][] = [];
      for (let p = 1; p <= maxPages; p++) groups.push([p]);
      return groups;
    }
    const segments = parseRangeSegments(splitRangesText);
    if (segments.length === 0) throw new Error('Please enter at least one range');
    return segments.map((seg) => parsePageGroup(seg, maxPages));
  };

  const buildCompressedPdfBytes = async (
    source: File,
    settings: { quality: number; scale: number },
    onProgress?: (percent: number) => void
  ) => {
    const { quality, scale } = settings;
    const sourceBytes = await source.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: sourceBytes }).promise;
    const outPdf = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not get canvas context');

      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

      const jpgBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG'))), 'image/jpeg', quality);
      });
      const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
      const embedded = await outPdf.embedJpg(jpgBytes);

      const outPage = outPdf.addPage([baseViewport.width, baseViewport.height]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });

      onProgress?.(Math.round((pageNum / pdf.numPages) * 90));
      await new Promise((r) => setTimeout(r, 0));
    }

    return outPdf.save();
  };

  useEffect(() => {
    setCompressResultBytes(null);
  }, [compressPdfFile, compressLevel]);

  useEffect(() => {
    setExtractPagePreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });

    if (!extractPdfFile) {
      setIsPreparingExtract(false);
      setExtractPrepareProgress(0);
      return;
    }

    let cancelled = false;
    setIsPreparingExtract(true);
    setExtractPrepareProgress(0);

    const run = async () => {
      try {
        const pdfBytes = await extractPdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.75 });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) throw new Error('Could not get canvas context');

          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport, background: 'white' }).promise;

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode preview'))), 'image/jpeg', 0.7);
          });
          const url = URL.createObjectURL(blob);

          setExtractPagePreviews((prev) => [...prev, { pageNum, url, selected: true }]);
          setExtractPrepareProgress(Math.round((pageNum / pdf.numPages) * 100));
          await new Promise((r) => setTimeout(r, 0));
        }
      } catch (err) {
        console.error('Extract preview error:', err);
        setError('Error preparing pages for extraction');
      } finally {
        if (cancelled) return;
        setIsPreparingExtract(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      setIsPreparingExtract(false);
    };
  }, [extractPdfFile]);

  useEffect(() => {
    setOrganizePages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });

    if (!organizePdfFile) {
      setIsPreparingOrganize(false);
      setOrganizePrepareProgress(0);
      return;
    }

    let cancelled = false;
    setIsPreparingOrganize(true);
    setOrganizePrepareProgress(0);

    const run = async () => {
      try {
        const pdfBytes = await organizePdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.65 });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) throw new Error('Could not get canvas context');

          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport, background: 'white' }).promise;

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode preview'))), 'image/jpeg', 0.75);
          });
          const url = URL.createObjectURL(blob);
          const id = `page-${pageNum}-${Math.random().toString(36).slice(2, 8)}`;

          setOrganizePages((prev) => [...prev, { id, pageNum, url, rotation: 0, removed: false }]);
          setOrganizePrepareProgress(Math.round((pageNum / pdf.numPages) * 100));
          await new Promise((r) => setTimeout(r, 0));
        }
      } catch (err) {
        console.error('Organize preview error:', err);
        setError('Error preparing pages for organizing');
      } finally {
        if (cancelled) return;
        setIsPreparingOrganize(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      setIsPreparingOrganize(false);
    };
  }, [organizePdfFile]);

  useEffect(() => {
    setSplitPageCount(null);
    if (!splitPdfFile) {
      setSplitRangesText('1-1');
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const bytes = await splitPdfFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setSplitPageCount(pdf.numPages);
        setSplitRangesText(`1-${pdf.numPages}`);
      } catch {
        if (cancelled) return;
        setSplitPageCount(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [splitPdfFile]);

  const getTargetBytesForCompression = (sourceBytes: number) => {
    if (compressTargetEnabled) return Math.round(compressTargetMb * 1024 * 1024);
    const reductionRatio = clampNumber(compressLevel / 100, 0, 1);
    const targetRatio = clampNumber(1 - reductionRatio * 0.9, 0.1, 1);
    return Math.round(sourceBytes * targetRatio);
  };

  const handleUnlockPdf = async () => {
    if (!unlockPdfFile) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    const source = unlockPdfFile;
    const fileBaseName = source.name.toLowerCase().endsWith('.pdf') ? source.name.slice(0, -4) : source.name;
    const outName = `${fileBaseName}-unlocked.pdf`;
    setCurrentFileName(outName);

    try {
      const args = unlockPassword.trim()
        ? [`--password=${unlockPassword}`, '--decrypt', '--']
        : ['--decrypt', '--'];
      const bytes = await runQpdfTransform(source, args, (p) => setDownloadProgress(clampNumber(p, 0, 99)));
      const outBlob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      setDownloadProgress(100);
      saveAs(outBlob, outName);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('password')) {
        setError('Password required or incorrect password');
      } else {
        console.error('Unlock PDF error:', err);
        setError('Error unlocking PDF');
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setLoading(false);
    }
  };

  const handleLockPdf = async () => {
    if (!lockPdfFile) {
      setError('Please upload a PDF file');
      return;
    }
    if (!lockPassword.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    const source = lockPdfFile;
    const fileBaseName = source.name.toLowerCase().endsWith('.pdf') ? source.name.slice(0, -4) : source.name;
    const outName = `${fileBaseName}-locked.pdf`;
    setCurrentFileName(outName);

    try {
      const args = ['--encrypt', lockPassword, lockPassword, '256', '--'];
      const bytes = await runQpdfTransform(source, args, (p) => setDownloadProgress(clampNumber(p, 0, 99)));
      const outBlob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      setDownloadProgress(100);
      saveAs(outBlob, outName);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Lock PDF error:', err);
      setError(message || 'Error locking PDF');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setLoading(false);
    }
  };

  const handleOrganizeExport = async () => {
    if (!organizePdfFile) {
      setError('Please upload a PDF file');
      return;
    }
    if (organizePages.length === 0) {
      setError('Pages are not ready yet');
      return;
    }
    if (organizeKeptCount === 0) {
      setError('Please keep at least 1 page');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    const source = organizePdfFile;
    const fileBaseName = source.name.toLowerCase().endsWith('.pdf') ? source.name.slice(0, -4) : source.name;
    const outName = `${fileBaseName}-organized.pdf`;
    setCurrentFileName(outName);

    try {
      const bytes = await source.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const outDoc = await PDFDocument.create();

      const kept = organizePages.filter((p) => !p.removed);
      for (let i = 0; i < kept.length; i++) {
        const item = kept[i];
        const [page] = await outDoc.copyPages(srcDoc, [item.pageNum - 1]);
        page.setRotation(degrees(item.rotation));
        outDoc.addPage(page);
        setDownloadProgress(clampNumber(Math.round(((i + 1) / kept.length) * 95), 0, 95));
        await new Promise((r) => setTimeout(r, 0));
      }

      const outBytes = await outDoc.save();
      const outBlob = new Blob([outBytes as unknown as BlobPart], { type: 'application/pdf' });
      setDownloadProgress(100);
      saveAs(outBlob, outName);
    } catch (err) {
      console.error('Organize PDF error:', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('encrypted')) {
        setError('This PDF is encrypted. Please unlock it first, then organize.');
      } else {
        setError('Error exporting organized PDF');
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setLoading(false);
    }
  };

  const handleSplitPdf = async () => {
    if (!splitPdfFile) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    const source = splitPdfFile;
    const fileBaseName = source.name.toLowerCase().endsWith('.pdf') ? source.name.slice(0, -4) : source.name;
    setCurrentFileName(source.name);

    try {
      const bytes = await source.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const pageCount = srcDoc.getPageCount();

      const groups = getSplitGroups(pageCount);
      if (groups.length === 1) {
        const outDoc = await PDFDocument.create();
        const indices = groups[0].map((p) => p - 1);
        const pages = await outDoc.copyPages(srcDoc, indices);
        pages.forEach((p) => outDoc.addPage(p));
        const outBytes = await outDoc.save();
        const outBlob = new Blob([outBytes as unknown as BlobPart], { type: 'application/pdf' });
        setDownloadProgress(100);
        saveAs(outBlob, `${fileBaseName}-split.pdf`);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder('split-pdfs') ?? zip;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const outDoc = await PDFDocument.create();
        const indices = group.map((p) => p - 1);
        const pages = await outDoc.copyPages(srcDoc, indices);
        pages.forEach((p) => outDoc.addPage(p));
        const outBytes = await outDoc.save();
        const label = group.length === 1 ? `${group[0].toString().padStart(3, '0')}` : `${group[0].toString().padStart(3, '0')}-${group[group.length - 1].toString().padStart(3, '0')}`;
        folder.file(`${fileBaseName}-pages-${label}.pdf`, outBytes);
        setDownloadProgress(clampNumber(Math.round(((i + 1) / groups.length) * 95), 0, 95));
        await new Promise((r) => setTimeout(r, 0));
      }

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      setDownloadProgress(100);
      saveAs(content, `${fileBaseName}-split.zip`);
    } catch (err) {
      console.error('Split PDF error:', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('range') || message.toLowerCase().includes('pages must')) {
        setError(message);
      } else if (message.toLowerCase().includes('encrypted')) {
        setError('This PDF is encrypted. Please unlock it first, then split.');
      } else {
        setError('Error splitting PDF');
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setLoading(false);
    }
  };

  const handleMergePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const pdfFiles = files.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
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
          setMergePdfFiles(prev => [...prev, ...newPdfFiles]);
          setPreviewMode('merge');
          setIsUploading(false);
          setUploadProgress(0);
        }, 100);
      }
    }, 100);
  };

  const handleExtractPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }
    setError('');
    setCurrentFileName(file.name);
    setExtractPdfFile(file);
    setPreviewMode('extract');
  };

  const handleCompressPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }
    setError('');
    setCompressPdfFile(file);
    setPreviewMode('compress');
  };

  const handleUnlockPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }
    setError('');
    setCurrentFileName(file.name);
    setUnlockPdfFile(file);
  };

  const handleLockPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }
    setError('');
    setCurrentFileName(file.name);
    setLockPdfFile(file);
  };

  const handleOrganizePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }
    setError('');
    setCurrentFileName(file.name);
    setOrganizePdfFile(file);
  };

  const handleSplitPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file');
      return;
    }
    setError('');
    setCurrentFileName(file.name);
    setSplitPdfFile(file);
  };

  const handleMergePDFs = async () => {
    if (mergePdfFiles.length < 2) {
      setError('Please upload at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of mergePdfFiles) {
        const pdfBytes = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      
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
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    setError('');
    setIsUploadingImages(true);
    setImageUploadProgress(0);
    setCurrentFileName(files.length === 1 ? files[0].name : `${files.length} images`);

    const added: ImageItem[] = [];
    const skipped: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          skipped.push(`${file.name}: Not an image`);
          continue;
        }

        const url = URL.createObjectURL(file);
        try {
          const bitmap = await createImageBitmap(file);
          added.push({
            id: Math.random().toString(36).slice(2),
            file,
            url,
            width: bitmap.width,
            height: bitmap.height,
          });
          bitmap.close();
        } catch {
          added.push({
            id: Math.random().toString(36).slice(2),
            file,
            url,
            width: 0,
            height: 0,
          });
        }

        setImageUploadProgress(Math.round(((i + 1) / files.length) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      setIsUploadingImages(false);
    }

    if (skipped.length) {
      setError(`Skipped ${skipped.length} file(s). First: ${skipped[0]}`);
    }

    setImageItems((prev) => [...prev, ...added]);
  };

  const removeImageItem = (id: string) => {
    setImageItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const clearImageItems = () => {
    setImageItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
  };

  const createPdfFromImages = async () => {
    if (!imageItems.length) return;

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentFileName('converted-images.pdf');

    const skipped: string[] = [];

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        try {
          const imageBytes = new Uint8Array(await item.file.arrayBuffer());

          let image;
          const kind = detectRasterKind(imageBytes);
          if (kind === 'jpeg') {
            image = await pdfDoc.embedJpg(imageBytes);
          } else if (kind === 'png') {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            const pngBytes = await decodeToPngBytes(item.file);
            image = await pdfDoc.embedPng(pngBytes);
          }

          const page = pdfDoc.addPage([595.28, 841.89]);
          const { width: imgWidth, height: imgHeight } = image.scale(1);

          const pageWidth = page.getWidth() - 72;
          const pageHeight = page.getHeight() - 72;

          const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          const x = (page.getWidth() - scaledWidth) / 2;
          const y = (page.getHeight() - scaledHeight) / 2;

          page.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          skipped.push(`${item.file.name}: ${message}`);
        }

        setDownloadProgress(Math.round(((i + 1) / imageItems.length) * 95));
        await new Promise((r) => setTimeout(r, 0));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

      setDownloadProgress(100);
      saveAs(blob, 'converted-images.pdf');

      if (skipped.length) {
        setError(`Skipped ${skipped.length} image(s). First: ${skipped[0]}`);
      }
    } catch (err: unknown) {
      console.error('Image conversion error:', err);
      setError('Error converting images to PDF');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setLoading(false);
    }
  };

  const handleExtractImages = async () => {
    if (!extractPdfFile) {
      setError('Please upload a PDF file');
      return;
    }

    const selectedPages = extractPagePreviews.filter((p) => p.selected).map((p) => p.pageNum);
    if (selectedPages.length === 0) {
      setError('Please select at least 1 page');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentFileName(extractPdfFile.name);

    try {
      const pdfBytes = await extractPdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
      const mime = extractFormat === 'png' ? 'image/png' : 'image/jpeg';
      const ext = extractFormat === 'png' ? 'png' : 'jpg';
      const jpegQuality = 0.92;

      const renderPageToBlob = async (pageNum: number) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, background: 'white' }).promise;

        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))),
            mime,
            extractFormat === 'jpeg' ? jpegQuality : undefined
          );
        });
      };

      if (selectedPages.length === 1) {
        const pageNum = selectedPages[0];
        const blob = await renderPageToBlob(pageNum);
        setDownloadProgress(100);
        saveAs(blob, `page-${pageNum.toString().padStart(3, '0')}.${ext}`);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder('extracted-images') ?? zip;

      for (let i = 0; i < selectedPages.length; i++) {
        const pageNum = selectedPages[i];
        const blob = await renderPageToBlob(pageNum);
        folder.file(`page-${pageNum.toString().padStart(3, '0')}.${ext}`, blob);
        setDownloadProgress(Math.round(((i + 1) / selectedPages.length) * 95));
        await new Promise((r) => setTimeout(r, 0));
      }

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      setDownloadProgress(100);
      const zipFileName = extractPdfFile.name.replace(/\.pdf$/i, '') + `-images-${ext}.zip`;
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

  const handleCompressPdf = async () => {
    if (!compressPdfFile) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setIsDownloading(true);
    setDownloadProgress(0);

    const source = compressPdfFile;
    const fileBaseName = source.name.toLowerCase().endsWith('.pdf') ? source.name.slice(0, -4) : source.name;
    const outName = `${fileBaseName}-compressed.pdf`;
    setCurrentFileName(outName);

    try {
      setCompressResultBytes(null);
      const base = getCompressSettingsFromLevel(compressLevel);

      const targetBytes = getTargetBytesForCompression(source.size);

      let bestBytes: Uint8Array | null = null;
      let bestSettings = base;
      let attempt = 0;
      let current = base;

      const maxAttempts = 4;
      while (attempt < maxAttempts) {
        const attemptIndex = attempt;
        const bytes = await buildCompressedPdfBytes(source, current, (p) => {
          const percent = Math.round((attemptIndex / maxAttempts) * 100 + (p / maxAttempts));
          setDownloadProgress(clampNumber(percent, 0, 99));
        });

        bestBytes = bytes;
        bestSettings = current;

        if (bytes.byteLength <= targetBytes) break;

        const ratio = targetBytes / bytes.byteLength;
        const nextQuality = clampNumber(current.quality * Math.pow(ratio, 0.65), 0.25, current.quality - 0.05);
        const nextScale = clampNumber(current.scale * Math.pow(ratio, 0.35), 0.85, current.scale);
        current = { quality: nextQuality, scale: nextScale };
        attempt += 1;
      }

      if (!bestBytes) throw new Error('Compression failed');

      setDownloadProgress(100);
      setCompressResultBytes(bestBytes.byteLength);
      const outBlob = new Blob([bestBytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(outBlob, outName);

      if (bestBytes.byteLength > targetBytes) {
        setError(
          `Could not reach target size. Output ${(bestBytes.byteLength / 1024 / 1024).toFixed(2)} MB using quality ${bestSettings.quality.toFixed(
            2
          )} at scale ${bestSettings.scale.toFixed(2)}.`
        );
      }
    } catch (err: unknown) {
      console.error('PDF compression error:', err);
      setError('Error compressing PDF');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setLoading(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (result.source.droppableId === 'pdf-list' && result.destination.droppableId === 'pdf-list') {
      const items = Array.from(mergePdfFiles);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setMergePdfFiles(items);
      return;
    }

    if (result.source.droppableId === 'organize-pages' && result.destination.droppableId === 'organize-pages') {
      const items = Array.from(organizePages);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setOrganizePages(items);
      return;
    }
  };

  const removePdf = (id: string) => {
    setMergePdfFiles(prev => prev.filter(pdf => pdf.id !== id));
    if (error) setError('');
  };

  const toggleOrganizeRemoved = (id: string) => {
    setOrganizePages((prev) => prev.map((p) => (p.id === id ? { ...p, removed: !p.removed } : p)));
  };

  const rotateOrganizePage = (id: string, delta: -90 | 90) => {
    setOrganizePages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = (((p.rotation + delta) % 360) + 360) % 360;
        return { ...p, rotation: next as 0 | 90 | 180 | 270 };
      })
    );
  };

  const setAllOrganizeRemoved = (removed: boolean) => {
    setOrganizePages((prev) => prev.map((p) => ({ ...p, removed })));
  };

  const toggleExtractPage = (pageNum: number) => {
    setExtractPagePreviews((prev) => prev.map((p) => (p.pageNum === pageNum ? { ...p, selected: !p.selected } : p)));
  };

  const setAllExtractPagesSelected = (selected: boolean) => {
    setExtractPagePreviews((prev) => prev.map((p) => ({ ...p, selected })));
  };

  const toggleTool = (tool: ToolKey) => {
    setOpenTool((prev) => (prev === tool ? null : tool));
  };

  const clearMergePdfs = () => {
    setMergePdfFiles([]);
    if (error) setError('');
  };

  const clearExtractPdf = () => {
    setExtractPdfFile(null);
    setExtractPagePreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    if (error) setError('');
  };

  const clearCompressPdf = () => {
    setCompressPdfFile(null);
    setCompressResultBytes(null);
    if (error) setError('');
  };

  const clearUnlockPdf = () => {
    setUnlockPdfFile(null);
    setUnlockPassword('');
    if (error) setError('');
  };

  const clearLockPdf = () => {
    setLockPdfFile(null);
    setLockPassword('');
    if (error) setError('');
  };

  const clearOrganizePdf = () => {
    setOrganizePdfFile(null);
    setOrganizePages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    if (error) setError('');
  };

  const clearSplitPdf = () => {
    setSplitPdfFile(null);
    setSplitPageCount(null);
    setSplitRangesText('1-1');
    if (error) setError('');
  };

  const clearImagesToPdf = () => {
    clearImageItems();
    if (error) setError('');
  };

  const closeToolAndClear = (tool: ToolKey) => {
    if (tool === 'images_to_pdf') clearImagesToPdf();
    if (tool === 'merge') clearMergePdfs();
    if (tool === 'extract') clearExtractPdf();
    if (tool === 'compress') clearCompressPdf();
    if (tool === 'unlock') clearUnlockPdf();
    if (tool === 'lock') clearLockPdf();
    if (tool === 'organize') clearOrganizePdf();
    if (tool === 'split') clearSplitPdf();
    setOpenTool(null);
  };

  const toolIsVisible = (tool: ToolKey) => openTool === null || openTool === tool;
  const toolCardClass = (tool: ToolKey) => {
    const base =
      'relative bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300';
    if (openTool === tool) {
      return `${base} fixed inset-0 z-50 rounded-none shadow-none border-0 hover:shadow-none overflow-auto bg-white`;
    }
    return base;
  };

  const toolInnerContainerClass = (tool: ToolKey) => (openTool === tool ? 'max-w-5xl mx-auto' : '');

  useEffect(() => {
    if (openTool) window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [openTool]);

  const uploadOverlay =
    isUploading
      ? { progress: uploadProgress, label: 'Uploading PDFs' }
      : isUploadingImages
        ? { progress: imageUploadProgress, label: 'Uploading images' }
        : isPreparingExtract
          ? { progress: extractPrepareProgress, label: 'Preparing pages' }
          : isPreparingOrganize
            ? { progress: organizePrepareProgress, label: 'Preparing pages' }
          : null;

  const extractSelectedCount = extractPagePreviews.reduce((acc, p) => acc + (p.selected ? 1 : 0), 0);
  const organizeKeptCount = organizePages.reduce((acc, p) => acc + (p.removed ? 0 : 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">PDF Editor - All-in-One PDF Tools</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Work with PDFs directly in your browser: <strong>merge</strong>, <strong>split</strong>, <strong>organize pages</strong>, <strong>lock/unlock</strong>, <strong>compress</strong>, <strong>extract images</strong>, and convert <strong>images to PDF</strong>. Fast, private, and no installation.
        </p>
      </div>

      <UploadProgress
        progress={uploadOverlay?.progress ?? 0}
        fileName={currentFileName || 'File'}
        show={!!uploadOverlay}
        label={uploadOverlay?.label}
      />
      
      <DownloadProgress
        progress={downloadProgress}
        fileName={currentFileName}
        show={isDownloading}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center shadow-sm">
          <div className="p-2 bg-red-100 rounded-full mr-3">
             <X className="w-5 h-5" />
          </div>
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-1 gap-6 mb-8">
        {/* Image to PDF Section */}
        {toolIsVisible('images_to_pdf') && (
        <div className={toolCardClass('images_to_pdf')}>
          {openTool === 'images_to_pdf' && (
            <button
              type="button"
              onClick={() => closeToolAndClear('images_to_pdf')}
              className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
              aria-label="Close"
              title="Clear & close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleTool('images_to_pdf')}
            aria-expanded={openTool === 'images_to_pdf'}
            className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'images_to_pdf' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('images_to_pdf')}`}
          >
            <div className="flex items-center">
              <span className="p-2 bg-blue-50 text-blue-500 rounded-lg mr-3">
                <ImageIcon className="w-6 h-6" />
              </span>
              <span className="text-xl font-bold text-slate-800">Images to PDF</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openTool === 'images_to_pdf' ? 'rotate-180' : ''}`} />
          </button>

          {openTool === 'images_to_pdf' && (
            <div className={`px-6 pb-6 ${toolInnerContainerClass('images_to_pdf')}`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              multiple
            />

            {imageItems.length === 0 ? (
              <label
                htmlFor="image-upload"
                className="group block w-full p-8 border-2 border-dashed border-slate-200 rounded-xl text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300"
              >
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-16 h-16 mx-auto mb-4 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <span className="block text-lg font-medium text-slate-700 mb-1 group-hover:text-blue-600">Upload images</span>
                <span className="text-sm text-slate-400">Preview first, then create PDF</span>
              </label>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-700">
                    {imageItems.length} image{imageItems.length === 1 ? '' : 's'} selected
                  </div>
                  <label
                    htmlFor="image-upload"
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-sm font-medium cursor-pointer transition-colors"
                  >
                    Add more
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {imageItems.map((item) => (
                    <div key={item.id} className="relative bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 h-28 flex items-center justify-center">
                        <img src={item.url} alt={item.file.name} className="max-h-28 w-full object-contain" />
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium text-slate-700 truncate">{item.file.name}</div>
                        {item.width > 0 && item.height > 0 && (
                          <div className="text-[11px] text-slate-500">{item.width}×{item.height}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImageItem(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={createPdfFromImages}
                    disabled={loading || imageItems.length === 0}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                    {loading ? 'Processing…' : 'Create PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={clearImageItems}
                    disabled={loading}
                    className="py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
        )}
      </div>

      <div className="contents">
        <div className="contents">
          <div className="grid md:grid-cols-1 gap-6 mb-8">
            {toolIsVisible('merge') && (
            <div className={toolCardClass('merge')}>
              {openTool === 'merge' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('merge')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('merge')}
                aria-expanded={openTool === 'merge'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'merge' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('merge')}`}
              >
                <div className="flex items-center">
                  <Merge className="w-5 h-5 mr-2 text-indigo-500" />
                  <span className="text-lg font-bold text-slate-800">Merge PDFs</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'merge' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'merge' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('merge')}`}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleMergePdfUpload}
                className="hidden"
                id="merge-pdf-upload"
                multiple
              />
              <label
                htmlFor="merge-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDFs
              </label>

              {mergePdfFiles.length > 0 && (
                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={clearMergePdfs}
                    disabled={loading}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Clear all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mt-4">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="pdf-list">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar"
                      >
                        {mergePdfFiles.map((pdf, index) => (
                          <Draggable key={pdf.id} draggableId={pdf.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50' : 'hover:shadow-md'
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="mr-3 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
                                  <GripVertical className="w-5 h-5 text-slate-400" />
                                </div>
                                <span className="flex-1 truncate font-medium text-slate-700 text-sm">{pdf.file.name}</span>
                                <button
                                  onClick={() => removePdf(pdf.id)}
                                  className="ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
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
              </div>

              <button
                onClick={handleMergePDFs}
                disabled={mergePdfFiles.length < 2 || loading}
                className="mt-4 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                type="button"
              >
                <Merge className="w-5 h-5" />
                Merge PDFs
              </button>
                </div>
              )}
            </div>
            )}

            {toolIsVisible('extract') && (
            <div className={toolCardClass('extract')}>
              {openTool === 'extract' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('extract')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('extract')}
                aria-expanded={openTool === 'extract'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'extract' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('extract')}`}
              >
                <div className="flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-emerald-500" />
                  <span className="text-lg font-bold text-slate-800">Extract Images</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'extract' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'extract' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('extract')}`}>

              <input
                type="file"
                accept=".pdf"
                onChange={handleExtractPdfUpload}
                className="hidden"
                id="extract-pdf-upload"
              />
              <label
                htmlFor="extract-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDF
              </label>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-slate-600 truncate flex-1">
                  {extractPdfFile ? extractPdfFile.name : 'No PDF selected'}
                </div>
                {extractPdfFile && (
                  <button
                    type="button"
                    onClick={clearExtractPdf}
                    disabled={loading || isPreparingExtract}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="radio"
                    name="extract-format"
                    checked={extractFormat === 'jpeg'}
                    onChange={() => setExtractFormat('jpeg')}
                    disabled={loading}
                  />
                  JPG
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="radio"
                    name="extract-format"
                    checked={extractFormat === 'png'}
                    onChange={() => setExtractFormat('png')}
                    disabled={loading}
                  />
                  PNG
                </label>
              </div>

              {extractPagePreviews.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      {extractSelectedCount}/{extractPagePreviews.length} pages selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAllExtractPagesSelected(true)}
                        disabled={loading}
                        className="px-2 py-1 rounded-md border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 bg-white"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllExtractPagesSelected(false)}
                        disabled={loading}
                        className="px-2 py-1 rounded-md border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 bg-white"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {extractPagePreviews.map((p) => (
                      <button
                        key={p.pageNum}
                        type="button"
                        onClick={() => toggleExtractPage(p.pageNum)}
                        className={`relative rounded-lg border overflow-hidden bg-slate-50 text-left transition-colors ${
                          p.selected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="absolute top-2 left-2 bg-white/90 border border-slate-200 rounded-md px-2 py-1 text-[11px] text-slate-700 flex items-center gap-2">
                          <input type="checkbox" checked={p.selected} readOnly />
                          <span>Page {p.pageNum}</span>
                        </div>
                        <img src={p.url} alt={`Page ${p.pageNum}`} className="w-full h-28 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleExtractImages}
                className="mt-4 w-full py-3 px-4 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                disabled={loading || !extractPdfFile || isPreparingExtract || extractSelectedCount === 0}
                type="button"
              >
                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-md group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                Extract
              </button>
                </div>
              )}
            </div>
            )}

            {toolIsVisible('compress') && (
            <div className={toolCardClass('compress')}>
              {openTool === 'compress' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('compress')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('compress')}
                aria-expanded={openTool === 'compress'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'compress' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('compress')}`}
              >
                <div className="flex items-center">
                  <FileDown className="w-5 h-5 mr-2 text-blue-500" />
                  <span className="text-lg font-bold text-slate-800">Compress PDF</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'compress' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'compress' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('compress')}`}>

              <input
                type="file"
                accept=".pdf"
                onChange={handleCompressPdfUpload}
                className="hidden"
                id="compress-pdf-upload"
              />
              <label
                htmlFor="compress-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDF
              </label>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-slate-600 truncate flex-1">
                  {compressPdfFile ? compressPdfFile.name : 'No PDF selected'}
                </div>
                {compressPdfFile && (
                  <button
                    type="button"
                    onClick={clearCompressPdf}
                    disabled={loading}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-600 flex items-center justify-between gap-2">
                <span>Original: {compressPdfFile ? `${(compressPdfFile.size / 1024 / 1024).toFixed(2)} MB` : '—'}</span>
                <span>
                  Output: {
                    compressResultBytes
                      ? `${(compressResultBytes / 1024 / 1024).toFixed(2)} MB`
                      : compressPdfFile
                        ? `~${(getTargetBytesForCompression(compressPdfFile.size) / 1024 / 1024).toFixed(2)} MB`
                        : '—'
                  }
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <select
                  value={compressPreset}
                  onChange={(e) => {
                    const preset = e.target.value as 'small' | 'balanced' | 'best';
                    setCompressPreset(preset);
                    setCompressLevel(getCompressLevelForPreset(preset));
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium"
                  disabled={loading}
                >
                  <option value="small">Small file</option>
                  <option value="balanced">Balanced</option>
                  <option value="best">Best quality</option>
                </select>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span className="font-medium">Compression level</span>
                  <span className="tabular-nums">{compressLevel}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={compressLevel}
                  onChange={(e) => setCompressLevel(e.target.valueAsNumber)}
                  disabled={loading}
                  className="mt-2 w-full"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={compressTargetEnabled}
                    onChange={(e) => setCompressTargetEnabled(e.target.checked)}
                    disabled={loading}
                  />
                  Target size
                </label>
                <input
                  type="number"
                  min={0.2}
                  step={0.1}
                  value={compressTargetMb}
                  onChange={(e) => setCompressTargetMb(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 2)}
                  disabled={loading || !compressTargetEnabled}
                  className="w-24 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium"
                />
                <div className="text-sm text-slate-600">MB</div>
              </div>

              <button
                type="button"
                onClick={handleCompressPdf}
                disabled={loading || !compressPdfFile}
                className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                {loading ? 'Processing…' : 'Compress PDF'}
              </button>
                </div>
              )}
            </div>
            )}

            {toolIsVisible('unlock') && (
            <div className={toolCardClass('unlock')}>
              {openTool === 'unlock' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('unlock')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('unlock')}
                aria-expanded={openTool === 'unlock'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'unlock' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('unlock')}`}
              >
                <div className="flex items-center">
                  <Unlock className="w-5 h-5 mr-2 text-amber-500" />
                  <span className="text-lg font-bold text-slate-800">Unlock PDF</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'unlock' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'unlock' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('unlock')}`}>

              <input
                type="file"
                accept=".pdf"
                onChange={handleUnlockPdfUpload}
                className="hidden"
                id="unlock-pdf-upload"
              />
              <label
                htmlFor="unlock-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-700 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDF
              </label>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-slate-600 truncate flex-1">
                  {unlockPdfFile ? unlockPdfFile.name : 'No PDF selected'}
                </div>
                {unlockPdfFile && (
                  <button
                    type="button"
                    onClick={clearUnlockPdf}
                    disabled={loading}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="password"
                placeholder="Password (if required)"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                disabled={loading}
                className="mt-3 w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium"
              />

              <button
                type="button"
                onClick={handleUnlockPdf}
                disabled={loading || !unlockPdfFile}
                className="mt-4 w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                {loading ? 'Processing…' : 'Unlock PDF'}
              </button>
                </div>
              )}
            </div>
            )}

            {toolIsVisible('lock') && (
            <div className={toolCardClass('lock')}>
              {openTool === 'lock' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('lock')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('lock')}
                aria-expanded={openTool === 'lock'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'lock' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('lock')}`}
              >
                <div className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-fuchsia-500" />
                  <span className="text-lg font-bold text-slate-800">Lock PDF</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'lock' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'lock' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('lock')}`}>

              <input
                type="file"
                accept=".pdf"
                onChange={handleLockPdfUpload}
                className="hidden"
                id="lock-pdf-upload"
              />
              <label
                htmlFor="lock-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-700 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDF
              </label>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-slate-600 truncate flex-1">
                  {lockPdfFile ? lockPdfFile.name : 'No PDF selected'}
                </div>
                {lockPdfFile && (
                  <button
                    type="button"
                    onClick={clearLockPdf}
                    disabled={loading}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="password"
                placeholder="Set password"
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                disabled={loading}
                className="mt-3 w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium"
              />

              <button
                type="button"
                onClick={handleLockPdf}
                disabled={loading || !lockPdfFile || !lockPassword.trim()}
                className="mt-4 w-full py-3 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-fuchsia-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Lock className="w-5 h-5" />
                Lock PDF
              </button>
                </div>
              )}
            </div>
            )}

            {toolIsVisible('organize') && (
            <div className={toolCardClass('organize')}>
              {openTool === 'organize' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('organize')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('organize')}
                aria-expanded={openTool === 'organize'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'organize' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('organize')}`}
              >
                <div className="flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-violet-500" />
                  <span className="text-lg font-bold text-slate-800">Organize PDF</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'organize' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'organize' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('organize')}`}>

              <input
                type="file"
                accept=".pdf"
                onChange={handleOrganizePdfUpload}
                className="hidden"
                id="organize-pdf-upload"
              />
              <label
                htmlFor="organize-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-400 hover:text-violet-700 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDF
              </label>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-slate-600 truncate flex-1">
                  {organizePdfFile ? organizePdfFile.name : 'No PDF selected'}
                </div>
                {organizePdfFile && (
                  <button
                    type="button"
                    onClick={clearOrganizePdf}
                    disabled={loading || isPreparingOrganize}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {organizePages.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      {organizeKeptCount}/{organizePages.length} pages kept
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAllOrganizeRemoved(false)}
                        disabled={loading}
                        className="px-2 py-1 rounded-md border border-slate-200 hover:border-violet-400 hover:text-violet-700 bg-white"
                      >
                        Keep all
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllOrganizeRemoved(true)}
                        disabled={loading}
                        className="px-2 py-1 rounded-md border border-slate-200 hover:border-violet-400 hover:text-violet-700 bg-white"
                      >
                        Remove all
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="organize-pages">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {organizePages.map((p, index) => (
                              <Draggable key={p.id} draggableId={p.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 rounded-lg border bg-white p-2 transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-violet-400 ring-opacity-40' : 'shadow-sm'
                                    } ${p.removed ? 'opacity-50' : ''}`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="p-1 rounded-md hover:bg-slate-50 text-slate-400 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="w-12 h-12 rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                                      <img
                                        src={p.url}
                                        alt={`Page ${p.pageNum}`}
                                        className="w-full h-full object-contain"
                                        style={{ transform: `rotate(${p.rotation}deg)` }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-slate-700 truncate">Page {p.pageNum}</div>
                                      <div className="text-xs text-slate-500 tabular-nums">Rotation: {p.rotation}°</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => rotateOrganizePage(p.id, -90)}
                                        disabled={loading}
                                        className="p-2 rounded-md hover:bg-slate-50 text-slate-600"
                                        title="Rotate left"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => rotateOrganizePage(p.id, 90)}
                                        disabled={loading}
                                        className="p-2 rounded-md hover:bg-slate-50 text-slate-600"
                                        title="Rotate right"
                                      >
                                        <RotateCw className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleOrganizeRemoved(p.id)}
                                        disabled={loading}
                                        className={`p-2 rounded-md hover:bg-slate-50 ${p.removed ? 'text-emerald-600' : 'text-red-600'}`}
                                        title={p.removed ? 'Restore page' : 'Remove page'}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleOrganizeExport}
                disabled={loading || !organizePdfFile || isPreparingOrganize || organizePages.length === 0 || organizeKeptCount === 0}
                className="mt-4 w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-violet-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                {loading ? 'Processing…' : 'Export PDF'}
              </button>
                </div>
              )}
            </div>
            )}

            {toolIsVisible('split') && (
            <div className={toolCardClass('split')}>
              {openTool === 'split' && (
                <button
                  type="button"
                  onClick={() => closeToolAndClear('split')}
                  className="absolute top-4 right-4 p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 z-20"
                  aria-label="Close"
                  title="Clear & close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleTool('split')}
                aria-expanded={openTool === 'split'}
                className={`w-full p-6 flex items-center justify-between text-left ${openTool === 'split' ? 'sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-10' : ''} ${toolInnerContainerClass('split')}`}
              >
                <div className="flex items-center">
                  <Scissors className="w-5 h-5 mr-2 text-teal-500" />
                  <span className="text-lg font-bold text-slate-800">Split PDF</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTool === 'split' ? 'rotate-180' : ''}`} />
              </button>

              {openTool === 'split' && (
                <div className={`px-6 pb-6 ${toolInnerContainerClass('split')}`}>

              <input
                type="file"
                accept=".pdf"
                onChange={handleSplitPdfUpload}
                className="hidden"
                id="split-pdf-upload"
              />
              <label
                htmlFor="split-pdf-upload"
                className="block w-full px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-700 text-sm font-medium cursor-pointer transition-colors text-center"
              >
                Upload PDF
              </label>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-slate-600 truncate flex-1">
                  {splitPdfFile ? splitPdfFile.name : 'No PDF selected'}
                </div>
                {splitPdfFile && (
                  <button
                    type="button"
                    onClick={clearSplitPdf}
                    disabled={loading}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="radio"
                    name="split-mode"
                    checked={splitMode === 'ranges'}
                    onChange={() => setSplitMode('ranges')}
                    disabled={loading}
                  />
                  Ranges
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="radio"
                    name="split-mode"
                    checked={splitMode === 'single'}
                    onChange={() => setSplitMode('single')}
                    disabled={loading}
                  />
                  Every page
                </label>
              </div>

              {splitMode === 'ranges' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Example: 1-3, 5, 7-9</span>
                    <span>{splitPageCount ? `${splitPageCount} pages` : '—'}</span>
                  </div>
                  <input
                    value={splitRangesText}
                    onChange={(e) => setSplitRangesText(e.target.value)}
                    disabled={loading || !splitPdfFile}
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium"
                    placeholder="1-3,5,7-9"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleSplitPdf}
                disabled={loading || !splitPdfFile}
                className="mt-4 w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-teal-200 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
                {loading ? 'Processing…' : 'Split PDF'}
              </button>
                </div>
              )}
            </div>
            )}
          </div>

          {previewPdfFile && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Preview</h3>
              <div className="relative border border-slate-200 rounded-xl overflow-auto bg-slate-100/50 flex justify-center min-h-[500px] p-8 custom-scrollbar">
                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
                      <span className="font-medium">Loading PDF viewer...</span>
                    </div>
                  }
                >
                  <Document
                    file={previewPdfFile}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    className="pdf-document shadow-2xl"
                  >
                    <div className="relative inline-block">
                      <Page
                        pageNumber={currentPage}
                        className="pdf-page"
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={pageWidth}
                      />
                    </div>
                  </Document>
                </Suspense>
              </div>

              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
                    type="button"
                  >
                    Previous
                  </button>
                  <span className="py-2 px-4 bg-slate-100 rounded-lg text-slate-600 font-mono text-sm">
                    Page {currentPage} / {numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage === numPages}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
                    type="button"
                  >
                    Next
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
