"""
Word conversion service for PDF Tool.
Handles PDF → Word (.docx) conversion with layout preservation.
"""
import io
import logging

import pymupdf as fitz
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from app.utils.pdf_detector import page_has_text, detect_pdf_type
from app.services.ocr_service import extract_text_ocr, is_tesseract_available

logger = logging.getLogger("pdf-tool.word-service")


def _extract_page_content(doc: fitz.Document, page_idx: int) -> dict:
    """
    Extract structured content from a PDF page.
    Returns dict with text_blocks, images, and page dimensions.
    """
    page = doc[page_idx]
    rect = page.rect

    # Extract text blocks with position info
    text_blocks = []
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

    for block in blocks:
        if block["type"] == 0:  # Text block
            block_text = ""
            block_font_size = 12
            block_is_bold = False
            block_color = (0, 0, 0)

            for line in block.get("lines", []):
                line_text = ""
                for span in line.get("spans", []):
                    line_text += span["text"]
                    block_font_size = span.get("size", 12)
                    flags = span.get("flags", 0)
                    block_is_bold = bool(flags & 2**4)  # bit 4 = bold
                    color_int = span.get("color", 0)
                    r = (color_int >> 16) & 0xFF
                    g = (color_int >> 8) & 0xFF
                    b = color_int & 0xFF
                    block_color = (r, g, b)

                if line_text.strip():
                    block_text += line_text + "\n"

            if block_text.strip():
                text_blocks.append({
                    "text": block_text.strip(),
                    "bbox": block["bbox"],  # (x0, y0, x1, y1)
                    "font_size": block_font_size,
                    "is_bold": block_is_bold,
                    "color": block_color,
                })

    # Extract images
    images = []
    for img_idx, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        try:
            base_image = doc.extract_image(xref)
            if base_image:
                images.append({
                    "data": base_image["image"],
                    "ext": base_image["ext"],
                    "width": base_image.get("width", 0),
                    "height": base_image.get("height", 0),
                })
        except Exception as e:
            logger.warning(f"Could not extract image {xref}: {e}")

    return {
        "text_blocks": text_blocks,
        "images": images,
        "width": rect.width,
        "height": rect.height,
    }


def _add_flowing_text(word_doc: Document, page_content: dict, page_num: int):
    """Add page content as flowing text (simpler, more editable)."""
    # Sort blocks by vertical position (top to bottom)
    blocks = sorted(page_content["text_blocks"], key=lambda b: (b["bbox"][1], b["bbox"][0]))

    for block in blocks:
        para = word_doc.add_paragraph()
        run = para.add_run(block["text"])

        # Apply font formatting
        font = run.font
        font.size = Pt(min(max(block["font_size"], 6), 72))
        font.bold = block["is_bold"]

        r, g, b = block["color"]
        font.color.rgb = RGBColor(r, g, b)

        # Detect headings by font size
        if block["font_size"] > 18:
            para.style = word_doc.styles["Heading 1"]
        elif block["font_size"] > 14:
            para.style = word_doc.styles["Heading 2"]

    # Add images
    for img_info in page_content["images"]:
        try:
            img_stream = io.BytesIO(img_info["data"])
            para = word_doc.add_paragraph()
            run = para.add_run()
            # Scale image to fit page width (max 6 inches)
            img_width = img_info["width"]
            img_height = img_info["height"]
            if img_width > 0 and img_height > 0:
                max_width = Inches(6)
                aspect = img_height / img_width
                width = min(Inches(img_width / 96), max_width)
                run.add_picture(img_stream, width=width)
            else:
                run.add_picture(img_stream, width=Inches(4))
        except Exception as e:
            logger.warning(f"Could not add image to Word: {e}")


