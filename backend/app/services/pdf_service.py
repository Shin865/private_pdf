"""
PDF Processing Engine for PDF Tool.
Core service that handles all PDF manipulation operations using PyMuPDF and pikepdf.
"""
import io
import pymupdf as fitz  # PyMuPDF
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("pdf-tool.pdf-service")


def get_pdf_info(pdf_bytes: bytes) -> dict:
    """
    Extract PDF information: page count, dimensions, metadata, file size.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_info = []
    for i, page in enumerate(doc):
        rect = page.rect
        pages_info.append({
            "page_number": i + 1,
            "width": round(rect.width, 2),
            "height": round(rect.height, 2),
            "rotation": page.rotation,
        })

    metadata = doc.metadata or {}
    info = {
        "page_count": len(doc),
        "file_size": len(pdf_bytes),
        "metadata": {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "subject": metadata.get("subject", ""),
            "creator": metadata.get("creator", ""),
            "producer": metadata.get("producer", ""),
        },
        "pages": pages_info,
    }
    doc.close()
    return info


def merge_pdfs(pdf_bytes_list: list[bytes]) -> bytes:
    """
    Merge multiple PDFs into one.
    Input: list of PDF file contents as bytes.
    Output: merged PDF as bytes.
    """
    if len(pdf_bytes_list) < 2:
        raise ValueError("At least 2 PDF files are required for merging")

    result = fitz.open()
    for i, pdf_bytes in enumerate(pdf_bytes_list):
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            result.insert_pdf(doc)
            doc.close()
            logger.info(f"Merged PDF {i + 1}/{len(pdf_bytes_list)}")
        except Exception as e:
            result.close()
            raise ValueError(f"Error processing PDF {i + 1}: {str(e)}")

    output = result.tobytes(deflate=True, garbage=4)
    result.close()
    logger.info(f"Merge complete: {len(pdf_bytes_list)} files → {len(output)} bytes")
    return output


def split_pdf(pdf_bytes: bytes, ranges: list[tuple[int, int]]) -> list[bytes]:
    """
    Split PDF into multiple PDFs based on page ranges.
    Input: PDF bytes and list of (start, end) tuples (1-indexed, inclusive).
    Output: list of PDF bytes.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)
    results = []

    for start, end in ranges:
        if start < 1 or end > total or start > end:
            doc.close()
            raise ValueError(f"Invalid range ({start}-{end}). PDF has {total} pages.")

        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start - 1, to_page=end - 1)
        results.append(new_doc.tobytes(deflate=True, garbage=4))
        new_doc.close()
        logger.info(f"Split: pages {start}-{end}")

    doc.close()
    return results


def extract_pages(pdf_bytes: bytes, pages: list[int]) -> bytes:
    """
    Extract specific pages from PDF.
    Input: PDF bytes and list of page numbers (1-indexed).
    Output: new PDF bytes with only the selected pages.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    for p in pages:
        if p < 1 or p > total:
            doc.close()
            raise ValueError(f"Page {p} out of range. PDF has {total} pages.")

    result = fitz.open()
    for p in pages:
        result.insert_pdf(doc, from_page=p - 1, to_page=p - 1)

    output = result.tobytes(deflate=True, garbage=4)
    result.close()
    doc.close()
    logger.info(f"Extracted {len(pages)} pages")
    return output


def delete_pages(pdf_bytes: bytes, pages: list[int]) -> bytes:
    """
    Delete specific pages from PDF.
    Input: PDF bytes and list of page numbers to delete (1-indexed).
    Output: new PDF bytes without the deleted pages.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    for p in pages:
        if p < 1 or p > total:
            doc.close()
            raise ValueError(f"Page {p} out of range. PDF has {total} pages.")

    # Keep pages that are NOT in the delete list
    keep_pages = [i for i in range(1, total + 1) if i not in pages]
    if not keep_pages:
        doc.close()
        raise ValueError("Cannot delete all pages")

    result = fitz.open()
    for p in keep_pages:
        result.insert_pdf(doc, from_page=p - 1, to_page=p - 1)

    output = result.tobytes(deflate=True, garbage=4)
    result.close()
    doc.close()
    logger.info(f"Deleted {len(pages)} pages, kept {len(keep_pages)}")
    return output


