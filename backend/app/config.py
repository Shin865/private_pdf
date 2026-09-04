import os
import shutil
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Temporary storage paths
TEMP_DIR = BASE_DIR / "temp"
UPLOAD_DIR = TEMP_DIR / "upload"
PROCESSING_DIR = TEMP_DIR / "processing"
OUTPUT_DIR = TEMP_DIR / "output"

# Create directories
for d in [UPLOAD_DIR, PROCESSING_DIR, OUTPUT_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# File limits
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_PDF_EXTENSIONS = {".pdf"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
ALLOWED_EXTENSIONS = ALLOWED_PDF_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS

# Cleanup settings
TEMP_FILE_MAX_AGE_MINUTES = 30

# PDF processing defaults
DEFAULT_DPI = 150
DEFAULT_IMAGE_FORMAT = "jpg"
DEFAULT_JPEG_QUALITY = 85

# Conversion rendering DPI
RENDER_DPI_STANDARD = 150
RENDER_DPI_HIGH = 300

# OCR settings
OCR_LANGUAGES = "eng+ind"  # English + Indonesian

# Auto-detect Tesseract path
_tesseract_path = shutil.which("tesseract")
if not _tesseract_path and os.name == "nt":
    # Common Windows install paths
    for p in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    ]:
        if os.path.isfile(p):
            _tesseract_path = p
            break

TESSERACT_CMD = _tesseract_path  # None if not found

# CORS settings (for React dev server)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
