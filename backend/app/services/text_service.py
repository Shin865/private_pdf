"""
Text extraction service for PDF Tool.
Handles PDF → Text (.txt) conversion.
"""
import logging
import pymupdf as fitz
from app.services.ocr_service import extract_text_ocr, is_tesseract_available

logger = logging.getLogger("pdf-tool.text-service")


def pdf_to_text(
    pdf_bytes: bytes,
    pages: list[int] = None,
    use_ocr: bool = False,
) -> bytes:
    """
    Extract text from PDF.
    Input:
        pdf_bytes: PDF file content
        pages: optional list of page numbers (1-indexed). None = all pages
        use_ocr: if True, use OCR for pages without text layer
    Output:
        Text content as UTF-8 encoded bytes
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        total = len(doc)
        target_pages = pages if pages else list(range(1, total + 1))
        text_parts = []

        for p in target_pages:
            if p < 1 or p > total:
                continue

            page_idx = p - 1

            # Try normal text extraction first
            page = doc[page_idx]
            text = page.get_text("text").strip()

            if text and len(text) > 5:
                text_parts.append(f"--- Page {p} ---\n{text}")
            elif use_ocr and is_tesseract_available():
                # Fallback to OCR
                try:
                    ocr_text = extract_text_ocr(pdf_bytes, page_idx)
                    if ocr_text:
                        text_parts.append(f"--- Page {p} (OCR) ---\n{ocr_text}")
                    else:
                        text_parts.append(f"--- Page {p} ---\n[No text detected]")
                except Exception as e:
                    logger.warning(f"OCR failed for page {p}: {e}")
                    text_parts.append(f"--- Page {p} ---\n[OCR failed: {str(e)}]")
            elif use_ocr and not is_tesseract_available():
                text_parts.append(f"--- Page {p} ---\n[OCR requested but Tesseract is not installed]")
            else:
                text_parts.append(f"--- Page {p} ---\n[No text content]")

        full_text = "\n\n".join(text_parts)
        result = full_text.encode("utf-8")
        logger.info(f"PDF → Text: {total} pages, {len(result)} bytes output")
        return result
    finally:
        doc.close()
