import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  show: boolean;
  label?: string;
}

export default function UploadProgress({ progress, fileName, show, label }: UploadProgressProps) {
  if (!show) return null;

  return (
    <div className="upload-progress-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div className="upload-progress-card">
        <div className="flex items-center justify-center">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {progress >= 100 ? 'Processing…' : 'Preparing…'}
          </h3>
          <p className="mt-1 text-sm text-gray-600 truncate max-w-[16rem] mx-auto">{fileName}</p>
        </div>

        <div className="mt-5">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <span>{Math.min(100, Math.max(0, Math.round(progress)))}%</span>
            <span>{label ?? 'Uploading'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
