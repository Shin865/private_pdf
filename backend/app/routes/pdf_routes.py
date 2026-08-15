"""
PDF manipulation API routes.
Handles merge, split, extract, delete, reorder, rotate, compress, watermark, page numbers, thumbnails.
"""
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from typing import Optional
from app.services import pdf_service
from app.services.file_manager import FileManager
from app.utils.validators import validate_upload_file, validate_pdf_content

router = APIRouter()


@router.post("/info")
async def pdf_info(file: UploadFile = File(...)):
    """Get PDF information: pages, metadata, dimensions."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)
    info = pdf_service.get_pdf_info(content)
    return info


@router.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    """Merge multiple PDF files into one."""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files required")

    pdf_list = []
    for f in files:
        content = await validate_upload_file(f, {".pdf"})
        validate_pdf_content(content)
        pdf_list.append(content)

    result = pdf_service.merge_pdfs(pdf_list)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "merged.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    ranges: str = Form(...),  # JSON string: [[1,3], [4,6], [7,10]]
):
    """Split PDF into multiple files based on page ranges."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    try:
        range_list = json.loads(ranges)
        range_tuples = [(r[0], r[1]) for r in range_list]
    except (json.JSONDecodeError, IndexError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid ranges format. Expected: [[1,3], [4,6]]")

    results = pdf_service.split_pdf(content, range_tuples)

    output_files = []
    for i, pdf_bytes in enumerate(results):
        file_id, _ = FileManager.save_output(pdf_bytes, ".pdf")
        start, end = range_tuples[i]
        output_files.append({
            "file_id": file_id,
            "filename": f"split_pages_{start}-{end}.pdf",
            "size": len(pdf_bytes),
            "download_url": f"/api/files/download/{file_id}",
        })

    return {"files": output_files}


@router.post("/extract")
async def extract_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),  # JSON string: [1, 3, 5]
):
    """Extract specific pages from PDF."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    try:
        page_list = json.loads(pages)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid pages format. Expected: [1, 3, 5]")

    result = pdf_service.extract_pages(content, page_list)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "extracted.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/delete-pages")
async def delete_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),  # JSON string: [2, 4]
):
    """Delete specific pages from PDF."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    try:
        page_list = json.loads(pages)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid pages format. Expected: [2, 4]")

    result = pdf_service.delete_pages(content, page_list)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "modified.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/reorder")
async def reorder_pages(
    file: UploadFile = File(...),
    order: str = Form(...),  # JSON string: [3, 1, 2, 5, 4]
):
    """Reorder pages in PDF."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    try:
        new_order = json.loads(order)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid order format. Expected: [3, 1, 2]")

    result = pdf_service.reorder_pages(content, new_order)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "reordered.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/rotate")
async def rotate_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),  # JSON string: [1, 3] or "all"
    angle: int = Form(90),
):
    """Rotate pages in PDF."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    info = pdf_service.get_pdf_info(content)
    total_pages = info["page_count"]

    if pages == "all":
        page_list = list(range(1, total_pages + 1))
    else:
        try:
            page_list = json.loads(pages)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pages format")

    result = pdf_service.rotate_pages(content, page_list, angle)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "rotated.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    quality: str = Form("medium"),
):
    """Compress PDF to reduce file size."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    if quality not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="Quality must be: low, medium, or high")

    result = pdf_service.compress_pdf(content, quality)
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "compressed.pdf",
        "original_size": len(content),
        "compressed_size": len(result),
        "reduction_percent": round((1 - len(result) / len(content)) * 100, 1) if len(content) > 0 else 0,
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/watermark")
async def add_watermark(
    file: UploadFile = File(...),
    text: str = Form(...),
    opacity: float = Form(0.3),
    font_size: float = Form(50),
    rotation: float = Form(45),
    position: str = Form("center"),
    pages: Optional[str] = Form(None),
):
    """Add text watermark to PDF."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    page_list = None
    if pages:
        try:
            page_list = json.loads(pages)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pages format")

    result = pdf_service.add_watermark(
        content, text,
        opacity=opacity, font_size=font_size,
        rotation=rotation, position=position,
        pages=page_list,
    )
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "watermarked.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/page-numbers")
async def add_page_numbers(
    file: UploadFile = File(...),
    position: str = Form("bottom-center"),
    format_str: str = Form("Page {current} of {total}"),
    font_size: float = Form(10),
    start_number: int = Form(1),
):
    """Add page numbers to PDF."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    result = pdf_service.add_page_numbers(
        content, position=position,
        format_str=format_str, font_size=font_size,
        start_number=start_number,
    )
    file_id, _ = FileManager.save_output(result, ".pdf")

    return {
        "file_id": file_id,
        "filename": "numbered.pdf",
        "size": len(result),
        "download_url": f"/api/files/download/{file_id}",
    }


@router.post("/thumbnail")
async def get_thumbnail(
    file: UploadFile = File(...),
    page: int = Form(1),
    width: int = Form(200),
):
    """Generate page thumbnail as PNG image."""
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    img_bytes = pdf_service.render_page_thumbnail(content, page, width)

    return Response(
        content=img_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=page_{page}.png"},
    )


@router.post("/thumbnails")
async def get_all_thumbnails(
    file: UploadFile = File(...),
    width: int = Form(200),
):
    """Generate thumbnails for all pages. Returns base64-encoded images."""
    import base64
    content = await validate_upload_file(file, {".pdf"})
    validate_pdf_content(content)

    info = pdf_service.get_pdf_info(content)
    total_pages = info["page_count"]

    thumbnails = []
    for p in range(1, total_pages + 1):
        img_bytes = pdf_service.render_page_thumbnail(content, p, width)
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        thumbnails.append({
            "page": p,
            "data": f"data:image/png;base64,{b64}",
            "width": width,
        })

    return {"page_count": total_pages, "thumbnails": thumbnails}
