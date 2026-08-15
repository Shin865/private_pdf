import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import { mergePdfs, downloadFile, formatFileSize } from '../services/api';
import type { FileResult } from '../types';

export default function Merge() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FileResult | null>(null);
  const [error, setError] = useState('');

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFiles.length) return;
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('At least 2 PDF files are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await mergePdfs(files);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Merge failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadFile(result.file_id, result.filename);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))' }}>
            📄
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Merge PDF</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Combine multiple PDF files into one document</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {!result && (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          multiple={true}
          maxFiles={20}
          label="Drop PDF files here to merge"
          description="Select multiple PDF files to combine"
        />
      )}

      {/* File List */}
      {files.length > 0 && !result && (
        <div className="mt-6 glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-dark-600)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white m-0">{files.length} files selected</h3>
              <button onClick={handleReset} className="text-xs text-[var(--color-dark-300)] hover:text-white transition-colors">
                Clear all
              </button>
            </div>
          </div>

          <div className="divide-y divide-[var(--color-dark-600)]">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-4 p-4 hover:bg-[var(--color-dark-700)]/50 transition-colors">
                {/* Drag Handle */}
                <div className="text-[var(--color-dark-400)] cursor-grab">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                  </svg>
                </div>

                {/* File Icon */}
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate m-0">{file.name}</p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0">{formatFileSize(file.size)}</p>
                </div>

                {/* Move Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-dark-600)] disabled:opacity-30 transition-colors text-[var(--color-dark-300)]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-dark-600)] disabled:opacity-30 transition-colors text-[var(--color-dark-300)]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-[var(--color-dark-400)] hover:text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Merge Button */}
          <div className="p-4 border-t border-[var(--color-dark-600)]">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            {loading && <ProgressBar progress={50} label="Merging PDFs..." />}
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Merging...' : `Merge ${files.length} PDF Files`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 glass rounded-2xl p-8 text-center animate-slide-up">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-accent-emerald)]/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--color-accent-emerald)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Merge Complete!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">
            {files.length} files merged • {formatFileSize(result.size)}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleDownload} className="btn-primary">
              ⬇ Download PDF
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Merge More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
