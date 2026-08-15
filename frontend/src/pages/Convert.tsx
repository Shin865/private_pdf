import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import { pdfToImage, imageToPdf, downloadFile, formatFileSize } from '../services/api';
import type { FileResult, ConvertResult } from '../types';

type ConvertMode = 'pdf-to-image' | 'image-to-pdf';

export default function Convert() {
  const [mode, setMode] = useState<ConvertMode>('pdf-to-image');
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<'jpg' | 'png'>('jpg');
  const [dpi, setDpi] = useState(150);
  const [loading, setLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState<ConvertResult | null>(null);
  const [imgResult, setImgResult] = useState<FileResult | null>(null);
  const [error, setError] = useState('');

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setPdfResult(null);
    setImgResult(null);
    setError('');
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError('');

    try {
      if (mode === 'pdf-to-image') {
        const res = await pdfToImage(files[0], format, dpi);
        setPdfResult(res);
      } else {
        const res = await imageToPdf(files);
        setImgResult(res);
      }
    } catch (e: any) {
      setError(e.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPdfResult(null);
    setImgResult(null);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const result = pdfResult || imgResult;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))' }}>
            🖼️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Convert</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Convert between PDF and image formats</p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="glass rounded-2xl p-2 mb-6 inline-flex gap-1">
        <button
          onClick={() => { setMode('pdf-to-image'); handleReset(); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'pdf-to-image'
              ? 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/20'
              : 'text-[var(--color-dark-300)] hover:text-white border border-transparent'
          }`}
        >
          📄 PDF → Image
        </button>
        <button
          onClick={() => { setMode('image-to-pdf'); handleReset(); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'image-to-pdf'
              ? 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet)] border border-[var(--color-accent-violet)]/20'
              : 'text-[var(--color-dark-300)] hover:text-white border border-transparent'
          }`}
        >
          🖼️ Image → PDF
        </button>
      </div>

      {/* Upload */}
      {files.length === 0 && !result && (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          accept={mode === 'pdf-to-image' ? '.pdf' : '.jpg,.jpeg,.png,.bmp,.webp,.tiff'}
          multiple={mode === 'image-to-pdf'}
          maxFiles={20}
          label={mode === 'pdf-to-image' ? 'Drop a PDF file here' : 'Drop image files here'}
          description={mode === 'pdf-to-image' ? 'Convert PDF pages to images' : 'Convert images to a single PDF'}
        />
      )}

      {/* File List + Settings */}
      {files.length > 0 && !result && (
        <div className="space-y-6">
          {/* Files */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-dark-600)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white m-0">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </h3>
              <button onClick={handleReset} className="text-xs text-[var(--color-dark-300)] hover:text-white transition-colors">
                Clear
              </button>
            </div>
            <div className="divide-y divide-[var(--color-dark-600)]">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-4 p-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    {mode === 'pdf-to-image' ? '📄' : '🖼️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate m-0">{file.name}</p>
                    <p className="text-xs text-[var(--color-dark-400)] m-0">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--color-dark-400)] hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings for PDF → Image */}
          {mode === 'pdf-to-image' && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Output Settings</h3>

              {/* Format */}
              <div className="mb-4">
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">Format</label>
                <div className="flex gap-3">
                  {(['jpg', 'png'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                        format === f
                          ? 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/30'
                          : 'bg-[var(--color-dark-700)] text-[var(--color-dark-300)] border border-transparent'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI */}
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-2">
                  Quality (DPI): {dpi}
                </label>
                <input
                  type="range"
                  min={72}
                  max={600}
                  step={1}
                  value={dpi}
                  onChange={(e) => setDpi(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-accent-cyan)]"
                />
                <div className="flex justify-between text-xs text-[var(--color-dark-400)] mt-1">
                  <span>72 (Draft)</span>
                  <span>150 (Standard)</span>
                  <span>300 (High)</span>
                  <span>600 (Max)</span>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            {loading && <ProgressBar progress={50} label="Converting..." />}
            <button onClick={handleConvert} disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Converting...' : mode === 'pdf-to-image' ? `Convert to ${format.toUpperCase()}` : 'Convert to PDF'}
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
          <h3 className="text-lg font-semibold text-white mb-1">Conversion Complete!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">
            {formatFileSize(result.size)}
            {pdfResult?.image_count && ` • ${pdfResult.image_count} images`}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadFile(result.file_id, result.filename)}
              className="btn-primary"
            >
              ⬇ Download {result.filename}
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Convert More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
