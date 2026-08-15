import { useState } from 'react';
import type { ThumbnailData } from '../types';

interface PageThumbnailProps {
  thumbnail: ThumbnailData;
  selected?: boolean;
  rotation?: number;
  onSelect?: (page: number) => void;
  onRotate?: (page: number, angle: number) => void;
  onDelete?: (page: number) => void;
  showControls?: boolean;
  dragHandleProps?: any;
}

export default function PageThumbnail({
  thumbnail,
  selected = false,
  rotation = 0,
  onSelect,
  onRotate,
  onDelete,
  showControls = true,
  dragHandleProps,
}: PageThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`thumbnail-item group relative bg-[var(--color-dark-700)] rounded-xl overflow-hidden ${
        selected ? 'selected ring-2 ring-[var(--color-accent-violet)]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(thumbnail.page)}
    >
      {/* Drag Handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-1 left-1 z-10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <svg className="w-4 h-4 text-[var(--color-dark-200)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      )}

      {/* Page Image */}
      <div className="aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
        <img
          src={thumbnail.data}
          alt={`Page ${thumbnail.page}`}
          className="w-full h-full object-contain"
          style={{ transform: `rotate(${rotation}deg)` }}
          draggable={false}
        />
      </div>

      {/* Page Number Badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <span className="text-xs font-medium text-white">Page {thumbnail.page}</span>
      </div>

      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-2 right-2 z-10">
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              selected
                ? 'bg-[var(--color-accent-violet)] border-[var(--color-accent-violet)]'
                : 'border-[var(--color-dark-300)] bg-black/30 opacity-0 group-hover:opacity-100'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && isHovered && (onRotate || onDelete) && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRotate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(thumbnail.page, 90);
              }}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
              title="Rotate 90°"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(thumbnail.page);
              }}
              className="p-1.5 rounded-lg bg-red-500/60 hover:bg-red-500/80 text-white transition-colors"
              title="Delete page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
