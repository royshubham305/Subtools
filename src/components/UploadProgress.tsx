import React from 'react';
import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  show: boolean;
}

export default function UploadProgress({ progress, fileName, show }: UploadProgressProps) {
  if (!show) return null;

  return (
    <div className="upload-progress-overlay">
      <div className="upload-progress-card">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {progress === 100 ? 'Processing...' : 'Uploading...'}
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