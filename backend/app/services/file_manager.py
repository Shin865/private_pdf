"""
Temporary file management for PDF Tool.
Handles file storage with UUID naming, organized directories, and auto-cleanup.
"""
import uuid
import time
import shutil
import asyncio
import logging
from pathlib import Path
from app.config import UPLOAD_DIR, PROCESSING_DIR, OUTPUT_DIR, TEMP_FILE_MAX_AGE_MINUTES

logger = logging.getLogger("pdf-tool.file-manager")


class FileManager:
    """Manages temporary file storage with UUID-based naming and auto-cleanup."""

    @staticmethod
    def generate_id() -> str:
        """Generate a unique file ID."""
        return str(uuid.uuid4())

    @staticmethod
    def save_upload(content: bytes, original_filename: str) -> tuple[str, Path]:
        """
        Save uploaded file with UUID name.
        Returns (file_id, file_path).
        """
        file_id = FileManager.generate_id()
        ext = Path(original_filename).suffix.lower()
        safe_name = f"{file_id}{ext}"
        file_path = UPLOAD_DIR / safe_name

        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"File saved: {safe_name} ({len(content)} bytes)")
        return file_id, file_path

    @staticmethod
    def save_output(content: bytes, extension: str = ".pdf") -> tuple[str, Path]:
        """
        Save processed output file.
        Returns (file_id, file_path).
        """
        file_id = FileManager.generate_id()
        if not extension.startswith("."):
            extension = f".{extension}"
        safe_name = f"{file_id}{extension}"
        file_path = OUTPUT_DIR / safe_name

        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"Output saved: {safe_name} ({len(content)} bytes)")
        return file_id, file_path

    @staticmethod
    def save_output_file(source_path: Path, extension: str = ".pdf") -> tuple[str, Path]:
        """
        Move/copy a processed file to output directory.
        Returns (file_id, file_path).
        """
        file_id = FileManager.generate_id()
        if not extension.startswith("."):
            extension = f".{extension}"
        safe_name = f"{file_id}{extension}"
        file_path = OUTPUT_DIR / safe_name

        shutil.copy2(source_path, file_path)
        logger.info(f"Output file saved: {safe_name}")
        return file_id, file_path

    @staticmethod
    def get_upload_path(file_id: str) -> Path:
        """Get the path of an uploaded file by ID."""
        for f in UPLOAD_DIR.iterdir():
            if f.stem == file_id:
                return f
        raise FileNotFoundError(f"Upload file not found: {file_id}")

    @staticmethod
    def get_output_path(file_id: str) -> Path:
        """Get the path of an output file by ID."""
        for f in OUTPUT_DIR.iterdir():
            if f.stem == file_id:
                return f
        raise FileNotFoundError(f"Output file not found: {file_id}")

    @staticmethod
    def delete_file(file_path: Path) -> None:
        """Delete a specific file."""
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted: {file_path.name}")
        except Exception as e:
            logger.warning(f"Failed to delete {file_path.name}: {e}")

    @staticmethod
    def cleanup_old_files() -> int:
        """
        Remove files older than TEMP_FILE_MAX_AGE_MINUTES.
        Returns number of files deleted.
        """
        cutoff = time.time() - (TEMP_FILE_MAX_AGE_MINUTES * 60)
        deleted = 0

        for directory in [UPLOAD_DIR, PROCESSING_DIR, OUTPUT_DIR]:
            if not directory.exists():
                continue
            for f in directory.iterdir():
                if f.is_file() and f.stat().st_mtime < cutoff:
                    try:
                        f.unlink()
                        deleted += 1
                        logger.info(f"Cleanup: deleted {f.name}")
                    except Exception as e:
                        logger.warning(f"Cleanup failed for {f.name}: {e}")

        if deleted > 0:
            logger.info(f"Cleanup complete: {deleted} files deleted")
        return deleted

    @staticmethod
    def cleanup_all() -> int:
        """Remove all temporary files. Returns number deleted."""
        deleted = 0
        for directory in [UPLOAD_DIR, PROCESSING_DIR, OUTPUT_DIR]:
            if not directory.exists():
                continue
            for f in directory.iterdir():
                if f.is_file():
                    try:
                        f.unlink()
                        deleted += 1
                    except Exception:
                        pass
        logger.info(f"Full cleanup: {deleted} files deleted")
        return deleted

    @staticmethod
    def get_temp_stats() -> dict:
        """Get statistics about temporary storage."""
        stats = {"total_files": 0, "total_size": 0, "directories": {}}
        for name, directory in [("upload", UPLOAD_DIR), ("processing", PROCESSING_DIR), ("output", OUTPUT_DIR)]:
            files = list(directory.iterdir()) if directory.exists() else []
            file_count = len([f for f in files if f.is_file()])
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            stats["directories"][name] = {"files": file_count, "size_bytes": total_size}
            stats["total_files"] += file_count
            stats["total_size"] += total_size
        return stats


# Background cleanup task
async def periodic_cleanup(interval_minutes: int = 5):
    """Background task that periodically cleans up old temporary files."""
    while True:
        await asyncio.sleep(interval_minutes * 60)
        try:
            FileManager.cleanup_old_files()
        except Exception as e:
            logger.error(f"Periodic cleanup error: {e}")


# Singleton instance
file_manager = FileManager()
