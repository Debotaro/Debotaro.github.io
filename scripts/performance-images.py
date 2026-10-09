"""Build responsive web deliveries from the original project screenshots.

Run with Python and Pillow 12.3.0. Original PNGs remain the editable/archival
source and are still used by GitHub documentation and social assets.
"""
from pathlib import Path
import json
import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DELIVERIES = ROOT / "previews" / "web"
DELIVERIES.mkdir(parents=True, exist_ok=True)
records = []
for name in ["portfolio-cover", "relay", "nova", "atlas", "nila", "aura", "vanta", "rasa"]:
    source = ROOT / "previews" / f"{name}.png"
    with Image.open(source) as image:
        for width in [640, 1280]:
            height = round(image.height * width / image.width)
            delivery = image.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
            target = DELIVERIES / f"{name}-{width}.webp"
            delivery.save(target, "WEBP", quality=90, method=6)
            records.append({"source": source.relative_to(ROOT).as_posix(), "sourceBytes": source.stat().st_size, "delivery": target.relative_to(ROOT).as_posix(), "deliveryBytes": target.stat().st_size, "width": width, "height": height})

for name in ["debotaro-logo-hero", "debotaro-logo-small"]:
    source = ROOT / "assets" / f"{name}.png"
    target = ROOT / "assets" / f"{name}.webp"
    with Image.open(source) as image:
        image.save(target, "WEBP", lossless=True, method=6)
        records.append({"source": source.relative_to(ROOT).as_posix(), "sourceBytes": source.stat().st_size, "delivery": target.relative_to(ROOT).as_posix(), "deliveryBytes": target.stat().st_size, "width": image.width, "height": image.height, "lossless": True})

report = ROOT / "reports" / "performance" / "image-delivery.json"
report.parent.mkdir(parents=True, exist_ok=True)
report.write_text(json.dumps({"pillowVersion": PIL.__version__, "webpQuality": 90, "records": records}, indent=2) + "\n", encoding="utf-8")
print(f"Created {len(records)} web deliveries; originals retained.")
