import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import { compressPdf, downloadFile, formatFileSize } from '../services/api';
import type { CompressResult } from '../types';

export default function Compress() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError('');
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await compressPdf(file, quality);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Compression failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  const qualityOptions = [
    { value: 'low' as const, label: 'Maximum', desc: 'Smallest file size', icon: '🗜️' },
    { value: 'medium' as const, label: 'Balanced', desc: 'Good quality & size', icon: '⚖️' },
    { value: 'high' as const, label: 'Minimum', desc: 'Best quality', icon: '✨' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.3))' }}>
            🗜️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">Compress PDF</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">Reduce PDF file size while maintaining quality</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          multiple={false}
          label="Drop a PDF file here to compress"
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

          {/* Quality Selection */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Compression Level</h3>
            <div className="grid grid-cols-3 gap-3">
              {qualityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQuality(opt.value)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    quality === opt.value
                      ? 'bg-[var(--color-accent-emerald)]/20 border border-[var(--color-accent-emerald)]/30'
                      : 'bg-[var(--color-dark-700)] border border-transparent hover:border-[var(--color-dark-400)]'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <p className={`text-sm font-medium m-0 ${quality === opt.value ? 'text-[var(--color-accent-emerald)]' : 'text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            {loading && <ProgressBar progress={60} label="Compressing PDF..." />}
            <button onClick={handleCompress} disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Compressing...' : 'Compress PDF'}
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
            <h3 className="text-lg font-semibold text-white mb-1">Compression Complete!</h3>
          </div>

          {/* Size Comparison */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-[var(--color-dark-700)]">
              <p className="text-xs text-[var(--color-dark-400)] mb-1 m-0">Original</p>
              <p className="text-lg font-bold text-white m-0">{formatFileSize(result.original_size)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--color-dark-700)]">
              <p className="text-xs text-[var(--color-dark-400)] mb-1 m-0">Compressed</p>
              <p className="text-lg font-bold text-[var(--color-accent-emerald)] m-0">{formatFileSize(result.compressed_size)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--color-dark-700)]">
              <p className="text-xs text-[var(--color-dark-400)] mb-1 m-0">Reduction</p>
              <p className="text-lg font-bold text-[var(--color-accent-cyan)] m-0">{result.reduction_percent}%</p>
            </div>
          </div>

          {/* Visual Bar */}
          <div className="mb-6">
            <div className="flex gap-2 items-center mb-2">
              <div className="flex-1">
                <div className="h-4 rounded-full bg-[var(--color-dark-600)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-emerald)] transition-all duration-1000"
                    style={{ width: `${100 - result.reduction_percent}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--color-dark-400)] text-center m-0">
              File size reduced by {result.reduction_percent}%
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => downloadFile(result.file_id, result.filename)} className="btn-primary">
              ⬇ Download Compressed PDF
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Compress Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
