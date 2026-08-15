"""
File validation utilities for PDF Tool.
Validates file extensions, MIME types, file size, and PDF integrity.
"""
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import MAX_FILE_SIZE, ALLOWED_PDF_EXTENSIONS, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_EXTENSIONS


def validate_file_extension(filename: str, allowed: set = None) -> str:
    """Validate file extension and return the extension."""
    if allowed is None:
        allowed = ALLOWED_EXTENSIONS
    ext = Path(filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(allowed))}"
        )
    return ext


def validate_file_size(file_size: int) -> None:
    """Validate file size against maximum."""
    if file_size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {max_mb} MB"
        )


async def validate_upload_file(file: UploadFile, allowed_extensions: set = None) -> bytes:
    """
    Validate an uploaded file and return its content.
    Checks extension, reads content, and validates size.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    validate_file_extension(file.filename, allowed_extensions)

    content = await file.read()
    validate_file_size(len(content))

    return content


def validate_pdf_content(content: bytes) -> bool:
    """Check if content is a valid PDF by checking magic bytes."""
    if not content or len(content) < 5:
        raise HTTPException(status_code=400, detail="File is empty or too small")
    if not content[:5] == b'%PDF-':
        raise HTTPException(status_code=400, detail="File is not a valid PDF")
    return True


def validate_page_numbers(pages: list[int], total_pages: int) -> list[int]:
    """Validate that page numbers are within range."""
    for p in pages:
        if p < 1 or p > total_pages:
            raise HTTPException(
                status_code=400,
                detail=f"Page {p} out of range. PDF has {total_pages} pages (1-{total_pages})"
            )
    return pages


def validate_rotation_angle(angle: int) -> int:
    """Validate rotation angle (must be multiple of 90)."""
    if angle % 90 != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Rotation angle must be a multiple of 90. Got: {angle}"
        )
    return angle % 360
