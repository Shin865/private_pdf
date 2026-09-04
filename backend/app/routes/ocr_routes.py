"""
OCR API routes.
Handles OCR operations for PDF and images.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services import ocr_service
from app.services.file_manager import FileManager
from app.utils.validators import validate_upload_file, validate_pdf_content
from app.config import ALLOWED_IMAGE_EXTENSIONS, OCR_LANGUAGES

router = APIRouter()


@router.post("/pdf")
async def ocr_pdf(
    file: UploadFile = File(...),
    languages: str = Form(None),
):
    """
    Make a PDF searchable using OCR.
    Adds a text layer to scanned/image-only PDFs.
    """
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    lang = languages or OCR_LANGUAGES

    if not ocr_service.is_tesseract_available():
        raise HTTPException(
            status_code=503,
            detail="Tesseract OCR is not installed on this system. "
                   "Please install Tesseract: https://github.com/tesseract-ocr/tesseract"
        )

    try:
        result = ocr_service.ocr_pdf(content, languages=lang)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "ocr_searchable.pdf",
        "size": len(result),
        "original_size": len(content),
        "languages": lang,
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/image")
async def ocr_image(
    file: UploadFile = File(...),
    languages: str = Form(None),
):
    """
    Extract text from an image using OCR.
    Returns the recognized text and confidence score.
    """
    content = await validate_upload_file(file, ALLOWED_IMAGE_EXTENSIONS)

    lang = languages or OCR_LANGUAGES

    if not ocr_service.is_tesseract_available():
        raise HTTPException(
            status_code=503,
            detail="Tesseract OCR is not installed on this system. "
                   "Please install Tesseract: https://github.com/tesseract-ocr/tesseract"
        )

    try:
        result = ocr_service.ocr_image(content, languages=lang)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    return {
        "text": result["text"],
        "confidence": result["confidence"],
        "languages": lang,
    }


@router.get("/status")
async def ocr_status():
    """Check if OCR engine (Tesseract) is available."""
    available = ocr_service.is_tesseract_available()
    return {
        "available": available,
        "engine": "Tesseract OCR",
        "message": "Tesseract is ready" if available else "Tesseract is not installed",
    }
