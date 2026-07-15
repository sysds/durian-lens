"""
Durian Lens — ML Service
FastAPI + PyTorch EfficientNet-B4
Checkpoint format: plain efficientnet_b4 state dict (no wrapper class)
Keys: features.X.X.weight / classifier.X.weight
"""

from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
import os
import time, logging
import urllib.request

import torch
import torch.nn as nn
import torchvision.transforms as T
from torchvision import models
from PIL import Image
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("durian-lens-ml")

MODEL_PATH    = Path("/app/models/durian_efficientnet_b4.pth")
MODEL_URL     = os.getenv(
    "MODEL_URL",
    "https://media.githubusercontent.com/media/sysds/durian-lens/master/backend/ml_service/models/durian_efficientnet_b4.pth",
)
MODEL_VERSION = "1.0.0"
DEVICE        = torch.device("cuda" if torch.cuda.is_available() else "cpu")
ENABLE_TTA    = os.getenv("ENABLE_TTA", "false").lower() == "true"

# Will be set after loading the checkpoint
CLASSES: list[str] = []

# ── Transforms ────────────────────────────────────────────────
NORMALIZE = T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

TTA_TRANSFORMS = [
    T.Compose([T.Resize(256), T.CenterCrop(224),                          T.ToTensor(), NORMALIZE]),
    T.Compose([T.Resize(256), T.RandomHorizontalFlip(p=1.0), T.CenterCrop(224), T.ToTensor(), NORMALIZE]),
    T.Compose([T.Resize(280), T.CenterCrop(224),                          T.ToTensor(), NORMALIZE]),
]

# ── App state ─────────────────────────────────────────────────
class AppState:
    model: nn.Module | None = None
    weights_loaded: bool = False

state = AppState()


def is_lfs_pointer(path: Path) -> bool:
    if not path.exists() or path.stat().st_size > 1024:
        return False

    try:
        return path.read_text(errors="ignore").startswith("version https://git-lfs.github.com/spec")
    except Exception:
        return False


def ensure_model_file() -> None:
    if MODEL_PATH.exists() and not is_lfs_pointer(MODEL_PATH):
        return

    if not MODEL_URL:
        return

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    logger.warning(f"Downloading trained model from {MODEL_URL}")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)


def build_model(num_classes: int) -> nn.Module:
    """
    Build the exact same architecture used during training:
    plain efficientnet_b4 with a custom classifier head.
    State dict keys: features.* and classifier.*
    """
    model = models.efficientnet_b4(weights=None)          # no ImageNet weights
    in_features = model.classifier[1].in_features         # 1792
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(512, num_classes),
    )
    return model


def load_model() -> tuple[nn.Module | None, bool]:
    global CLASSES

    ensure_model_file()

    if not MODEL_PATH.exists():
        logger.warning(f"⚠️  No checkpoint at {MODEL_PATH}")
        return None, False

    logger.info(f"Loading {MODEL_PATH} ({MODEL_PATH.stat().st_size / 1e6:.1f} MB) on {DEVICE}")

    try:
        ckpt = torch.load(MODEL_PATH, map_location="cpu")
    except Exception as e:
        logger.error(f"❌ Cannot open checkpoint: {e}")
        return None, False

    # ── Read metadata ─────────────────────────────────────────
    state_dict      = ckpt.get("model_state_dict", ckpt)
    saved_classes   = ckpt.get("classes")          # e.g. ['black-thorn','d24','musang-king']
    saved_val_acc   = ckpt.get("val_acc")
    saved_epoch     = ckpt.get("epoch")

    logger.info(f"Checkpoint — epoch: {saved_epoch}, val_acc: {saved_val_acc}, classes: {saved_classes}")

    # ── Determine class list ──────────────────────────────────
    if saved_classes:
        CLASSES = list(saved_classes)
    else:
        # Infer from classifier output size
        for k, v in state_dict.items():
            if "classifier" in k and "weight" in k:
                n = v.shape[0]
                CLASSES = [f"class_{i}" for i in range(n)]
                logger.warning(f"No class names in checkpoint — using {CLASSES}")
                break

    if not CLASSES:
        CLASSES = ["black-thorn", "d24", "musang-king"]
        logger.warning("Could not determine classes — defaulting to standard 3")

    num_classes = len(CLASSES)
    logger.info(f"Classes ({num_classes}): {CLASSES}")

    # ── Build model matching checkpoint architecture ───────────
    model = build_model(num_classes)

    # ── Load weights — strict=True first, fall back to strict=False ──
    try:
        model.load_state_dict(state_dict, strict=True)
        logger.info("✅ Weights loaded (strict=True) — all layers matched")
    except Exception as e_strict:
        logger.warning(f"strict=True failed ({e_strict}), trying strict=False")
        try:
            missing, unexpected = model.load_state_dict(state_dict, strict=False)
            logger.warning(f"strict=False — missing: {len(missing)}, unexpected: {len(unexpected)}")
            if missing:
                logger.warning(f"  Missing sample: {missing[:3]}")
            if unexpected:
                logger.warning(f"  Unexpected sample: {unexpected[:3]}")
            if len(missing) > 20:
                logger.error("❌ Too many missing keys — weights essentially not loaded")
                return None, False
        except Exception as e_loose:
            logger.error(f"❌ All loading attempts failed: {e_loose}")
            return None, False

    model.to(DEVICE).eval()
    return model, True


