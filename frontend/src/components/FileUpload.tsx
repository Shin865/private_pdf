import React, { useCallback, useState, useRef } from 'react';
import { formatFileSize } from '../services/api';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  description?: string;
}

export default function FileUpload({
  onFilesSelected,
  accept = '.pdf',
  multiple = false,
  maxFiles = 20,
  label = 'Drop your files here',
  description = 'or click to browse',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const limited = multiple ? files.slice(0, maxFiles) : [files[0]];
      if (limited.length > 0) {
        onFilesSelected(limited);
      }
    },
    [onFilesSelected, multiple, maxFiles]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const limited = multiple ? files.slice(0, maxFiles) : [files[0]];
    if (limited.length > 0) {
      onFilesSelected(limited);
    }
    // Reset to allow re-uploading same file
    e.target.value = '';
  };

  return (
    <div
      className={`drop-zone rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragging ? 'active' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Icon */}
      <div className="mb-6">
        <div
          className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging
              ? 'bg-[var(--color-accent-cyan)]/20 scale-110'
              : 'bg-[var(--color-dark-600)]'
          }`}
        >
          <svg
            className={`w-10 h-10 transition-colors duration-300 ${
              isDragging ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-dark-300)]'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-[var(--color-dark-100)] mb-2">{label}</h3>
      <p className="text-sm text-[var(--color-dark-300)] mb-4">{description}</p>

      <button
        type="button"
        className="btn-secondary text-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        Browse Files
      </button>

      <p className="text-xs text-[var(--color-dark-400)] mt-4">
        Accepted: {accept} • Max: 500 MB
        {multiple && ` • Up to ${maxFiles} files`}
      </p>
    </div>
  );
}
