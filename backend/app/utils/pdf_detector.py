"""
PDF type detector utility.
Detects whether a PDF contains text layers, is scanned (image-only), or mixed.
"""
import pymupdf as fitz
import logging

logger = logging.getLogger("pdf-tool.pdf-detector")


def get_page_text_ratio(pdf_bytes: bytes, page_num: int) -> float:
    """
    Calculate the ratio of text content on a specific page.
    Returns a value between 0.0 (no text) and 1.0 (full text).
    page_num is 1-indexed.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        if page_num < 1 or page_num > len(doc):
            return 0.0
        page = doc[page_num - 1]
        text = page.get_text("text").strip()
        # Simple heuristic: if text length > 10 chars, consider it has text
        has_text = len(text) > 10
        return 1.0 if has_text else 0.0
    finally:
        doc.close()


def detect_pdf_type(pdf_bytes: bytes) -> str:
    """
    Detect the type of PDF content.
    Returns:
        "text"    — most pages have extractable text
        "scanned" — most pages are image-only (no text layer)
        "mixed"   — some pages have text, some don't
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    if total == 0:
        doc.close()
        return "text"

    text_pages = 0
    for i in range(total):
        page = doc[i]
        text = page.get_text("text").strip()
        if len(text) > 10:
            text_pages += 1

    doc.close()

    ratio = text_pages / total

    if ratio >= 0.8:
        result = "text"
    elif ratio <= 0.2:
        result = "scanned"
    else:
        result = "mixed"

    logger.info(f"PDF type: {result} ({text_pages}/{total} pages have text)")
    return result


def page_has_text(pdf_bytes: bytes, page_num: int) -> bool:
    """
    Check if a specific page has extractable text.
    page_num is 0-indexed.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        if page_num < 0 or page_num >= len(doc):
            return False
        page = doc[page_num]
        text = page.get_text("text").strip()
        return len(text) > 10
    finally:
        doc.close()