@asynccontextmanager
async def lifespan(app: FastAPI):
    state.model, state.weights_loaded = load_model()
    if state.model is None:
        raise RuntimeError(f"Trained model checkpoint is required at {MODEL_PATH}")
    status = "trained weights" if state.weights_loaded else "RANDOM weights ⚠️"
    logger.info(f"✅ ML service ready — {status} — classes: {CLASSES}")
    yield
    state.model = None


app = FastAPI(title="Durian Lens ML Service", version=MODEL_VERSION, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class PredictResponse(BaseModel):
    variety: str
    confidence: float
    probabilities: dict[str, float]
    model_version: str
    processing_ms: int
    weights_loaded: bool


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    weights_loaded: bool
    device: str
    model_version: str
    classes: list[str]


def run_inference(image: Image.Image) -> tuple[str, float, dict]:
    all_probs = []
    transforms = TTA_TRANSFORMS if ENABLE_TTA else TTA_TRANSFORMS[:1]

    with torch.no_grad():
        for tf in transforms:
            try:
                t = tf(image).unsqueeze(0).to(DEVICE)
                logits = state.model(t)
                probs = torch.softmax(logits, dim=1).squeeze().cpu().numpy()
                all_probs.append(probs)
            except Exception as e:
                logger.warning(f"TTA failed: {e}")

    if not all_probs:
        raise RuntimeError("All TTA passes failed")

    avg      = np.mean(all_probs, axis=0)
    idx      = int(np.argmax(avg))
    probs_d  = {cls: float(round(p, 4)) for cls, p in zip(CLASSES, avg)}
    return CLASSES[idx], float(avg[idx]), probs_d


@app.get("/health", response_model=HealthResponse)
async def health():
    return {
        "status": "ok",
        "model_loaded": state.model is not None,
        "weights_loaded": state.weights_loaded,
        "device": str(DEVICE),
        "model_version": MODEL_VERSION,
        "classes": CLASSES,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(image: UploadFile = File(...)):
    logger.info(f"Predict request received: {image.filename} ({image.content_type})")

    if state.model is None:
        raise HTTPException(503, "Model not loaded")

    start = time.time()
    try:
        data = await image.read()
        logger.info(f"Predict image bytes: {len(data)}")
        img  = Image.open(BytesIO(data)).convert("RGB")
    except Exception as e:
        raise HTTPException(422, f"Cannot read image: {e}")

    if img.width < 64 or img.height < 64:
        raise HTTPException(400, "Image too small (min 64x64 px)")

    try:
        variety, confidence, probabilities = run_inference(img)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(500, "Inference failed")

    ms = int((time.time() - start) * 1000)
    logger.info(f"Prediction: {variety} ({confidence:.1%}) in {ms}ms | trained={state.weights_loaded}")

    return {
        "variety": variety,
        "confidence": round(confidence, 4),
        "probabilities": probabilities,
        "model_version": MODEL_VERSION,
        "processing_ms": ms,
        "weights_loaded": state.weights_loaded,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
