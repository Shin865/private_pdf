"""
PDF Tool — FastAPI Backend Application
Main entry point with CORS, routing, and lifecycle management.
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.services.file_manager import periodic_cleanup, FileManager
from app.routes.pdf_routes import router as pdf_router
from app.routes.convert_routes import router as convert_router
from app.routes.file_routes import router as file_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pdf-tool")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown events."""
    logger.info("PDF Tool Backend starting...")

    # Start periodic cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup(interval_minutes=5))
    logger.info("Periodic cleanup task started (every 5 minutes)")

    yield

    # Shutdown: cancel cleanup task and clean up files
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

    FileManager.cleanup_all()
    logger.info("PDF Tool Backend shut down. All temp files cleaned.")


# Create FastAPI application
app = FastAPI(
    title="PDF Tool API",
    description="Local PDF manipulation and conversion tool",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(pdf_router, prefix="/api/pdf", tags=["PDF Operations"])
app.include_router(convert_router, prefix="/api/convert", tags=["Conversions"])
app.include_router(file_router, prefix="/api/files", tags=["File Management"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": "PDF Tool API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check with temp storage stats."""
    stats = FileManager.get_temp_stats()
    return {
        "status": "healthy",
        "temp_storage": stats,
    }
