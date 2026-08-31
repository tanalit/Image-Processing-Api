from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.image_processor import (
    INTERNAL_PROCESSING_ERROR_DETAIL,
    apply_gaussian_blur,
)
from app.validators import validate_image_bytes, validate_upload_metadata


app = FastAPI(
    title="Image Processing Backend",
    description="REST API backend for a local LAN image processing demo.",
    version="1.0.0",
)

# Local LAN demo without login/cookies: allow browser-based frontend demos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "image-processing-backend",
    }


@app.post("/process-image")
async def process_image(file: UploadFile = File(...)) -> Response:
    image_format = validate_upload_metadata(file)
    image_bytes = await file.read()
    validate_image_bytes(image_bytes)

    try:
        processed_image = apply_gaussian_blur(image_bytes, image_format)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_PROCESSING_ERROR_DETAIL,
        ) from None

    return Response(
        content=processed_image,
        media_type=image_format.media_type,
    )
