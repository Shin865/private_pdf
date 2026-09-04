import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProgressBar from '../components/ProgressBar';
import {
  pdfToWord,
  pdfToExcel,
  pdfToPowerpoint,
  pdfToText,
  getPdfInfo,
  downloadFile,
  formatFileSize,
} from '../services/api';
import type {
  OfficeTarget,
  WordMode,
  ExcelMode,
  PptMode,
  PptResolution,
  OfficeConvertResult,
  PdfInfo,
} from '../types';

const targetFormats: { id: OfficeTarget; label: string; ext: string; icon: string; color: string }[] = [
  { id: 'word', label: 'Word', ext: '.docx', icon: '📝', color: 'var(--color-accent-cyan)' },
  { id: 'excel', label: 'Excel', ext: '.xlsx', icon: '📊', color: 'var(--color-accent-emerald)' },
  { id: 'powerpoint', label: 'PowerPoint', ext: '.pptx', icon: '📽️', color: 'var(--color-accent-amber)' },
  { id: 'text', label: 'Text', ext: '.txt', icon: '📄', color: 'var(--color-accent-violet)' },
];

export default function PdfToOffice() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [target, setTarget] = useState<OfficeTarget>('word');

  // Word options
  const [wordMode, setWordMode] = useState<WordMode>('preserve_layout');
  const [extractImages, setExtractImages] = useState(true);
  const [detectTables, setDetectTables] = useState(true);

  // Excel options
  const [excelMode, setExcelMode] = useState<ExcelMode>('automatic');

  // PowerPoint options
  const [pptMode, setPptMode] = useState<PptMode>('exact');
  const [pptResolution, setPptResolution] = useState<PptResolution>('standard');

  // Text options
  const [useOcr, setUseOcr] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [result, setResult] = useState<OfficeConvertResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelected = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError('');
    setLoadingInfo(true);
    try {
      const info = await getPdfInfo(f);
      setPdfInfo(info);
    } catch {
      setPdfInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let res: OfficeConvertResult;
      switch (target) {
        case 'word':
          res = await pdfToWord(file, {
            mode: wordMode,
            extractImages,
            detectTables,
          });
          break;
        case 'excel':
          res = await pdfToExcel(file, { mode: excelMode });
          break;
        case 'powerpoint':
          res = await pdfToPowerpoint(file, {
            mode: pptMode,
            resolution: pptResolution,
          });
          break;
        case 'text':
          res = await pdfToText(file, { useOcr });
          break;
        default:
          throw new Error('Invalid target');
      }
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfInfo(null);
    setResult(null);
    setError('');
  };

  const currentTarget = targetFormats.find((t) => t.id === target)!;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,212,255,0.3))',
            }}
          >
            📋
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white m-0">PDF → Office</h1>
            <p className="text-sm text-[var(--color-dark-300)] m-0">
              Convert PDF to Word, Excel, PowerPoint, or Text
            </p>
          </div>
        </div>
      </div>

      {/* Upload */}
      {!file && !result && (
        <FileUpload
          onFilesSelected={handleFileSelected}
          accept=".pdf"
          multiple={false}
          label="Drop a PDF file here"
          description="Convert to Word, Excel, PowerPoint, or Text"
        />
      )}

      {/* File Info + Settings */}
      {file && !result && (
        <div className="space-y-6">
          {/* File info card */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-dark-600)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  📄
                </div>
                <div>
                  <p className="text-sm font-medium text-white m-0">{file.name}</p>
                  <p className="text-xs text-[var(--color-dark-400)] m-0">
                    {formatFileSize(file.size)}
                    {pdfInfo && ` • ${pdfInfo.page_count} page${pdfInfo.page_count > 1 ? 's' : ''}`}
                    {loadingInfo && ' • Loading...'}
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

          {/* Target format selection */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Convert To</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {targetFormats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setTarget(fmt.id)}
                  className={`p-4 rounded-xl text-center transition-all duration-200 border ${
                    target === fmt.id
                      ? 'border-[var(--color-accent-cyan)]/40 bg-[var(--color-accent-cyan)]/10'
                      : 'border-transparent bg-[var(--color-dark-700)] hover:bg-[var(--color-dark-600)]'
                  }`}
                >
                  <div className="text-2xl mb-2">{fmt.icon}</div>
                  <div
                    className={`text-sm font-medium ${
                      target === fmt.id ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-dark-200)]'
                    }`}
                  >
                    {fmt.label}
                  </div>
                  <div className="text-xs text-[var(--color-dark-400)] mt-0.5">{fmt.ext}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format-specific options */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              {currentTarget.icon} {currentTarget.label} Options
            </h3>

            {/* Word Options */}
            {target === 'word' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-[var(--color-dark-300)] mb-3">Mode</label>
                  <div className="space-y-2">
                    {([
                      {
                        value: 'preserve_layout' as WordMode,
                        label: 'Preserve Layout',
                        desc: 'Maintains positioning as closely as possible',
                      },
                      {
                        value: 'flowing_text' as WordMode,
                        label: 'Flowing Text',
                        desc: 'Simple paragraphs, easier to edit',
                      },
                      {
                        value: 'ocr' as WordMode,
                        label: 'OCR',
                        desc: 'For scanned PDFs — requires Tesseract',
                      },
                    ] as const).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          wordMode === opt.value
                            ? 'border-[var(--color-accent-cyan)]/30 bg-[var(--color-accent-cyan)]/5'
                            : 'border-transparent hover:bg-[var(--color-dark-700)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="wordMode"
                          value={opt.value}
                          checked={wordMode === opt.value}
                          onChange={() => setWordMode(opt.value)}
                          className="mt-0.5 accent-[var(--color-accent-cyan)]"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{opt.label}</div>
                          <div className="text-xs text-[var(--color-dark-400)]">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extractImages}
                      onChange={(e) => setExtractImages(e.target.checked)}
                      className="accent-[var(--color-accent-cyan)]"
                    />
                    <span className="text-sm text-[var(--color-dark-200)]">Extract Images</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detectTables}
                      onChange={(e) => setDetectTables(e.target.checked)}
                      className="accent-[var(--color-accent-cyan)]"
                    />
                    <span className="text-sm text-[var(--color-dark-200)]">Detect Tables</span>
                  </label>
                </div>
              </div>
            )}

            {/* Excel Options */}
            {target === 'excel' && (
              <div>
                <label className="block text-xs text-[var(--color-dark-300)] mb-3">Mode</label>
                <div className="space-y-2">
                  {([
                    {
                      value: 'automatic' as ExcelMode,
                      label: 'Automatic',
                      desc: 'Detect tables first, fallback to page-per-sheet',
                    },
                    {
                      value: 'detect_tables' as ExcelMode,
                      label: 'Detect Tables',
                      desc: 'Extract only detected tables',
                    },
                    {
                      value: 'one_page_one_sheet' as ExcelMode,
                      label: 'One Page = One Sheet',
                      desc: 'Each PDF page becomes a separate sheet',
                    },
                    {
                      value: 'all_pages_one_sheet' as ExcelMode,
                      label: 'All Pages = One Sheet',
                      desc: 'All content in a single sheet',
                    },
                  ] as const).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        excelMode === opt.value
                          ? 'border-[var(--color-accent-emerald)]/30 bg-[var(--color-accent-emerald)]/5'
                          : 'border-transparent hover:bg-[var(--color-dark-700)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="excelMode"
                        value={opt.value}
                        checked={excelMode === opt.value}
                        onChange={() => setExcelMode(opt.value)}
                        className="mt-0.5 accent-[var(--color-accent-emerald)]"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{opt.label}</div>
                        <div className="text-xs text-[var(--color-dark-400)]">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* PowerPoint Options */}
            {target === 'powerpoint' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-[var(--color-dark-300)] mb-3">Mode</label>
                  <div className="space-y-2">
                    {([
                      {
                        value: 'editable' as PptMode,
                        label: 'Editable',
                        desc: 'Text and images as editable PowerPoint objects',
                      },
                      {
                        value: 'exact' as PptMode,
                        label: 'Exact Layout',
                        desc: 'Each page rendered as an image slide (not editable)',
                      },
                    ] as const).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          pptMode === opt.value
                            ? 'border-[var(--color-accent-amber)]/30 bg-[var(--color-accent-amber)]/5'
                            : 'border-transparent hover:bg-[var(--color-dark-700)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="pptMode"
                          value={opt.value}
                          checked={pptMode === opt.value}
                          onChange={() => setPptMode(opt.value)}
                          className="mt-0.5 accent-[var(--color-accent-amber)]"
                        />
                        <div>
                          <div className="text-sm font-medium text-white">{opt.label}</div>
                          <div className="text-xs text-[var(--color-dark-400)]">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-dark-300)] mb-3">Resolution</label>
                  <div className="flex gap-3">
                    {(['standard', 'high'] as PptResolution[]).map((res) => (
                      <button
                        key={res}
                        onClick={() => setPptResolution(res)}
                        className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                          pptResolution === res
                            ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] border border-[var(--color-accent-amber)]/30'
                            : 'bg-[var(--color-dark-700)] text-[var(--color-dark-300)] border border-transparent'
                        }`}
                      >
                        {res === 'standard' ? 'Standard (150 DPI)' : 'High (300 DPI)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Text Options */}
            {target === 'text' && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[var(--color-dark-700)] transition-all">
                  <input
                    type="checkbox"
                    checked={useOcr}
                    onChange={(e) => setUseOcr(e.target.checked)}
                    className="accent-[var(--color-accent-violet)]"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">Use OCR if necessary</div>
                    <div className="text-xs text-[var(--color-dark-400)]">
                      Apply OCR to pages without text layer (requires Tesseract)
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="glass rounded-2xl p-4 border-l-4 border-[var(--color-accent-amber)]">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs text-[var(--color-dark-200)] m-0 leading-relaxed">
                  PDF → Office conversion reconstructs document structure and may not be 100% identical.
                  Complex layouts, special fonts, and multi-column designs may require manual adjustments.
                </p>
              </div>
            </div>
          </div>

          {/* Convert button */}
          <div className="glass rounded-2xl p-6">
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
            {loading && <ProgressBar progress={50} label="Converting..." />}
            <button
              onClick={handleConvert}
              disabled={loading}
              className="btn-primary w-full mt-2"
              style={{
                background: loading
                  ? undefined
                  : `linear-gradient(135deg, ${currentTarget.color}, var(--color-accent-violet))`,
              }}
            >
              {loading
                ? 'Converting...'
                : `Convert to ${currentTarget.label} (${currentTarget.ext})`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
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
          <h3 className="text-lg font-semibold text-white mb-1">Conversion Complete!</h3>
          <p className="text-sm text-[var(--color-dark-300)] mb-1">
            {currentTarget.icon} {currentTarget.label} ({currentTarget.ext})
          </p>
          <p className="text-sm text-[var(--color-dark-300)] mb-6">{formatFileSize(result.size)}</p>
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
