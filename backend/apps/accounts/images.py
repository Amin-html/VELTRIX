import io
import uuid

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_PIXELS = 25_000_000
BACKGROUND = (17, 25, 35)  # цвет поверхности сайта: сюда «сплющивается» прозрачность

AVATAR = {"max_bytes": 2 * 1024 * 1024, "min_size": (128, 128), "size": (512, 512)}
COVER = {"max_bytes": 5 * 1024 * 1024, "min_size": (800, 250), "size": (1600, 500)}


def _fail(message: str):
    raise ValidationError({"image": message})


def _open(upload, *, max_bytes: int, min_size: tuple[int, int]):
    if upload is None:
        _fail("Выберите файл.")
    if upload.size > max_bytes:
        _fail(f"Файл слишком большой (максимум {max_bytes // (1024 * 1024)} МБ).")
    try:
        probe = Image.open(upload)
        if probe.format not in ALLOWED_FORMATS:
            _fail("Допустимы только JPG, PNG и WebP.")
        if probe.width * probe.height > MAX_PIXELS:
            _fail("Изображение слишком большое по размерам.")
        probe.verify()
        upload.seek(0)
        img = ImageOps.exif_transpose(Image.open(upload))
        img.load()
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, Image.DecompressionBombError):
        _fail("Не удалось прочитать изображение.")
    if img.width < min_size[0] or img.height < min_size[1]:
        _fail(f"Слишком маленькое изображение (минимум {min_size[0]}×{min_size[1]} px).")
    return img


def _flatten(img):
    if img.mode in ("RGBA", "LA", "PA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        base = Image.new("RGB", rgba.size, BACKGROUND)
        base.paste(rgba, mask=rgba.getchannel("A"))
        return base
    return img.convert("RGB")


def _encode(img) -> ContentFile:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85, optimize=True, progressive=True)  # без exif
    return ContentFile(buf.getvalue(), name=f"{uuid.uuid4().hex}.jpg")


def process_avatar(upload) -> ContentFile:
    img = _flatten(_open(upload, max_bytes=AVATAR["max_bytes"], min_size=AVATAR["min_size"]))
    return _encode(ImageOps.fit(img, AVATAR["size"], Image.LANCZOS, centering=(0.5, 0.4)))


def process_cover(upload) -> ContentFile:
    img = _flatten(_open(upload, max_bytes=COVER["max_bytes"], min_size=COVER["min_size"]))
    return _encode(ImageOps.fit(img, COVER["size"], Image.LANCZOS, centering=(0.5, 0.5)))