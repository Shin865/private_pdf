"""
OCR Service for PDF Tool.
Provides OCR capabilities using Tesseract and OCRmyPDF.
"""
import io
import tempfile
import logging
from pathlib import Path

import pymupdf as fitz
from PIL import Image

from app.config import TESSERACT_CMD, OCR_LANGUAGES, PROCESSING_DIR

logger = logging.getLogger("pdf-tool.ocr-service")


def _check_tesseract() -> bool:
    """Check if Tesseract is available."""
    try:
        import pytesseract
        if TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def is_tesseract_available() -> bool:
    """Public check for Tesseract availability."""
    try:
        return _check_tesseract()
    except Exception:
        return False


def get_available_languages() -> list[str]:
    """Get list of installed Tesseract languages."""
    if not _check_tesseract():
        return []
    try:
        import pytesseract
        if TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
        return pytesseract.get_languages()
    except Exception:
        return ["eng"]


def get_valid_languages(requested: str) -> str:
    """Filter requested languages (e.g. 'eng+ind') to only those installed."""
    installed = get_available_languages()
    if not installed:
        return "eng"
    
    req_list = requested.split("+")
    valid = [l for l in req_list if l in installed]
    return "+".join(valid) if valid else "eng"


def has_text_layer(pdf_bytes: bytes) -> bool:
    """
    Detect whether a PDF has any extractable text layer.
    Returns True if at least some pages contain text.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        for i in range(min(len(doc), 5)):  # Check first 5 pages
            page = doc[i]
            text = page.get_text("text").strip()
            if len(text) > 10:
                return True
        return False
    finally:
        doc.close()


def ocr_pdf(pdf_bytes: bytes, languages: str = None) -> bytes:
    """
    Make a PDF searchable using OCRmyPDF.
    Input: PDF bytes (possibly scanned/image-only).
    Output: PDF bytes with text layer added.
    """
    if not _check_tesseract():
        raise RuntimeError(
            "Tesseract OCR is not installed. "
            "Please install Tesseract: https://github.com/tesseract-ocr/tesseract"
        )

    import ocrmypdf

    lang = languages or OCR_LANGUAGES
    lang = get_valid_languages(lang)

    # Write input to temp file
    input_path = PROCESSING_DIR / f"ocr_input_{id(pdf_bytes)}.pdf"
    output_path = PROCESSING_DIR / f"ocr_output_{id(pdf_bytes)}.pdf"

    try:
        with open(input_path, "wb") as f:
            f.write(pdf_bytes)

        # Run OCRmyPDF
        ocrmypdf.ocr(
            input_path,
            output_path,
            language=lang,
            skip_text=True,  # Skip pages that already have text
            optimize=1,
            progress_bar=False,
            force_ocr=False,
        )

        with open(output_path, "rb") as f:
            result = f.read()

        logger.info(f"OCR complete: {len(pdf_bytes)} → {len(result)} bytes")
        return result

    except ocrmypdf.exceptions.MissingDependencyError as e:
        raise RuntimeError(f"OCR dependency missing: {e}")
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise RuntimeError(f"OCR processing failed: {str(e)}")
    finally:
        # Clean up temp files
        for p in [input_path, output_path]:
            try:
                if p.exists():
                    p.unlink()
            except Exception:
                pass


def ocr_image(image_bytes: bytes, languages: str = None) -> dict:
    """
    Perform OCR on an image.
    Returns dict with 'text' and 'confidence'.
    """
    if not _check_tesseract():
        raise RuntimeError(
            "Tesseract OCR is not installed. "
            "Please install Tesseract: https://github.com/tesseract-ocr/tesseract"
        )

    import pytesseract
    if TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

    lang = languages or OCR_LANGUAGES
    lang = get_valid_languages(lang)

    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Get text
    text = pytesseract.image_to_string(img, lang=lang)

    # Get confidence data
    try:
        data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data["conf"] if int(c) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    except Exception:
        avg_confidence = 0.0

    logger.info(f"OCR image: {len(text)} chars, confidence: {avg_confidence:.1f}%")
    return {
        "text": text.strip(),
        "confidence": round(avg_confidence, 1),
    }


def extract_text_ocr(pdf_bytes: bytes, page_num: int, languages: str = None) -> str:
    """
    Extract text from a specific PDF page using OCR.
    page_num is 0-indexed.
    """
    if not _check_tesseract():
        raise RuntimeError("Tesseract OCR is not installed.")

    import pytesseract
    if TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

    lang = languages or OCR_LANGUAGES
    lang = get_valid_languages(lang)

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page = doc[page_num]
        # Render page at 300 DPI for better OCR
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        text = pytesseract.image_to_string(img, lang=lang)
        return text.strip()
    finally:
        doc.close()
