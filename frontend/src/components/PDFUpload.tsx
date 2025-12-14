'use client';

import React, { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';

interface PDFUploadProps {
  onUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
}

export default function PDFUpload({ onUpload, isProcessing }: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    await onUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        className={`border-dashed border-2 border-zinc-300 rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-medical-primary bg-teal-50/30 shadow-lg ring-2 ring-teal-500/20'
            : 'hover:border-teal-500 hover:bg-teal-50/30'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />

        {selectedFile ? (
          <div className="space-y-2">
            <FileUp className="w-12 h-12 mx-auto text-medical-primary mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium text-zinc-700">{selectedFile.name}</p>
            <p className="text-xs text-zinc-500">{formatFileSize(selectedFile.size)}</p>
            {!isProcessing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="mt-2 text-xs text-red-600 hover:text-red-700"
                type="button"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <FileUp className="w-12 h-12 mx-auto text-zinc-400 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium text-zinc-700">
              {isProcessing ? 'Processing...' : 'Drag & drop your PDF here'}
            </p>
            <p className="text-xs text-zinc-500">
              or click to browse
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              PDF files only • Max 10MB
            </p>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-medical-primary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-medical-primary"></div>
          <span className="text-sm">Processing PDF...</span>
        </div>
      )}
    </div>
  );
}
