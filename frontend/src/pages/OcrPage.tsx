import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import {
  ocrPdf,
  ocrImage,
  getOcrStatus,
  downloadFile,
  formatFileSize,
} from '../services/api';
import type { OcrPdfResult, OcrImageResult, OcrStatus } from '../types';

type OcrMode = 'pdf' | 'image';

const languages = [
  { value: 'eng', label: 'English' },
  { value: 'ind', label: 'Indonesian' },
  { value: 'eng+ind', label: 'English + Indonesian' },
];

export default function OcrPage() {
  const [mode, setMode] = useState<OcrMode>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('eng+ind');
  const [loading, setLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState<OcrPdfResult | null>(null);
  const [imageResult, setImageResult] = useState<OcrImageResult | null>(null);
  const [error, setError] = useState('');
  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(null);

  useEffect(() => {
    getOcrStatus()
      .then(setOcrStatus)
      .catch(() => setOcrStatus({ available: false, engine: 'Tesseract', message: 'Cannot connect to backend' }));
  }, []);

  const handleFileSelected = (files: File[]) => {
    setFile(files[0]);
    setPdfResult(null);
    setImageResult(null);
    setError('');
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      if (mode === 'pdf') {
        const res = await ocrPdf(file, language);
        setPdfResult(res);
      } else {
        const res = await ocrImage(file, language);
        setImageResult(res);
      }
    } catch (e: any) {
      setError(e.message || 'OCR processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfResult(null);
    setImageResult(null);
    setError('');
  };

  const result = pdfResult || imageResult;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(236,72,153,0.3))',
            }}
          >
            🔍
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">OCR Tools</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">
              Extract text from scanned PDFs and images
            </p>
          </div>
        </div>
      </div>

      {/* OCR Status */}
      {ocrStatus && (
        <div
          className={`mb-6 glass rounded-xl p-3 flex items-center gap-3 border-l-4 ${
            ocrStatus.available
              ? 'border-[var(--color-accent-emerald)]'
              : 'border-[var(--color-accent-amber)]'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              ocrStatus.available
                ? 'bg-[var(--color-accent-emerald)] animate-pulse'
                : 'bg-[var(--color-accent-amber)]'
            }`}
          />
          <span className="text-xs text-[var(--color-dark-200)]">
            {ocrStatus.engine}: {ocrStatus.message}
          </span>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="glass rounded-2xl p-2 mb-6 inline-flex gap-1">
        <button
          onClick={() => {
            setMode('pdf');
            handleReset();
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'pdf'
              ? 'bg-[var(--color-accent-rose)]/20 text-[var(--color-accent-rose)] border border-[var(--color-accent-rose)]/20'
              : 'text-[var(--color-dark-300)] hover:text-white border border-transparent'
          }`}
        >
          📄 OCR PDF
        </button>
        <button
          onClick={() => {
            setMode('image');
            handleReset();
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'image'
              ? 'bg-[var(--color-accent-pink)]/20 text-[var(--color-accent-pink)] border border-[var(--color-accent-pink)]/20'
              : 'text-[var(--color-dark-300)] hover:text-white border border-transparent'
          }`}
        >
          🖼️ OCR Image
        </button>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept={mode === 'pdf' ? '.pdf' : '.jpg,.jpeg,.png,.bmp,.webp,.tiff'}
          multiple={false}
          label={mode === 'pdf' ? 'Drop a PDF file here' : 'Drop an image file here'}
          description={
            mode === 'pdf'
              ? 'Make scanned PDF searchable with text layer'
              : 'Extract text from image using OCR'
          }
        />
      )}

      {/* File + Settings */}
      {file && !result && (
        <div className="space-y-6">
          {/* File info */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  {mode === 'pdf' ? '📄' : '🖼️'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white m-0">{file.name}</p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-[var(--color-dark-300)] hover:text-white transition-colors"
              >
                Change file
              </button>
            </div>
          </div>

          {/* Language selection */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">OCR Language</h3>
            <div className="flex gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                    language === lang.value
                      ? 'bg-[var(--color-accent-rose)]/20 text-[var(--color-accent-rose)] border border-[var(--color-accent-rose)]/30'
                      : 'bg-[var(--color-dark-700)] text-[var(--color-dark-300)] border border-transparent'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Process button */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            {loading && <ProgressBar progress={50} label="Processing OCR..." />}
            <button
              onClick={handleProcess}
              disabled={loading || (ocrStatus !== null && !ocrStatus.available)}
              className="btn-primary w-full mt-2"
              style={{
                background: loading
                  ? undefined
                  : 'linear-gradient(135deg, var(--color-accent-rose), var(--color-accent-pink))',
              }}
            >
              {loading
                ? 'Processing...'
                : mode === 'pdf'
                  ? 'Make PDF Searchable'
                  : 'Extract Text from Image'}
            </button>
          </div>
        </div>
      )}

      {/* PDF Result */}
      {pdfResult && (
        <div className="mt-6 glass rounded-2xl p-8 text-center animate-slide-up">
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
          <h3 className="text-lg font-semibold text-white mb-1">OCR Complete!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">
            Searchable PDF • {formatFileSize(pdfResult.size)}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadFile(pdfResult.file_id, pdfResult.filename)}
              className="btn-primary"
            >
              ⬇ Download {pdfResult.filename}
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Process More
            </button>
          </div>
        </div>
      )}

      {/* Image OCR Result */}
      {imageResult && (
        <div className="mt-6 space-y-4 animate-slide-up">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white m-0">Extracted Text</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-dark-400)]">
                  Confidence: {imageResult.confidence}%
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(imageResult.text);
                  }}
                  className="text-xs text-[var(--color-accent-cyan)] hover:text-[var(--color-accent-cyan)]/80 transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            <div className="bg-[var(--color-dark-800)] rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-[var(--color-dark-100)] whitespace-pre-wrap font-mono m-0 leading-relaxed">
                {imageResult.text || '[No text detected]'}
              </pre>
            </div>
          </div>
          <div className="text-center">
            <button onClick={handleReset} className="btn-secondary">
              Process More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
