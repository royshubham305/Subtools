# SubTools (Web Tools Suite)

SubTools is a browser-based utility suite built with React + Vite. It provides image tools, a PDF editor, a resume builder, and a background remover. Most processing happens locally in the browser (no file uploads to a server).

## Live Pages (Routes)

- Home: `/`
- Image Resizer: `/resize`
- Image Compressor: `/compress`
- Resume Builder: `/resume`
- PDF Editor: `/pdf`
- Background Remover: `/remove-background`

## Tech Stack

- App framework: `react`, `react-dom`
- Build/dev: `vite`, `@vitejs/plugin-react`
- Routing: `react-router-dom`
- Styling: `tailwindcss`, `postcss`, `autoprefixer` (plus `src/index.css`)
- Icons: `lucide-react`

### File & Download Utilities

- Save files: `file-saver`
- Zip exports: `jszip`

### Image Tools

- Crop/resize UI: `cropperjs`
- Image compression: `compressorjs`

### Background Remover (AI, runs in browser)

- Background removal engine: `@imgly/background-removal`
- Model/data package: `@imgly/background-removal-data`
- Uses ONNX Runtime Web assets (WASM) copied into `public/models/`

### PDF Tools

- PDF generation and editing: `pdf-lib`
- PDF rendering (thumbnails/preview): `pdfjs-dist` + `react-pdf`
- Drag reorder UI: `@hello-pangea/dnd`
- WASM PDF utility: `@neslinesli93/qpdf-wasm`

### Resume Builder

- Render HTML to canvas: `html2canvas`
- Generate PDF: `jspdf`

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) (Recommended) Install background-removal models locally

The background remover is configured to load models from `public/models/`.

On Windows PowerShell:

```powershell
./install_models.ps1
```

This script:

- Builds `isnet.onnx` and `isnet_quint8.onnx` from chunk files shipped inside `@imgly/background-removal-data`
- Copies ONNX runtime WASM assets into `public/models/onnxruntime-web/`

### 3) Run the dev server

```bash
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

Vite outputs to `dist/`.

## Sitemap / Robots

Static files are in `public/` and are copied to `dist/` at build time:

- `public/sitemap.xml` → `/sitemap.xml`
- `public/robots.txt` → `/robots.txt`

Note: sitemap URLs are currently relative paths (e.g. `/pdf`). If you deploy to production and want absolute `<loc>` entries, update `public/sitemap.xml` to include your domain.

## Tool-by-Tool Overview (What each tool does)

## Image Resizer (`/resize`)

**What it does**

- Upload an image
- Crop and resize with common aspect ratios (1:1, 16:9, 9:16, etc.)
- Rotate, flip, reset, and download

**How it is built**

- `cropperjs` provides the interactive crop box and transformations.
- The app exports the cropped canvas and triggers download.

Key file: [src/components/ImageResizer.tsx](src/components/ImageResizer.tsx)

## Image Compressor (`/compress`)

**What it does**

- Upload an image
- Choose output format (e.g. JPG/PNG) and compression settings
- Optionally constrain max width/height
- Download a smaller image

**How it is built**

- Uses `compressorjs` to re-encode images with chosen quality/format.
- Includes a target-size approach (tries multiple compressions).

Key file: [src/components/ImageCompressor.tsx](src/components/ImageCompressor.tsx)

## Background Remover (`/remove-background`)

**What it does**

- Upload an image
- Remove background automatically (AI) and optionally clean edges
- Manual mode: brush erase/restore with undo/redo
- Export as PNG with transparency

**How it is built**

- Uses `@imgly/background-removal` (runs locally using WASM + ONNX models).
- Models are loaded from `/models/` (copied by `install_models.ps1`).
- Manual cleanup uses an HTML `<canvas>` with an undo/redo stack.

Key file: [src/components/BackgroundRemover.tsx](src/components/BackgroundRemover.tsx)

### Important: COOP/COEP headers for WASM threading

Some background removal runtimes work best (or only) when `crossOriginIsolated` is enabled.

In dev, `vite.config.ts` sets:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

If you deploy, ensure your host sends the same headers.

Key file: [vite.config.ts](vite.config.ts)

## PDF Editor (`/pdf`)

This page contains multiple PDF utilities. The UI is organized as separate sections; clicking a tool name expands it to a full-screen view.

### Images to PDF

- Upload images → preview → remove images → generate a single PDF
- Implementation: `pdf-lib` creates a new PDF and embeds images

### Merge PDFs

- Upload multiple PDFs → drag reorder → merge into one
- Implementation: `pdf-lib` loads each PDF and copies pages to a new output document
- Drag UI: `@hello-pangea/dnd`

### Extract Images

- Upload a PDF → render page thumbnails → select pages → export images
- Implementation:
  - `pdfjs-dist` renders pages to a canvas
  - Outputs JPG/PNG and packages results in a ZIP (`jszip`) when needed

### Compress PDF

- Upload a PDF → choose compression level/target size → export a smaller PDF
- Implementation uses a combination of PDF processing strategies inside the browser.

### Lock / Unlock PDF

- Unlock: remove password protection (requires correct password)
- Lock: add password protection to a PDF

### Organize PDF

- Upload PDF → thumbnails appear → reorder pages → rotate → remove/restore pages → export
- Implementation:
  - Thumbnails via `pdfjs-dist`
  - Output via `pdf-lib` (copies pages, applies rotation, skips removed pages)

### Split PDF

- Upload PDF → split by ranges (`1-3,5,7-9`) or split every page
- Output is a single PDF or a ZIP of PDFs depending on selection

Key file: [src/components/PdfEditor.tsx](src/components/PdfEditor.tsx)

## Resume Builder (`/resume`)

**What it does**

- Step-by-step resume form (Personal Info, Education, Experience, Projects, Skills, Certifications, Achievements)
- Preview step with multiple templates (Classic, Modern, Minimal, Bold)
- Download resume as PDF

**How it is built**

- The preview is a styled HTML layout.
- Export uses `html2canvas` to capture the preview and `jspdf` to create the PDF.

Key files:

- [src/components/ResumeMaker.tsx](src/components/ResumeMaker.tsx)
- [src/components/resume/ResumePreview.tsx](src/components/resume/ResumePreview.tsx)

## Project Structure

```text
public/
  models/                 # Background remover models + ONNX runtime assets
  robots.txt
  sitemap.xml
src/
  components/
    PdfEditor.tsx
    ResumeMaker.tsx
    BackgroundRemover.tsx
    ImageResizer.tsx
    ImageCompressor.tsx
    UploadProgress.tsx
    DownloadProgress.tsx
    resume/               # Resume form sections + preview templates
  App.tsx                 # Router + home page
  index.css               # Tailwind + custom component styles
  main.tsx
```

## Privacy / Security Notes

- This project is designed to run processing locally in the browser.
- For AI background removal, models are downloaded/loaded from your own site at `/models/`.
- For best compatibility with advanced WASM features, use COOP/COEP headers in production.

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run preview`: preview the production build