def reorder_pages(pdf_bytes: bytes, new_order: list[int]) -> bytes:
    """
    Reorder pages in PDF.
    Input: PDF bytes and new page order (1-indexed).
    Output: new PDF bytes with reordered pages.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    if len(new_order) != total:
        doc.close()
        raise ValueError(f"Order list length ({len(new_order)}) must match page count ({total})")

    if sorted(new_order) != list(range(1, total + 1)):
        doc.close()
        raise ValueError("Order must contain each page number exactly once")

    result = fitz.open()
    for p in new_order:
        result.insert_pdf(doc, from_page=p - 1, to_page=p - 1)

    output = result.tobytes(deflate=True, garbage=4)
    result.close()
    doc.close()
    logger.info(f"Reordered {total} pages")
    return output


def rotate_pages(pdf_bytes: bytes, pages: list[int], angle: int) -> bytes:
    """
    Rotate specific pages in PDF.
    Input: PDF bytes, list of page numbers (1-indexed), rotation angle (90, 180, 270).
    Output: new PDF bytes with rotated pages.
    """
    angle = angle % 360
    if angle % 90 != 0:
        raise ValueError("Rotation angle must be a multiple of 90")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    for p in pages:
        if p < 1 or p > total:
            doc.close()
            raise ValueError(f"Page {p} out of range. PDF has {total} pages.")

    for p in pages:
        page = doc[p - 1]
        page.set_rotation((page.rotation + angle) % 360)

    output = doc.tobytes(deflate=True, garbage=4)
    doc.close()
    logger.info(f"Rotated {len(pages)} pages by {angle}°")
    return output


def compress_pdf(pdf_bytes: bytes, quality: str = "medium") -> bytes:
    """
    Compress PDF to reduce file size.
    Quality levels: 'low' (smallest), 'medium', 'high' (best quality).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Image quality settings based on compression level
    quality_map = {
        "low": {"image_quality": 30, "dpi": 72},
        "medium": {"image_quality": 60, "dpi": 120},
        "high": {"image_quality": 85, "dpi": 150},
    }

    settings = quality_map.get(quality, quality_map["medium"])

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img_index, img in enumerate(image_list):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                if base_image:
                    image_bytes = base_image["image"]
                    from PIL import Image
                    pil_image = Image.open(io.BytesIO(image_bytes))

                    # Resize if needed based on DPI setting
                    max_dim = settings["dpi"] * 10  # rough max dimension
                    if pil_image.width > max_dim or pil_image.height > max_dim:
                        ratio = min(max_dim / pil_image.width, max_dim / pil_image.height)
                        new_size = (int(pil_image.width * ratio), int(pil_image.height * ratio))
                        pil_image = pil_image.resize(new_size, Image.LANCZOS)

                    # Convert to RGB if needed
                    if pil_image.mode in ("RGBA", "P"):
                        pil_image = pil_image.convert("RGB")

                    # Compress
                    img_buffer = io.BytesIO()
                    pil_image.save(img_buffer, format="JPEG", quality=settings["image_quality"], optimize=True)
                    compressed_data = img_buffer.getvalue()

                    # Only replace if smaller
                    if len(compressed_data) < len(image_bytes):
                        page.replace_image(xref, stream=compressed_data)

            except Exception as e:
                logger.warning(f"Could not compress image {xref} on page {page_num + 1}: {e}")
                continue

    # Save with garbage collection and deflation
    output = doc.tobytes(deflate=True, garbage=4, clean=True)
    doc.close()

    original_size = len(pdf_bytes)
    compressed_size = len(output)
    reduction = ((original_size - compressed_size) / original_size * 100) if original_size > 0 else 0
    logger.info(f"Compressed: {original_size} → {compressed_size} bytes ({reduction:.1f}% reduction)")

    return output


def add_watermark(
    pdf_bytes: bytes,
    text: str,
    opacity: float = 0.3,
    font_size: float = 50,
    rotation: float = 45,
    color: tuple = (0.5, 0.5, 0.5),
    position: str = "center",
    pages: Optional[list[int]] = None,
) -> bytes:
    """
    Add text watermark to PDF pages.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    target_pages = pages if pages else list(range(1, total + 1))

    for p in target_pages:
        if p < 1 or p > total:
            continue
        page = doc[p - 1]
        rect = page.rect

        # Calculate position
        if position == "center":
            x = rect.width / 2
            y = rect.height / 2
        elif position == "top-left":
            x = rect.width * 0.25
            y = rect.height * 0.25
        elif position == "top-right":
            x = rect.width * 0.75
            y = rect.height * 0.25
        elif position == "bottom-left":
            x = rect.width * 0.25
            y = rect.height * 0.75
        elif position == "bottom-right":
            x = rect.width * 0.75
            y = rect.height * 0.75
        else:
            x = rect.width / 2
            y = rect.height / 2

        # Insert the watermark text with morph for rotation
        mat = fitz.Matrix(-rotation)
        text_point = fitz.Point(x, y)
        
        # Apply with opacity and rotation
        page.insert_text(
            text_point, 
            text, 
            fontsize=font_size, 
            fontname="helv", 
            color=color, 
            fill_opacity=opacity, 
            morph=(text_point, mat)
        )

    output = doc.tobytes(deflate=True, garbage=4)
    doc.close()
    logger.info(f"Watermark added to {len(target_pages)} pages")
    return output


def add_page_numbers(
    pdf_bytes: bytes,
    position: str = "bottom-center",
    format_str: str = "Page {current} of {total}",
    font_size: float = 10,
    margin: float = 36,
    start_number: int = 1,
    pages: Optional[list[int]] = None,
) -> bytes:
    """
    Add page numbers to PDF.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    target_pages = pages if pages else list(range(1, total + 1))

    for p in target_pages:
        if p < 1 or p > total:
            continue
        page = doc[p - 1]
        rect = page.rect
        current_num = start_number + (p - 1)

        page_text = format_str.replace("{current}", str(current_num)).replace("{total}", str(total))

        # Calculate position
        text_width = fitz.get_text_length(page_text, fontsize=font_size, fontname="helv")

        if "center" in position:
            x = (rect.width - text_width) / 2
        elif "right" in position:
            x = rect.width - text_width - margin
        else:
            x = margin

        if "top" in position:
            y = margin + font_size
        else:
            y = rect.height - margin

        point = fitz.Point(x, y)
        page.insert_text(point, page_text, fontsize=font_size, fontname="helv", color=(0.3, 0.3, 0.3))

    output = doc.tobytes(deflate=True, garbage=4)
    doc.close()
    logger.info(f"Page numbers added to {len(target_pages)} pages")
    return output


def render_page_thumbnail(pdf_bytes: bytes, page_number: int, width: int = 200) -> bytes:
    """
    Render a single page as a PNG thumbnail.
    Input: PDF bytes and page number (1-indexed).
    Output: PNG image bytes.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    if page_number < 1 or page_number > total:
        doc.close()
        raise ValueError(f"Page {page_number} out of range. PDF has {total} pages.")

    page = doc[page_number - 1]
    # Calculate zoom to achieve desired width
    zoom = width / page.rect.width
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    img_bytes = pix.tobytes("png")

    doc.close()
    return img_bytes
