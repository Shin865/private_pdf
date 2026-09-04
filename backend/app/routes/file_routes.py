"""
File management API routes.
Handles file upload, download, preview, and cleanup operations.
"""
import base64
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from app.services.file_manager import FileManager
from app.services import pdf_service

router = APIRouter()


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download a processed output file."""
    try:
        file_path = FileManager.get_output_path(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found or expired")

    # Determine media type from extension
    ext = file_path.suffix.lower()
    media_types = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".zip": "application/zip",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
    )


@router.get("/preview/{file_id}")
async def preview_file(file_id: str, width: int = Query(200), max_pages: int = Query(6)):
    """
    Generate thumbnail previews for a PDF output file.
    Returns base64-encoded PNG thumbnails for up to max_pages pages.
    Only works for PDF files.
    """
    try:
        file_path = FileManager.get_output_path(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found or expired")

    if file_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Preview only available for PDF files")

    pdf_bytes = file_path.read_bytes()
    import pymupdf as fitz
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    doc.close()

    pages_to_render = min(total_pages, max_pages)
    thumbnails = []

    for p in range(1, pages_to_render + 1):
        img_bytes = pdf_service.render_page_thumbnail(pdf_bytes, p, width)
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        thumbnails.append({
            "page": p,
            "data": f"data:image/png;base64,{b64}",
            "width": width,
        })

    return {
        "file_id": file_id,
        "page_count": total_pages,
        "thumbnails": thumbnails,
    }


@router.post("/cleanup")
async def manual_cleanup():
    """Manually trigger cleanup of old temporary files."""
    deleted = FileManager.cleanup_old_files()
    return {"deleted_files": deleted}


@router.get("/stats")
async def storage_stats():
    """Get temporary storage statistics."""
    return FileManager.get_temp_stats()
