import React from 'react';
import { Download } from 'lucide-react';

interface DownloadProgressProps {
  progress: number;
  fileName: string;
  show: boolean;
}

export default function DownloadProgress({ progress, fileName, show }: DownloadProgressProps) {
  if (!show) return null;

  return (
    <div className="upload-progress-overlay">
      <div className="upload-progress-card">
        <div className="flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-blue-600 animate-bounce" />
        </div>
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {progress === 100 ? 'Finishing up...' : 'Downloading...'}
          </h3>
          <p className="text-sm text-gray-600">{fileName}</p>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center mt-2 text-sm text-gray-600">
          {progress}% Complete
        </p>
      </div>
    </div>
  );
}