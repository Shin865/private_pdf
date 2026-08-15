"""
Conversion API routes.
Handles PDF ↔ Image conversions.
"""
import io
import json
import zipfile
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from app.services import image_service
from app.services.file_manager import FileManager
from app.utils.validators import validate_upload_file, validate_pdf_content
from app.config import ALLOWED_IMAGE_EXTENSIONS

router = APIRouter()


@router.post("/pdf-to-image")
async def pdf_to_image(
    file: UploadFile = File(...),
    format: str = Form("jpg"),
    dpi: int = Form(150),
    pages: str = Form(None),
):
    """
    Convert PDF pages to images.
    Returns a ZIP file containing the images, or a single image if only one page.
    """
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    if format.lower() not in ("jpg", "jpeg", "png"):
        raise HTTPException(status_code=400, detail="Format must be: jpg or png")

    if dpi < 72 or dpi > 600:
        raise HTTPException(status_code=400, detail="DPI must be between 72 and 600")

    page_list = None
    if pages:
        try:
            page_list = json.loads(pages)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pages format")

    results = image_service.pdf_to_images(content, format=format, dpi=dpi, pages=page_list)

    if len(results) == 1:
        # Return single image directly
        filename, img_bytes = results[0]
        media_type = "image/jpeg" if format.lower() in ("jpg", "jpeg") else "image/png"
        file_id, _ = FileManager.save_output(img_bytes, f".{format}")
        return {
            "type": "single",
            "file_id": file_id,
            "filename": filename,
            "size": len(img_bytes),
            "download_url": f"/api/files/download/{file_id}",
        }
    else:
        # Create ZIP file with all images
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for filename, img_bytes in results:
                zf.writestr(filename, img_bytes)

        zip_bytes = zip_buffer.getvalue()
        file_id, _ = FileManager.save_output(zip_bytes, ".zip")

        return {
            "type": "zip",
            "file_id": file_id,
            "filename": "pdf_images.zip",
            "size": len(zip_bytes),
            "image_count": len(results),
            "download_url": f"/api/files/download/{file_id}",
        }


@router.post("/image-to-pdf")
async def image_to_pdf(files: list[UploadFile] = File(...)):
    """Convert one or more images to a single PDF."""
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required")

    image_data_list = []
    for f in files:
        content = await validate_upload_file(f, ALLOWED_IMAGE_EXTENSIONS)
        image_data_list.append((f.filename, content))

    result = image_service.images_to_pdf(image_data_list)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "images_converted.pdf",
        "size": len(result),
        "image_count": len(image_data_list),
        "download_url": f"/api/files/download/{file_id}",
    }
