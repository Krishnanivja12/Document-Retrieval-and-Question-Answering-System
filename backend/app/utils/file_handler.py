import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings
from app.core.errors import AppException

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_SIZE_MB = settings.MAX_UPLOAD_SIZE_MB
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

UPLOAD_DIR = Path("data/uploads")
TEXT_DIR = Path("data/texts")

async def save_upload(upload: UploadFile) -> dict:
    # Validate extension
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise AppException(
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            status_code=400,
        )

    # Read file content (validate size)
    contents = await upload.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise AppException(
            detail=f"File too large. Max allowed: {MAX_SIZE_MB} MB",
            status_code=413,
        )

    # Generate unique filename to avoid collisions
    unique_name = f"{uuid.uuid4()}{ext}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / unique_name
    with open(file_path, "wb") as f:
        f.write(contents)

    return {
        "original_filename": upload.filename,
        "ext": ext,
        "size_bytes": len(contents),
        "file_path": str(file_path),
    }
