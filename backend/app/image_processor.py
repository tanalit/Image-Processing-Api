import cv2
import numpy as np
from fastapi import HTTPException, status

from app.validators import INVALID_IMAGE_DETAIL, ImageFormat


GAUSSIAN_BLUR_KERNEL = (15, 15)
GAUSSIAN_BLUR_SIGMA = 0
INTERNAL_PROCESSING_ERROR_DETAIL = "Internal processing error"


def apply_gaussian_blur(image_bytes: bytes, image_format: ImageFormat) -> bytes:
    """Decode an image, apply fixed Gaussian blur, and encode to its input format."""

    image = _decode_image(image_bytes)
    blurred_image = cv2.GaussianBlur(
        image,
        GAUSSIAN_BLUR_KERNEL,
        GAUSSIAN_BLUR_SIGMA,
    )
    return _encode_image(blurred_image, image_format)


def _decode_image(image_bytes: bytes) -> np.ndarray:
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_UNCHANGED)

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_IMAGE_DETAIL,
        )

    return image


def _encode_image(image: np.ndarray, image_format: ImageFormat) -> bytes:
    success, encoded_image = cv2.imencode(image_format.encode_extension, image)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_PROCESSING_ERROR_DETAIL,
        )

    return encoded_image.tobytes()
