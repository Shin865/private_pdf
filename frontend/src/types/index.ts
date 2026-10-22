/* ===== PDF Info Types ===== */
export interface PageInfo {
  page_number: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
}

export interface PdfInfo {
  page_count: number;
  file_size: number;
  metadata: PdfMetadata;
  pages: PageInfo[];
}

/* ===== Thumbnail Types ===== */
export interface ThumbnailData {
  page: number;
  data: string; // base64 data URL
  width: number;
}

export interface ThumbnailsResponse {
  page_count: number;
  thumbnails: ThumbnailData[];
}

/* ===== API Response Types ===== */
export interface FileResult {
  file_id: string;
  filename: string;
  size: number;
  download_url: string;
}

export interface SplitResult {
  files: FileResult[];
}

export interface CompressResult extends FileResult {
  original_size: number;
  compressed_size: number;
  reduction_percent: number;
}

export interface ConvertResult {
  type: 'single' | 'zip';
  file_id: string;
  filename: string;
  size: number;
  download_url: string;
  image_count?: number;
}

/* ===== Office Conversion Types ===== */
export type WordMode = 'preserve_layout' | 'flowing_text' | 'ocr';
export type ExcelMode = 'automatic' | 'detect_tables' | 'one_page_one_sheet' | 'all_pages_one_sheet';
export type PptMode = 'editable' | 'exact';
export type PptResolution = 'standard' | 'high';
export type OfficeTarget = 'word' | 'excel' | 'powerpoint' | 'text';

export interface OfficeConvertResult extends FileResult {
  mode?: string;
}

export interface WordOptions {
  mode: WordMode;
  extractImages: boolean;
  detectTables: boolean;
}

export interface ExcelOptions {
  mode: ExcelMode;
  pages?: number[];
}

export interface PowerPointOptions {
  mode: PptMode;
  pages?: number[];
  resolution: PptResolution;
}

export interface TextOptions {
  pages?: number[];
  useOcr: boolean;
}

/* ===== OCR Types ===== */
export interface OcrPdfResult extends FileResult {
  original_size: number;
  languages: string;
}

export interface OcrImageResult {
  text: string;
  confidence: number;
  languages: string;
}

export interface OcrStatus {
  available: boolean;
  engine: string;
  message: string;
}

/* ===== Tool Config ===== */
export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  gradient: string;
  category?: string;
}
