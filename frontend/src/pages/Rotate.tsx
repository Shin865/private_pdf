import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import PageThumbnail from '../components/PageThumbnail';
import { getThumbnails, rotatePages, downloadFile, formatFileSize } from '../services/api';
import type { ThumbnailData, FileResult } from '../types';

export default function Rotate() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [result, setResult] = useState<FileResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError('');
    setRotations({});
    setSelectedPages(new Set());

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

  const togglePage = (page: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPages.size === thumbnails.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(thumbnails.map((t) => t.page)));
    }
  };

  const rotatePage = (page: number, angle: number) => {
    setRotations((prev) => ({
      ...prev,
      [page]: ((prev[page] || 0) + angle) % 360,
    }));
  };

  const rotateSelected = (angle: number) => {
    const pages = selectedPages.size > 0 ? selectedPages : new Set(thumbnails.map((t) => t.page));
    setRotations((prev) => {
      const next = { ...prev };
      pages.forEach((p) => {
        next[p] = ((next[p] || 0) + angle) % 360;
      });
      return next;
    });
  };

  const handleApply = async () => {
    if (!file) return;

    // Find pages that have rotation
    const rotatedEntries = Object.entries(rotations).filter(([, angle]) => angle !== 0);
    if (rotatedEntries.length === 0) {
      setError('No pages have been rotated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Group by angle and make multiple calls, or handle all at once
      // For simplicity, apply per-angle groups
      let currentFile = file;
      const angleGroups: Record<number, number[]> = {};

      for (const [page, angle] of rotatedEntries) {
        if (!angleGroups[angle]) angleGroups[angle] = [];
        angleGroups[angle].push(parseInt(page));
      }

      let res: FileResult | null = null;
      for (const [angle, pages] of Object.entries(angleGroups)) {
        res = await rotatePages(currentFile, pages, parseInt(angle));
      }

      if (res) setResult(res);
    } catch (e: any) {
      setError(e.message || 'Rotation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setRotations({});
    setSelectedPages(new Set());
    setResult(null);
    setError('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.3))' }}>
            🔄
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Rotate PDF</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Rotate pages by 90°, 180°, or 270°</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          multiple={false}
          label="Drop a PDF file here to rotate pages"
        />
      )}

      {/* Loading */}
      {loadingThumbs && (
        <div className="mt-6">
          <ProgressBar progress={50} label="Loading PDF pages..." />
        </div>
      )}

      {/* Editor */}
      {file && thumbnails.length > 0 && !result && (
        <div className="mt-6 space-y-6">
          {/* File Info + Toolbar */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white m-0">{file.name}</p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0">{thumbnails.length} pages</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="btn-secondary text-xs py-1.5 px-3">
                  {selectedPages.size === thumbnails.length ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => rotateSelected(90)} className="btn-secondary text-xs py-1.5 px-3">
                  ↻ 90°
                </button>
                <button onClick={() => rotateSelected(180)} className="btn-secondary text-xs py-1.5 px-3">
                  ↻ 180°
                </button>
                <button onClick={() => rotateSelected(270)} className="btn-secondary text-xs py-1.5 px-3">
                  ↻ 270°
                </button>
                <button onClick={handleReset} className="text-xs text-[var(--color-dark-300)] hover:text-white transition-colors ml-2">
                  Change file
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Click pages to select, then use rotation buttons above — or rotate individual pages
            </h3>
            <div className="thumbnail-grid">
              {thumbnails.map((thumb) => (
                <PageThumbnail
                  key={thumb.page}
                  thumbnail={thumb}
                  selected={selectedPages.has(thumb.page)}
                  rotation={rotations[thumb.page] || 0}
                  onSelect={togglePage}
                  onRotate={rotatePage}
                  showControls={true}
                />
              ))}
            </div>
          </div>

          {/* Apply */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            {loading && <ProgressBar progress={60} label="Applying rotations..." />}
            <button
              onClick={handleApply}
              disabled={loading || Object.values(rotations).every((v) => v === 0)}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Applying...' : 'Apply Rotations'}
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
          <h3 className="text-lg font-semibold text-white mb-1">Rotation Applied!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">{formatFileSize(result.size)}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => downloadFile(result.file_id, result.filename)} className="btn-primary">
              ⬇ Download PDF
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Rotate Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
