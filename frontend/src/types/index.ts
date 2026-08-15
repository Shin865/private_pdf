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

export interface MergeResult extends FileResult {}

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

/* ===== Tool Config ===== */
export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  gradient: string;
}

/* ===== Upload State ===== */
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  thumbnails?: ThumbnailData[];
  pageCount?: number;
}

/* ===== Page Selection ===== */
export interface SelectedPage {
  pageNumber: number;
  rotation: number;
  selected: boolean;
}
