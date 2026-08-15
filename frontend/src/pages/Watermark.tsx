import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import { addWatermark, downloadFile, formatFileSize } from '../services/api';
import type { FileResult } from '../types';

export default function Watermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(50);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState('center');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FileResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError('');
  };

  const handleApply = async () => {
    if (!file || !text.trim()) {
      setError('Please provide a watermark text');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await addWatermark(file, text, { opacity, fontSize, rotation, position });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to add watermark');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  const positions = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.3))' }}>
            💧
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Watermark</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Add text watermark to PDF pages</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          multiple={false}
          label="Drop a PDF file here to add watermark"
        />
      )}

      {/* Settings */}
      {file && !result && (
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
                <p className="text-xs text-[var(--color-dark-400)] m-0">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button onClick={handleReset} className="text-xs text-[var(--color-dark-300)] hover:text-white transition-colors">
              Change file
            </button>
          </div>

          {/* Watermark Settings */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Watermark Settings</h3>

            <div className="space-y-5">
              {/* Text */}
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">Watermark Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter watermark text"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] text-white text-sm focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">Position</label>
                <div className="flex flex-wrap gap-2">
                  {positions.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPosition(p.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        position === p.value
                          ? 'bg-[var(--color-accent-rose)]/20 text-[var(--color-accent-rose)] border border-[var(--color-accent-rose)]/30'
                          : 'bg-[var(--color-dark-700)] text-[var(--color-dark-300)] border border-transparent'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-accent-rose)]"
                />
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">
                  Font Size: {fontSize}pt
                </label>
                <input
                  type="range"
                  min={10}
                  max={150}
                  step={5}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-accent-rose)]"
                />
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-accent-rose)]"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-8 rounded-xl bg-white/5 border border-[var(--color-dark-500)] relative overflow-hidden">
              <div className="text-center text-[var(--color-dark-400)] text-xs mb-2">Preview</div>
              <div className="flex items-center justify-center h-40">
                <span
                  className="text-[var(--color-dark-300)] font-bold whitespace-nowrap"
                  style={{
                    fontSize: `${Math.min(fontSize / 2, 40)}px`,
                    opacity: opacity,
                    transform: `rotate(-${rotation}deg)`,
                  }}
                >
                  {text || 'Watermark'}
                </span>
              </div>
            </div>
          </div>

          {/* Apply */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            {loading && <ProgressBar progress={60} label="Adding watermark..." />}
            <button onClick={handleApply} disabled={loading || !text.trim()} className="btn-primary w-full mt-2">
              {loading ? 'Applying...' : 'Add Watermark'}
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
          <h3 className="text-lg font-semibold text-white mb-1">Watermark Added!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">{formatFileSize(result.size)}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => downloadFile(result.file_id, result.filename)} className="btn-primary">
              ⬇ Download PDF
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Add Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
