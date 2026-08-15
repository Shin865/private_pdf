"""
File management API routes.
Handles file upload, download, and cleanup operations.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.services.file_manager import FileManager

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
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
    )


@router.post("/cleanup")
async def manual_cleanup():
    """Manually trigger cleanup of old temporary files."""
    deleted = FileManager.cleanup_old_files()
    return {"deleted_files": deleted}


@router.get("/stats")
async def storage_stats():
    """Get temporary storage statistics."""
    return FileManager.get_temp_stats()
