/**
 * API Service for PDF Tool.
 * Handles all HTTP communication with the FastAPI backend.
 */
import type {
  PdfInfo,
  ThumbnailsResponse,
  FileResult,
  SplitResult,
  CompressResult,
  ConvertResult,
} from '../types';

const API_BASE = '/api';

/* ===== Helper Functions ===== */

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

function createFormData(fields: Record<string, string | Blob | Blob[]>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      value.forEach((v) => form.append(key, v));
    } else {
      form.append(key, value);
    }
  }
  return form;
}

/* ===== PDF Operations ===== */

export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/pdf/info`, { method: 'POST', body: form });
  return handleResponse<PdfInfo>(res);
}

export async function getThumbnails(file: File, width = 200): Promise<ThumbnailsResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('width', String(width));
  const res = await fetch(`${API_BASE}/pdf/thumbnails`, { method: 'POST', body: form });
  return handleResponse<ThumbnailsResponse>(res);
}

export async function mergePdfs(files: File[]): Promise<FileResult> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const res = await fetch(`${API_BASE}/pdf/merge`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

export async function splitPdf(file: File, ranges: [number, number][]): Promise<SplitResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('ranges', JSON.stringify(ranges));
  const res = await fetch(`${API_BASE}/pdf/split`, { method: 'POST', body: form });
  return handleResponse<SplitResult>(res);
}

export async function extractPages(file: File, pages: number[]): Promise<FileResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('pages', JSON.stringify(pages));
  const res = await fetch(`${API_BASE}/pdf/extract`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

export async function deletePages(file: File, pages: number[]): Promise<FileResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('pages', JSON.stringify(pages));
  const res = await fetch(`${API_BASE}/pdf/delete-pages`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

export async function reorderPages(file: File, order: number[]): Promise<FileResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('order', JSON.stringify(order));
  const res = await fetch(`${API_BASE}/pdf/reorder`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

export async function rotatePages(file: File, pages: number[] | 'all', angle: number): Promise<FileResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('pages', typeof pages === 'string' ? pages : JSON.stringify(pages));
  form.append('angle', String(angle));
  const res = await fetch(`${API_BASE}/pdf/rotate`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

export async function compressPdf(file: File, quality: string): Promise<CompressResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('quality', quality);
  const res = await fetch(`${API_BASE}/pdf/compress`, { method: 'POST', body: form });
  return handleResponse<CompressResult>(res);
}

export async function addWatermark(
  file: File,
  text: string,
  options: { opacity?: number; fontSize?: number; rotation?: number; position?: string; pages?: number[] } = {}
): Promise<FileResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('text', text);
  if (options.opacity !== undefined) form.append('opacity', String(options.opacity));
  if (options.fontSize !== undefined) form.append('font_size', String(options.fontSize));
  if (options.rotation !== undefined) form.append('rotation', String(options.rotation));
  if (options.position) form.append('position', options.position);
  if (options.pages) form.append('pages', JSON.stringify(options.pages));
  const res = await fetch(`${API_BASE}/pdf/watermark`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

export async function addPageNumbers(
  file: File,
  options: { position?: string; formatStr?: string; fontSize?: number; startNumber?: number } = {}
): Promise<FileResult> {
  const form = new FormData();
  form.append('file', file);
  if (options.position) form.append('position', options.position);
  if (options.formatStr) form.append('format_str', options.formatStr);
  if (options.fontSize !== undefined) form.append('font_size', String(options.fontSize));
  if (options.startNumber !== undefined) form.append('start_number', String(options.startNumber));
  const res = await fetch(`${API_BASE}/pdf/page-numbers`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

/* ===== Conversion Operations ===== */

export async function pdfToImage(
  file: File,
  format = 'jpg',
  dpi = 150,
  pages?: number[]
): Promise<ConvertResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('format', format);
  form.append('dpi', String(dpi));
  if (pages) form.append('pages', JSON.stringify(pages));
  const res = await fetch(`${API_BASE}/convert/pdf-to-image`, { method: 'POST', body: form });
  return handleResponse<ConvertResult>(res);
}

export async function imageToPdf(files: File[]): Promise<FileResult> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const res = await fetch(`${API_BASE}/convert/image-to-pdf`, { method: 'POST', body: form });
  return handleResponse<FileResult>(res);
}

/* ===== File Operations ===== */

export function getDownloadUrl(fileId: string): string {
  return `${API_BASE}/files/download/${fileId}`;
}

export async function downloadFile(fileId: string, filename: string): Promise<void> {
  const url = getDownloadUrl(fileId);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/* ===== Utility ===== */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
