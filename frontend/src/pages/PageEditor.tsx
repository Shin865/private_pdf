import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import PageThumbnail from '../components/PageThumbnail';
import { getThumbnails, deletePages, extractPages, reorderPages, downloadFile, formatFileSize } from '../services/api';
import type { ThumbnailData, FileResult } from '../types';

type EditorMode = 'delete' | 'extract' | 'reorder';

export default function PageEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [mode, setMode] = useState<EditorMode>('delete');
  const [loading, setLoading] = useState(false);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [result, setResult] = useState<FileResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError('');
    setSelectedPages(new Set());

    setLoadingThumbs(true);
    try {
      const thumbs = await getThumbnails(f);
      setThumbnails(thumbs.thumbnails);
      setPageOrder(thumbs.thumbnails.map((t) => t.page));
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

  const movePage = (currentIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...pageOrder];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    setPageOrder(newOrder);
  };

  const handleApply = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      let res: FileResult;
      const selected = Array.from(selectedPages).sort((a, b) => a - b);

      switch (mode) {
        case 'delete':
          if (selected.length === 0) {
            setError('Select pages to delete');
            setLoading(false);
            return;
          }
          if (selected.length >= thumbnails.length) {
            setError('Cannot delete all pages');
            setLoading(false);
            return;
          }
          res = await deletePages(file, selected);
          break;

        case 'extract':
          if (selected.length === 0) {
            setError('Select pages to extract');
            setLoading(false);
            return;
          }
          res = await extractPages(file, selected);
          break;

        case 'reorder':
          const isChanged = pageOrder.some((p, i) => p !== i + 1);
          if (!isChanged) {
            setError('Page order has not changed');
            setLoading(false);
            return;
          }
          res = await reorderPages(file, pageOrder);
          break;

        default:
          setLoading(false);
          return;
      }

      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setSelectedPages(new Set());
    setPageOrder([]);
    setResult(null);
    setError('');
  };

  const modes: { value: EditorMode; label: string; icon: string; desc: string }[] = [
    { value: 'delete', label: 'Delete Pages', icon: '🗑️', desc: 'Remove selected pages' },
    { value: 'extract', label: 'Extract Pages', icon: '📤', desc: 'Save selected pages as new PDF' },
    { value: 'reorder', label: 'Reorder Pages', icon: '↕️', desc: 'Change page order' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.3))' }}>
            📑
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Page Editor</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Delete, extract, and reorder pages</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          multiple={false}
          label="Drop a PDF file here to edit pages"
        />
      )}

      {loadingThumbs && (
        <div className="mt-6">
          <ProgressBar progress={50} label="Loading PDF pages..." />
        </div>
      )}

      {/* Editor */}
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

          {/* Mode Selection */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Operation Mode</h3>
            <div className="grid grid-cols-3 gap-3">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    mode === m.value
                      ? 'bg-[var(--color-accent-pink)]/20 border border-[var(--color-accent-pink)]/30'
                      : 'bg-[var(--color-dark-700)] border border-transparent hover:border-[var(--color-dark-400)]'
                  }`}
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <p className={`text-sm font-medium m-0 ${mode === m.value ? 'text-[var(--color-accent-pink)]' : 'text-white'}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Page Grid for delete/extract mode */}
          {(mode === 'delete' || mode === 'extract') && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white m-0">
                  Select pages to {mode} ({selectedPages.size} selected)
                </h3>
                <button onClick={selectAll} className="btn-secondary text-xs py-1.5 px-3">
                  {selectedPages.size === thumbnails.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="thumbnail-grid">
                {thumbnails.map((thumb) => (
                  <PageThumbnail
                    key={thumb.page}
                    thumbnail={thumb}
                    selected={selectedPages.has(thumb.page)}
                    onSelect={togglePage}
                    showControls={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reorder List */}
          {mode === 'reorder' && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Drag pages to reorder (or use arrows)
              </h3>
              <div className="space-y-2">
                {pageOrder.map((pageNum, index) => {
                  const thumb = thumbnails.find((t) => t.page === pageNum);
                  return (
                    <div
                      key={`reorder-${pageNum}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-dark-700)] hover:bg-[var(--color-dark-600)] transition-colors"
                    >
                      {/* Drag Handle */}
                      <div className="text-[var(--color-dark-400)] cursor-grab">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                        </svg>
                      </div>

                      {/* Mini Thumbnail */}
                      {thumb && (
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <img src={thumb.data} alt={`Page ${pageNum}`} className="w-full h-full object-contain" />
                        </div>
                      )}

                      {/* Page Info */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white m-0">Page {pageNum}</p>
                        <p className="text-xs text-[var(--color-dark-400)] m-0">Position: {index + 1}</p>
                      </div>

                      {/* Move Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => movePage(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-dark-500)] disabled:opacity-30 transition-colors text-[var(--color-dark-300)]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => movePage(index, 'down')}
                          disabled={index === pageOrder.length - 1}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-dark-500)] disabled:opacity-30 transition-colors text-[var(--color-dark-300)]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Apply */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            {loading && <ProgressBar progress={60} label="Processing..." />}
            <button onClick={handleApply} disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Processing...' : `Apply — ${modes.find((m) => m.value === mode)?.label}`}
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
          <h3 className="text-lg font-semibold text-white mb-1">Done!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">{formatFileSize(result.size)}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => downloadFile(result.file_id, result.filename)} className="btn-primary">
              ⬇ Download PDF
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Edit Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
