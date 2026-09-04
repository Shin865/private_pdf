"""
Conversion API routes.
Handles PDF ↔ Image conversions and PDF → Office conversions.
"""
import io
import json
import zipfile
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from app.services import image_service
from app.services import word_service
from app.services import excel_service
from app.services import powerpoint_service
from app.services import text_service
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


# ===== PDF → Office Conversion Endpoints =====


@router.post("/pdf-to-word")
async def pdf_to_word(
    file: UploadFile = File(...),
    mode: str = Form("preserve_layout"),
    extract_images: bool = Form(True),
    detect_tables: bool = Form(True),
):
    """
    Convert PDF to Word (.docx).
    Modes: preserve_layout, flowing_text, ocr
    """
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    valid_modes = ("preserve_layout", "flowing_text", "ocr")
    if mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Mode must be one of: {', '.join(valid_modes)}"
        )

    try:
        result = word_service.pdf_to_word(
            content,
            mode=mode,
            extract_images=extract_images,
            detect_tables=detect_tables,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

    file_id, _ = FileManager.save_output(result, ".docx")

    return {
        "file_id": file_id,
        "filename": "document.docx",
        "size": len(result),
        "mode": mode,
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/pdf-to-excel")
async def pdf_to_excel(
    file: UploadFile = File(...),
    mode: str = Form("automatic"),
    pages: str = Form(None),
):
    """
    Convert PDF to Excel (.xlsx).
    Modes: automatic, detect_tables, one_page_one_sheet, all_pages_one_sheet
    """
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    valid_modes = ("automatic", "detect_tables", "one_page_one_sheet", "all_pages_one_sheet")
    if mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Mode must be one of: {', '.join(valid_modes)}"
        )

    page_list = None
    if pages:
        try:
            page_list = json.loads(pages)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pages format")

    try:
        result = excel_service.pdf_to_excel(content, mode=mode, pages=page_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

    file_id, _ = FileManager.save_output(result, ".xlsx")

    return {
        "file_id": file_id,
        "filename": "document.xlsx",
        "size": len(result),
        "mode": mode,
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/pdf-to-powerpoint")
async def pdf_to_powerpoint(
    file: UploadFile = File(...),
    mode: str = Form("exact"),
    pages: str = Form(None),
    resolution: str = Form("standard"),
):
    """
    Convert PDF to PowerPoint (.pptx).
    Modes: editable, exact
    Resolution: standard (150 DPI), high (300 DPI)
    """
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    valid_modes = ("editable", "exact")
    if mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Mode must be one of: {', '.join(valid_modes)}"
        )

    if resolution not in ("standard", "high"):
        raise HTTPException(
            status_code=400,
            detail="Resolution must be: standard or high"
        )

    page_list = None
    if pages:
        try:
            page_list = json.loads(pages)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pages format")

    try:
        result = powerpoint_service.pdf_to_powerpoint(
            content, mode=mode, pages=page_list, resolution=resolution
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

    file_id, _ = FileManager.save_output(result, ".pptx")

    return {
        "file_id": file_id,
        "filename": "presentation.pptx",
        "size": len(result),
        "mode": mode,
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/pdf-to-text")
async def pdf_to_text(
    file: UploadFile = File(...),
    pages: str = Form(None),
    use_ocr: bool = Form(False),
):
    """
    Convert PDF to plain text (.txt).
    Optionally uses OCR for scanned pages.
    """
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    page_list = None
    if pages:
        try:
            page_list = json.loads(pages)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pages format")

    try:
        result = text_service.pdf_to_text(content, pages=page_list, use_ocr=use_ocr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

    file_id, _ = FileManager.save_output(result, ".txt")

    return {
        "file_id": file_id,
        "filename": "document.txt",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }
