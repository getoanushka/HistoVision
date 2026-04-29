from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import io
import uuid
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone

import numpy as np
import cv2
from PIL import Image
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="HistoVision API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# ------------------- SAMPLE IMAGES -------------------
SAMPLE_IMAGES = [
    {"id": "sample-1", "title": "Plant Vascular Tissue (Stained)",
     "url": "https://images.unsplash.com/photo-1714845596474-5b934d901b4e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"},
    {"id": "sample-2", "title": "Human Stomach Section (H&E)",
     "url": "https://images.unsplash.com/photo-1647083701139-3930542304cf?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"},
    {"id": "sample-3", "title": "Blue-Stained Histology Sample",
     "url": "https://images.pexels.com/photos/36816507/pexels-photo-36816507.jpeg?auto=compress&cs=tinysrgb&w=940"},
    {"id": "sample-4", "title": "Cellular Network (Fluorescence)",
     "url": "https://images.unsplash.com/photo-1767486366936-c41b4f767eb8?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"},
]

# ------------------- IMAGE PROCESSING PIPELINE -------------------
def _img_to_b64_png(img: np.ndarray) -> str:
    if img.ndim == 2:
        pil = Image.fromarray(img.astype(np.uint8), mode="L")
    else:
        pil = Image.fromarray(img.astype(np.uint8), mode="RGB")
    buf = io.BytesIO()
    pil.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def _resize_max(img_rgb: np.ndarray, max_side: int = 700) -> np.ndarray:
    h, w = img_rgb.shape[:2]
    scale = max_side / max(h, w)
    if scale < 1.0:
        return cv2.resize(img_rgb, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img_rgb


def compute_color_spaces(img_rgb: np.ndarray) -> Dict[str, str]:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    hsv_vis = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    lab_vis = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return {
        "rgb": _img_to_b64_png(img_rgb),
        "grayscale": _img_to_b64_png(gray),
        "hsv": _img_to_b64_png(hsv_vis),
        "lab": _img_to_b64_png(lab_vis),
    }


def compute_segmentation(img_rgb: np.ndarray) -> Dict[str, Any]:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    otsu_val, otsu_mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive_mask = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 8
    )
    contours, _ = cv2.findContours(otsu_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour_overlay = img_rgb.copy()
    significant = [c for c in contours if cv2.contourArea(c) > 50]
    cv2.drawContours(contour_overlay, significant, -1, (255, 0, 85), 2)
    return {
        "otsu_threshold_value": float(otsu_val),
        "otsu_mask": _img_to_b64_png(otsu_mask),
        "adaptive_mask": _img_to_b64_png(adaptive_mask),
        "contour_overlay": _img_to_b64_png(contour_overlay),
        "contour_count": len(significant),
        "total_area_pct": float(np.sum(otsu_mask > 0) / otsu_mask.size * 100.0),
    }


def compute_quality_metrics(img_rgb: np.ndarray) -> Dict[str, Any]:
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY).astype(np.float64)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blur_label = "Sharp" if laplacian_var > 100 else ("Slightly Blurry" if laplacian_var > 30 else "Blurry")
    brightness = float(gray.mean())
    contrast = float(gray.std())
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    sharpness = float(np.mean(np.sqrt(gx ** 2 + gy ** 2)))
    snr = float(brightness / (contrast + 1e-6))
    dynamic_range = float(gray.max() - gray.min())
    return {
        "laplacian_variance": round(laplacian_var, 2),
        "blur_label": blur_label,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "snr_db": round(20 * np.log10(snr + 1e-6), 2),
        "dynamic_range": round(dynamic_range, 2),
    }


def compute_enhancements(img_rgb: np.ndarray) -> Dict[str, str]:
    blurred = cv2.GaussianBlur(img_rgb, (0, 0), sigmaX=2.0)
    sharpened = cv2.addWeighted(img_rgb, 1.6, blurred, -0.6, 0)
    sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)

    denoised = cv2.fastNlMeansDenoisingColored(img_rgb, None, h=8, hColor=8, templateWindowSize=7, searchWindowSize=21)

    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_eq = clahe.apply(l)
    eq = cv2.cvtColor(cv2.merge([l_eq, a, b]), cv2.COLOR_LAB2RGB)

    pipeline = cv2.fastNlMeansDenoisingColored(img_rgb, None, h=6, hColor=6)
    lab2 = cv2.cvtColor(pipeline, cv2.COLOR_RGB2LAB)
    l2, a2, b2 = cv2.split(lab2)
    l2 = clahe.apply(l2)
    pipeline = cv2.cvtColor(cv2.merge([l2, a2, b2]), cv2.COLOR_LAB2RGB)
    p_blur = cv2.GaussianBlur(pipeline, (0, 0), sigmaX=1.5)
    pipeline = cv2.addWeighted(pipeline, 1.5, p_blur, -0.5, 0)
    pipeline = np.clip(pipeline, 0, 255).astype(np.uint8)

    return {
        "sharpened": _img_to_b64_png(sharpened),
        "denoised": _img_to_b64_png(denoised),
        "clahe_equalized": _img_to_b64_png(eq),
        "full_pipeline": _img_to_b64_png(pipeline),
    }


def run_pipeline(image_bytes: bytes) -> Dict[str, Any]:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(pil_img)
    arr = _resize_max(arr, max_side=700)
    h, w = arr.shape[:2]
    return {
        "dimensions": {"width": int(w), "height": int(h), "channels": 3},
        "color_spaces": compute_color_spaces(arr),
        "segmentation": compute_segmentation(arr),
        "quality_metrics": compute_quality_metrics(arr),
        "enhancements": compute_enhancements(arr),
    }


# ------------------- MODELS -------------------
class AnalyzeUrlRequest(BaseModel):
    image_url: str
    title: Optional[str] = None


# ------------------- ROUTES -------------------
@api_router.get("/")
async def root():
    return {"app": "HistoVision", "status": "ok", "version": "1.0.0"}

@api_router.get("/samples")
async def get_samples():
    return {"samples": SAMPLE_IMAGES}

@api_router.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...), title: Optional[str] = Form(None)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    try:
        result = run_pipeline(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")
    record = await _save_history(title=title or file.filename or "Uploaded Image", source="upload", result=result)
    return {"id": record["id"], **result}

@api_router.post("/analyze/url")
async def analyze_url(req: AnalyzeUrlRequest):
    try:
        resp = requests.get(req.image_url, timeout=15)
        resp.raise_for_status()
        data = resp.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch image: {e}")
    try:
        result = run_pipeline(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")
    is_sample = any(s["url"] == req.image_url for s in SAMPLE_IMAGES)
    record = await _save_history(title=req.title or "URL Image", source="sample" if is_sample else "url", result=result)
    return {"id": record["id"], **result}

async def _save_history(title: str, source: str, result: Dict[str, Any]) -> Dict[str, Any]:
    record = {
        "id": str(uuid.uuid4()),
        "title": title,
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "dimensions": result["dimensions"],
        "quality_metrics": result["quality_metrics"],
        "thumbnail": result["color_spaces"]["rgb"],
        "full": result,
    }
    await db.analyses.insert_one(record.copy())
    return record

@api_router.get("/history")
async def list_history():
    docs = await db.analyses.find({}, {"_id": 0, "full": 0}).sort("created_at", -1).to_list(100)
    return {"items": docs}

@api_router.get("/history/{analysis_id}")
async def get_history_item(analysis_id: str):
    doc = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    full = doc.pop("full", {})
    return {**doc, **full}

@api_router.delete("/history/{analysis_id}")
async def delete_history_item(analysis_id: str):
    res = await db.analyses.delete_one({"id": analysis_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": analysis_id}

@api_router.get("/resume-bullets")
async def resume_bullets():
    md_path = ROOT_DIR.parent / "RESUME_BULLETS.md"
    if md_path.exists():
        return {"markdown": md_path.read_text(encoding="utf-8")}
    return {"markdown": "# RESUME_BULLETS.md not found"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