def _add_preserve_layout(word_doc: Document, page_content: dict, page_num: int):
    """
    Add page content preserving layout using a table-based approach.
    Uses a single-cell table for each text block positioned approximately.
    """
    page_w = page_content["width"]
    page_h = page_content["height"]

    # Sort blocks by vertical position
    blocks = sorted(page_content["text_blocks"], key=lambda b: (b["bbox"][1], b["bbox"][0]))

    # Group blocks that are close vertically into rows
    rows = []
    current_row = []
    last_y = -999

    for block in blocks:
        y0 = block["bbox"][1]
        if abs(y0 - last_y) > 20:  # New row threshold
            if current_row:
                rows.append(current_row)
            current_row = [block]
            last_y = y0
        else:
            current_row.append(block)

    if current_row:
        rows.append(current_row)

    for row in rows:
        if len(row) == 1:
            # Single block — add as paragraph
            block = row[0]
            para = word_doc.add_paragraph()
            run = para.add_run(block["text"])
            font = run.font
            font.size = Pt(min(max(block["font_size"], 6), 72))
            font.bold = block["is_bold"]
            r, g, b = block["color"]
            font.color.rgb = RGBColor(r, g, b)

            # Approximate alignment based on x position
            x_center = (block["bbox"][0] + block["bbox"][2]) / 2
            if x_center > page_w * 0.6:
                para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            elif x_center > page_w * 0.35:
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            # Multiple blocks side by side — use table for columns
            table = word_doc.add_table(rows=1, cols=len(row))
            table.autofit = True
            for i, block in enumerate(row):
                cell = table.cell(0, i)
                para = cell.paragraphs[0]
                run = para.add_run(block["text"])
                font = run.font
                font.size = Pt(min(max(block["font_size"], 6), 72))
                font.bold = block["is_bold"]

    # Add images
    for img_info in page_content["images"]:
        try:
            img_stream = io.BytesIO(img_info["data"])
            para = word_doc.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = para.add_run()
            img_width = img_info["width"]
            img_height = img_info["height"]
            if img_width > 0 and img_height > 0:
                max_width = Inches(6)
                width = min(Inches(img_width / 96), max_width)
                run.add_picture(img_stream, width=width)
            else:
                run.add_picture(img_stream, width=Inches(4))
        except Exception as e:
            logger.warning(f"Could not add image to Word: {e}")


def pdf_to_word(
    pdf_bytes: bytes,
    mode: str = "preserve_layout",
    extract_images: bool = True,
    detect_tables: bool = True,
) -> bytes:
    """
    Convert PDF to Word (.docx).

    Args:
        pdf_bytes: PDF file content
        mode: "preserve_layout", "flowing_text", or "ocr"
        extract_images: whether to include images
        detect_tables: whether to detect and preserve tables

    Returns:
        DOCX file content as bytes
    """
    word_doc = Document()

    # Set default font
    style = word_doc.styles["Normal"]
    font = style.font
    font.name = "Calibri"
    font.size = Pt(11)

    pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(pdf_doc)

    # Detect PDF type for OCR mode
    pdf_type = detect_pdf_type(pdf_bytes)

    for page_idx in range(total_pages):
        if page_idx > 0:
            # Add page break between pages
            word_doc.add_page_break()

        current_page_has_text = page_has_text(pdf_bytes, page_idx)

        if mode == "ocr" or (not current_page_has_text and mode != "flowing_text"):
            # Use OCR for this page
            if is_tesseract_available():
                try:
                    ocr_text = extract_text_ocr(pdf_bytes, page_idx)
                    if ocr_text:
                        para = word_doc.add_paragraph(ocr_text)
                    else:
                        word_doc.add_paragraph("[No text detected on this page]")
                except Exception as e:
                    logger.warning(f"OCR failed for page {page_idx + 1}: {e}")
                    word_doc.add_paragraph(f"[OCR failed: {str(e)}]")
            else:
                word_doc.add_paragraph("[OCR requested but Tesseract is not installed]")

            # Still try to extract images
            if extract_images:
                page_content = _extract_page_content(pdf_doc, page_idx)
                for img_info in page_content["images"]:
                    try:
                        img_stream = io.BytesIO(img_info["data"])
                        para = word_doc.add_paragraph()
                        run = para.add_run()
                        run.add_picture(img_stream, width=Inches(4))
                    except Exception:
                        pass
        else:
            # Normal extraction
            page_content = _extract_page_content(pdf_doc, page_idx)

            if not extract_images:
                page_content["images"] = []

            if mode == "preserve_layout":
                _add_preserve_layout(word_doc, page_content, page_idx + 1)
            else:
                _add_flowing_text(word_doc, page_content, page_idx + 1)

    pdf_doc.close()

    # Save to bytes
    output = io.BytesIO()
    word_doc.save(output)
    result = output.getvalue()

    logger.info(f"PDF → Word: {total_pages} pages, mode={mode}, {len(result)} bytes")
    return result
