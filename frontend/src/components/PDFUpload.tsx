'use client';

import React, { useState, useRef, useCallback } from 'react';

interface UploadResult {
  success: boolean;
  blobUrl?: string;
  blobId?: string;
  fileName?: string;
  size?: number;
  error?: string;
}

interface PDFUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

export default function PDFUpload({ 
  onUploadComplete, 
  onUploadStart,
  disabled = false 
}: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('pdf')) {
      return 'Please upload a PDF file';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', `session-${Date.now()}`);

      setUploadProgress(30);

      const response = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      onUploadComplete({
        success: true,
        blobUrl: result.blobUrl,
        blobId: result.blobId,
        fileName: result.fileName,
        size: result.size,
      });

    } catch (error) {
      onUploadComplete({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        onUploadComplete({ success: false, error });
        return;
      }
      setSelectedFile(file);
      uploadFile(file);
    }
  }, [disabled, isUploading, onUploadComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        onUploadComplete({ success: false, error });
        return;
      }
      setSelectedFile(file);
      uploadFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-emerald-400 bg-emerald-50/50 scale-[1.02]' 
            : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
          }
          ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <svg className="animate-spin w-full h-full text-emerald-500" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" cy="12" r="10" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="none" 
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-slate-700 font-medium">Uploading {selectedFile?.name}...</p>
              <div className="w-64 mx-auto h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {isDragging ? 'Drop your medical bill here' : 'Upload Medical Bill'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Drag and drop a PDF, or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-2">
                PDF files up to 10MB
              </p>
            </div>
          </div>
        )}

        {/* Decorative gradient border on hover */}
        <div className={`
          absolute inset-0 rounded-2xl pointer-events-none
          bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400
          opacity-0 transition-opacity duration-300
          ${isDragging ? 'opacity-20' : 'group-hover:opacity-10'}
        `} />
      </div>
    </div>
  );
}

