import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_test_image() -> np.ndarray:
    """Create a high-contrast test image that makes blur easy to verify."""
    image = np.zeros((80, 80, 3), dtype=np.uint8)
    image[:, :40] = (0, 0, 0)
    image[:, 40:] = (255, 255, 255)
    image[25:55, 25:55] = (0, 0, 255)
    return image


def encode_image(image: np.ndarray, extension: str) -> bytes:
    success, encoded = cv2.imencode(extension, image)
    if not success:
        raise RuntimeError(f"OpenCV could not encode {extension}")
    return encoded.tobytes()


def decode_image(data: bytes) -> np.ndarray:
    array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    assert image is not None
    return image


def upload_image(filename: str, content: bytes, content_type: str):
    return client.post(
        "/process-image",
        files={"file": (filename, content, content_type)},
    )


def assert_magic_bytes(data: bytes, expected_format: str) -> None:
    if expected_format == "jpeg":
        assert data.startswith(b"\xff\xd8\xff")
    elif expected_format == "png":
        assert data.startswith(b"\x89PNG\r\n\x1a\n")
    elif expected_format == "webp":
        assert data[:4] == b"RIFF"
        assert data[8:12] == b"WEBP"
    else:
        raise AssertionError(f"Unknown expected format: {expected_format}")


def test_health_check_contract():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "image-processing-backend",
    }


import pytest


@pytest.mark.parametrize(
    ("filename", "opencv_extension", "content_type", "expected_content_type", "expected_format"),
    [
        ("sample.jpg", ".jpg", "image/jpeg", "image/jpeg", "jpeg"),
        ("sample.jpeg", ".jpeg", "image/jpeg", "image/jpeg", "jpeg"),
        ("sample.png", ".png", "image/png", "image/png", "png"),
        ("sample.webp", ".webp", "image/webp", "image/webp", "webp"),
    ],
)
def test_process_image_supported_formats_return_binary_image(
    filename,
    opencv_extension,
    content_type,
    expected_content_type,
    expected_format,
):
    original = create_test_image()
    image_bytes = encode_image(original, opencv_extension)

    response = upload_image(filename, image_bytes, content_type)

    assert response.status_code == 200
    assert response.headers["content-type"] == expected_content_type
    assert response.content
    assert_magic_bytes(response.content, expected_format)

    processed = decode_image(response.content)
    assert processed.shape == original.shape


def test_process_image_applies_fixed_gaussian_blur():
    original = create_test_image()
    image_bytes = encode_image(original, ".png")

    response = upload_image("sample.png", image_bytes, "image/png")

    assert response.status_code == 200
    processed = decode_image(response.content)
    expected = cv2.GaussianBlur(original, (15, 15), 0)
    assert np.array_equal(processed, expected)
    assert not np.array_equal(processed, original)


def test_unsupported_extension_returns_415():
    response = upload_image("notes.txt", b"hello", "text/plain")

    assert response.status_code == 415
    assert response.json() == {"detail": "Unsupported image format"}


def test_unsupported_content_type_returns_415():
    image = create_test_image()
    image_bytes = encode_image(image, ".png")

    response = upload_image("sample.png", image_bytes, "application/octet-stream")

    assert response.status_code == 415
    assert response.json() == {"detail": "Unsupported image format"}


def test_empty_file_returns_400():
    response = upload_image("empty.png", b"", "image/png")

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid or corrupted image"}


def test_corrupted_image_returns_400():
    response = upload_image("broken.jpg", b"not a real image", "image/jpeg")

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid or corrupted image"}


def test_upload_field_must_be_file():
    response = client.post(
        "/process-image",
        files={"image": ("sample.png", b"content", "image/png")},
    )

    assert response.status_code == 422
