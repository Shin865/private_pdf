"""
Image conversion service for PDF Tool.
Handles PDF ↔ Image conversions using PyMuPDF and Pillow.
"""
import io
import pymupdf as fitz  # PyMuPDF
import logging
from PIL import Image
from app.config import DEFAULT_DPI, DEFAULT_JPEG_QUALITY

logger = logging.getLogger("pdf-tool.image-service")


def pdf_to_images(
    pdf_bytes: bytes,
    format: str = "jpg",
    dpi: int = DEFAULT_DPI,
    pages: list[int] = None,
) -> list[tuple[str, bytes]]:
    """
    Convert PDF pages to images.
    Input: PDF bytes, format (jpg/png), DPI, optional page list.
    Output: list of (filename, image_bytes) tuples.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)

    target_pages = pages if pages else list(range(1, total + 1))
    results = []

    for p in target_pages:
        if p < 1 or p > total:
            continue

        page = doc[p - 1]
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        if format.lower() in ("jpg", "jpeg"):
            # Convert to PIL for JPEG with quality control
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            if img.mode == "RGBA":
                img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=DEFAULT_JPEG_QUALITY, optimize=True)
            img_bytes = buf.getvalue()
            ext = "jpg"
        else:
            img_bytes = pix.tobytes("png")
            ext = "png"

        filename = f"page_{p}.{ext}"
        results.append((filename, img_bytes))
        logger.info(f"Converted page {p} to {ext} ({len(img_bytes)} bytes)")

    doc.close()
    return results


def images_to_pdf(image_data_list: list[tuple[str, bytes]]) -> bytes:
    """
    Convert images to a single PDF.
    Input: list of (filename, image_bytes) tuples.
    Output: PDF bytes.
    """
    if not image_data_list:
        raise ValueError("At least one image is required")

    doc = fitz.open()

    for filename, img_bytes in image_data_list:
        try:
            # Open image to get dimensions
            img = Image.open(io.BytesIO(img_bytes))

            # Convert to RGB if needed (e.g., RGBA PNG)
            if img.mode in ("RGBA", "P", "LA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "RGBA" or img.mode == "LA":
                    bg.paste(img, mask=img.split()[-1])
                else:
                    bg.paste(img)
                img = bg

            # Convert to PDF-compatible bytes
            img_buf = io.BytesIO()
            img.save(img_buf, format="JPEG", quality=95)
            img_buf.seek(0)

            # Create page with image dimensions (convert pixels to points at 72 DPI)
            # Use a reasonable page size based on image aspect ratio
            img_width, img_height = img.size

            # A4-ish scaling: fit image to page while maintaining aspect ratio
            max_width = 595  # A4 width in points
            max_height = 842  # A4 height in points

            ratio = min(max_width / img_width, max_height / img_height)
            page_width = img_width * ratio
            page_height = img_height * ratio

            page = doc.new_page(width=page_width, height=page_height)
            rect = fitz.Rect(0, 0, page_width, page_height)
            page.insert_image(rect, stream=img_buf.getvalue())

            logger.info(f"Added image: {filename} ({img_width}x{img_height})")

        except Exception as e:
            logger.error(f"Failed to process image {filename}: {e}")
            raise ValueError(f"Error processing image '{filename}': {str(e)}")

    output = doc.tobytes(deflate=True, garbage=4)
    doc.close()
    logger.info(f"Created PDF from {len(image_data_list)} images ({len(output)} bytes)")
    return output
