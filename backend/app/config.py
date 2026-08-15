import os
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

# CORS settings (for React dev server)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
