import { useState, useEffect } from 'react';
import { getThumbnails, getPreviewThumbnails, downloadFile, formatFileSize } from '../services/api';
import type { ThumbnailData, FileResult } from '../types';

interface ReviewChangesProps {
  /** The original file uploaded by the user */
  originalFile: File;
  /** The result object from the API */
  result: FileResult;
  /** Title shown in the result header */
  title?: string;
  /** Callback when user clicks "Do More" */
  onReset: () => void;
  /** Extra info to show under the title */
  extraInfo?: React.ReactNode;
  /** Whether to show before/after comparison (only for PDF outputs) */
  showComparison?: boolean;
}

export default function ReviewChanges({
  originalFile,
  result,
  title = 'Operation Complete!',
  onReset,
  extraInfo,
  showComparison = true,
}: ReviewChangesProps) {
  const [beforeThumbs, setBeforeThumbs] = useState<ThumbnailData[]>([]);
  const [afterThumbs, setAfterThumbs] = useState<ThumbnailData[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [activeBeforePage, setActiveBeforePage] = useState(0);
  const [activeAfterPage, setActiveAfterPage] = useState(0);
  const isPdf = result.filename.endsWith('.pdf');

  useEffect(() => {
    if (!showComparison || !isPdf) return;

    const loadPreviews = async () => {
      setLoadingPreview(true);
      try {
        // Load before thumbnails from original file
        const before = await getThumbnails(originalFile, 300);
        setBeforeThumbs(before.thumbnails);

        // Load after thumbnails from result file
        const after = await getPreviewThumbnails(result.file_id, 300, 6);
        setAfterThumbs(after.thumbnails);
      } catch {
        // Preview failed silently — download still works
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreviews();
  }, [originalFile, result.file_id, showComparison, isPdf]);

  const hasPreview = beforeThumbs.length > 0 || afterThumbs.length > 0;

  return (
    <div className="mt-6 space-y-6 animate-slide-up">
      {/* Success header */}
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-accent-emerald)]/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[var(--color-accent-emerald)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-[var(--color-dark-300)] mb-1">
          {result.filename} • {formatFileSize(result.size)}
        </p>
        {extraInfo && <div className="mb-4">{extraInfo}</div>}
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => downloadFile(result.file_id, result.filename)}
            className="btn-primary"
          >
            ⬇ Download {result.filename}
          </button>
          <button onClick={onReset} className="btn-secondary">
            Process More
          </button>
        </div>
      </div>

      {/* Before/After Preview */}
      {showComparison && isPdf && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-dark-600)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white m-0">
              📋 Review Changes
            </h3>
            {hasPreview && (
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'side-by-side'
                      ? 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]'
                      : 'text-[var(--color-dark-400)] hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setViewMode('slider')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'slider'
                      ? 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]'
                      : 'text-[var(--color-dark-400)] hover:text-white'
                  }`}
                >
                  Carousel
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {loadingPreview && (
              <div className="flex items-center justify-center py-12 gap-3">
                <div className="w-5 h-5 border-2 border-[var(--color-accent-cyan)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--color-dark-300)]">Loading preview...</span>
              </div>
            )}

            {!loadingPreview && !hasPreview && (
              <div className="text-center py-8 text-sm text-[var(--color-dark-400)]">
                Preview not available
              </div>
            )}

            {!loadingPreview && hasPreview && viewMode === 'side-by-side' && (
              <div className="grid grid-cols-2 gap-6">
                {/* Before */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-semibold text-[var(--color-dark-300)] uppercase tracking-wider">
                      Before
                    </span>
                    <span className="text-xs text-[var(--color-dark-400)]">
                      ({formatFileSize(originalFile.size)})
                    </span>
                  </div>
                  {beforeThumbs.length > 0 && (
                    <div>
                      <div className="rounded-xl overflow-hidden bg-white/5 border border-[var(--color-dark-500)] mb-2">
                        <img
                          src={beforeThumbs[activeBeforePage]?.data}
                          alt={`Before - Page ${activeBeforePage + 1}`}
                          className="w-full object-contain max-h-[400px]"
                        />
                      </div>
                      {beforeThumbs.length > 1 && (
                        <div className="flex gap-1.5 justify-center flex-wrap">
                          {beforeThumbs.map((_, i) => (
                            <button
                              key={`b-${i}`}
                              onClick={() => setActiveBeforePage(i)}
                              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                                activeBeforePage === i
                                  ? 'bg-red-400/20 text-red-400 border border-red-400/30'
                                  : 'bg-[var(--color-dark-700)] text-[var(--color-dark-400)] border border-transparent hover:border-[var(--color-dark-400)]'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* After */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-emerald)]" />
                    <span className="text-xs font-semibold text-[var(--color-dark-300)] uppercase tracking-wider">
                      After
                    </span>
                    <span className="text-xs text-[var(--color-dark-400)]">
                      ({formatFileSize(result.size)})
                    </span>
                  </div>
                  {afterThumbs.length > 0 && (
                    <div>
                      <div className="rounded-xl overflow-hidden bg-white/5 border border-[var(--color-accent-emerald)]/20 mb-2">
                        <img
                          src={afterThumbs[activeAfterPage]?.data}
                          alt={`After - Page ${activeAfterPage + 1}`}
                          className="w-full object-contain max-h-[400px]"
                        />
                      </div>
                      {afterThumbs.length > 1 && (
                        <div className="flex gap-1.5 justify-center flex-wrap">
                          {afterThumbs.map((_, i) => (
                            <button
                              key={`a-${i}`}
                              onClick={() => setActiveAfterPage(i)}
                              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                                activeAfterPage === i
                                  ? 'bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)] border border-[var(--color-accent-emerald)]/30'
                                  : 'bg-[var(--color-dark-700)] text-[var(--color-dark-400)] border border-transparent hover:border-[var(--color-dark-400)]'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loadingPreview && hasPreview && viewMode === 'slider' && (
              <div>
                {/* Thumbnail strips */}
                <div className="space-y-4">
                  {/* Before strip */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs font-semibold text-[var(--color-dark-300)] uppercase tracking-wider">
                        Before ({beforeThumbs.length} pages)
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {beforeThumbs.map((thumb) => (
                        <div
                          key={`bs-${thumb.page}`}
                          className="flex-shrink-0 w-24 rounded-lg overflow-hidden bg-white/5 border border-[var(--color-dark-500)]"
                        >
                          <img
                            src={thumb.data}
                            alt={`Before P${thumb.page}`}
                            className="w-full object-contain"
                          />
                          <div className="text-center py-1 text-[10px] text-[var(--color-dark-400)]">
                            P{thumb.page}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent-cyan)]/10 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[var(--color-accent-cyan)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  {/* After strip */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-accent-emerald)]" />
                      <span className="text-xs font-semibold text-[var(--color-dark-300)] uppercase tracking-wider">
                        After ({afterThumbs.length} pages)
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {afterThumbs.map((thumb) => (
                        <div
                          key={`as-${thumb.page}`}
                          className="flex-shrink-0 w-24 rounded-lg overflow-hidden bg-white/5 border border-[var(--color-accent-emerald)]/20"
                        >
                          <img
                            src={thumb.data}
                            alt={`After P${thumb.page}`}
                            className="w-full object-contain"
                          />
                          <div className="text-center py-1 text-[10px] text-[var(--color-dark-400)]">
                            P{thumb.page}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
