import { Download } from 'lucide-react';

interface DownloadProgressProps {
  progress: number;
  fileName: string;
  show: boolean;
}

export default function DownloadProgress({ progress, fileName, show }: DownloadProgressProps) {
  if (!show) return null;

  return (
    <div className="upload-progress-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div className="upload-progress-card">
        <div className="flex items-center justify-center">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <Download className="w-7 h-7 text-white animate-bounce" />
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {progress >= 100 ? 'Finishing…' : 'Preparing download…'}
          </h3>
          <p className="mt-1 text-sm text-gray-600 truncate max-w-[16rem] mx-auto">{fileName}</p>
        </div>

        <div className="mt-5">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <span>{Math.min(100, Math.max(0, Math.round(progress)))}%</span>
            <span>Generating PNG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
