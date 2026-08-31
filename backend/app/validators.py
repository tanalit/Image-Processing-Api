from dataclasses import dataclass
from pathlib import PurePath

from fastapi import HTTPException, UploadFile, status


UNSUPPORTED_IMAGE_FORMAT_DETAIL = "Unsupported image format"
INVALID_IMAGE_DETAIL = "Invalid or corrupted image"


@dataclass(frozen=True)
class ImageFormat:
    """Format information needed for response headers and OpenCV encoding."""

    media_type: str
    encode_extension: str


SUPPORTED_IMAGE_FORMATS: dict[str, ImageFormat] = {
    ".jpg": ImageFormat(media_type="image/jpeg", encode_extension=".jpg"),
    ".jpeg": ImageFormat(media_type="image/jpeg", encode_extension=".jpg"),
    ".png": ImageFormat(media_type="image/png", encode_extension=".png"),
    ".webp": ImageFormat(media_type="image/webp", encode_extension=".webp"),
}


def validate_upload_metadata(file: UploadFile) -> ImageFormat:
    """Validate file name extension and multipart content type."""

    extension = _get_extension(file.filename)
    image_format = SUPPORTED_IMAGE_FORMATS.get(extension)

    if image_format is None or file.content_type != image_format.media_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=UNSUPPORTED_IMAGE_FORMAT_DETAIL,
        )

    return image_format


def validate_image_bytes(image_bytes: bytes) -> None:
    """Reject empty uploads before OpenCV tries to decode them."""

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_IMAGE_DETAIL,
        )


def _get_extension(filename: str | None) -> str:
    if not filename:
        return ""
    return PurePath(filename).suffix.lower()
