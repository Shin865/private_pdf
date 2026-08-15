import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import PageThumbnail from '../components/PageThumbnail';
import { getThumbnails, splitPdf, downloadFile, formatFileSize } from '../services/api';
import type { ThumbnailData, SplitResult } from '../types';

export default function Split() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [error, setError] = useState('');
  const [splitMode, setSplitMode] = useState<'range' | 'each'>('range');
  const [rangeInput, setRangeInput] = useState('');

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError('');

    setLoadingThumbs(true);
    try {
      const thumbs = await getThumbnails(f);
      setThumbnails(thumbs.thumbnails);
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF');
    } finally {
      setLoadingThumbs(false);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      let ranges: [number, number][];

      if (splitMode === 'each') {
        // Split each page into separate PDF
        ranges = thumbnails.map((_, i) => [i + 1, i + 1] as [number, number]);
      } else {
        // Parse range input: "1-3, 4-6, 7-10"
        ranges = rangeInput.split(',').map((r) => {
          const parts = r.trim().split('-');
          if (parts.length === 1) {
            const p = parseInt(parts[0]);
            return [p, p] as [number, number];
          }
          return [parseInt(parts[0]), parseInt(parts[1])] as [number, number];
        });
      }

      const res = await splitPdf(file, ranges);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Split failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setResult(null);
    setError('');
    setRangeInput('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.3))' }}>
            ✂️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Split PDF</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Separate PDF into multiple files</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          multiple={false}
          label="Drop a PDF file here to split"
          description="Select a PDF file to separate into multiple files"
        />
      )}

      {/* Loading Thumbnails */}
      {loadingThumbs && (
        <div className="mt-6">
          <ProgressBar progress={50} label="Loading PDF pages..." />
        </div>
      )}

      {/* Thumbnails + Controls */}
      {file && thumbnails.length > 0 && !result && (
        <div className="mt-6 space-y-6">
          {/* File Info */}
          <div className="glass rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white m-0">{file.name}</p>
                <p className="text-xs text-[var(--color-dark-400)] m-0">{thumbnails.length} pages • {formatFileSize(file.size)}</p>
              </div>
            </div>
            <button onClick={handleReset} className="text-xs text-[var(--color-dark-300)] hover:text-white transition-colors">
              Change file
            </button>
          </div>

          {/* Page Thumbnails */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">PDF Pages</h3>
            <div className="thumbnail-grid">
              {thumbnails.map((thumb) => (
                <PageThumbnail key={thumb.page} thumbnail={thumb} showControls={false} />
              ))}
            </div>
          </div>

          {/* Split Options */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Split Mode</h3>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setSplitMode('each')}
                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                  splitMode === 'each'
                    ? 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet)] border border-[var(--color-accent-violet)]/30'
                    : 'bg-[var(--color-dark-700)] text-[var(--color-dark-300)] border border-transparent hover:border-[var(--color-dark-400)]'
                }`}
              >
                Every page separately
              </button>
              <button
                onClick={() => setSplitMode('range')}
                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                  splitMode === 'range'
                    ? 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet)] border border-[var(--color-accent-violet)]/30'
                    : 'bg-[var(--color-dark-700)] text-[var(--color-dark-300)] border border-transparent hover:border-[var(--color-dark-400)]'
                }`}
              >
                Custom ranges
              </button>
            </div>

            {splitMode === 'range' && (
              <div className="mb-4">
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">
                  Page ranges (e.g., 1-3, 4-6, 7-10)
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="1-3, 4-6, 7-10"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] text-white text-sm focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                />
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            {loading && <ProgressBar progress={50} label="Splitting PDF..." />}
            <button onClick={handleSplit} disabled={loading || (splitMode === 'range' && !rangeInput)} className="btn-primary w-full mt-2">
              {loading ? 'Splitting...' : 'Split PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 glass rounded-2xl p-8 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-accent-emerald)]/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--color-accent-emerald)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Split Complete!</h3>
            <p className="text-sm text-[var(--color-dark-300)]">{result.files.length} files created</p>
          </div>

          <div className="space-y-2 mb-6">
            {result.files.map((f) => (
              <div key={f.file_id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-dark-700)]">
                <div>
                  <p className="text-sm font-medium text-white m-0">{f.filename}</p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0">{formatFileSize(f.size)}</p>
                </div>
                <button
                  onClick={() => downloadFile(f.file_id, f.filename)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  ⬇ Download
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleReset} className="btn-secondary w-full">Split Another PDF</button>
        </div>
      )}
    </div>
  );
}
