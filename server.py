from fastapi import FastAPI, UploadFile, File, WebSocket
from pydantic import BaseModel
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import base64
import os
import requests  # ✅ correct import
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # add other origins if needed
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO('runs/detect/train/weights/best.pt')
print("Model loaded successfully")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class DetectionResponse(BaseModel):
    label: str
    confidence: float
    box: Optional[List[float]] = None
    translation: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to the Sign Language Detection API!"}

def translate_label(label: str, language: str) -> str:
    if not language or language == "en":
        return label
    if not GOOGLE_API_KEY:
        # Fail gracefully: return the original label if no key
        return label

    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    payload = {
        "q": label,
        "target": language,
        "format": "text",
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        return r.json()["data"]["translations"][0]["translatedText"]
    except Exception as e:
        print(f"[translate_label] Translation failed: {e}")
        return label

@app.post("/predict", response_model=List[DetectionResponse])
async def predict(file: UploadFile = File(...), language: str = 'en'):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = model(image)
        detections: List[DetectionResponse] = []
        for pred in results[0].boxes:
            x1, y1, x2, y2 = pred.xyxy[0]
            conf = float(pred.conf[0])
            cls = int(pred.cls[0])
            label = model.names[cls]
            translated_text = translate_label(label, language)
            detections.append(DetectionResponse(
                label=label,
                confidence=conf,
                box=[float(x1), float(y1), float(x2), float(y2)],
                translation=translated_text
            ))
        return detections
    except Exception as e:
        # keep the shape consistent with response_model (return empty list on error)
        print(f"/predict error: {e}")
        return []

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    # Accept language via query param, e.g. ws://.../ws/predict?lang=fr
    await websocket.accept()
    language = websocket.query_params.get("lang", "en")
    try:
        while True:
            # Expect either raw base64 string OR JSON: {"image":"...", "language":"xx"}
            msg = await websocket.receive_text()

            # If the frontend sends JSON, parse it and update language per-message.
            # We don’t import json at top to keep imports light; do it locally.
            if msg.startswith("{") and msg.endswith("}"):
                import json
                try:
                    js = json.loads(msg)
                    data = js.get("image", "")
                    if "language" in js and js["language"]:
                        language = js["language"]
                except Exception as e:
                    await websocket.send_json({"error": f"Invalid JSON: {e}"})
                    continue
            else:
                data = msg

            # Strip data URL header if present
            if "," in data and data.split(",", 1)[0].startswith("data:"):
                data = data.split(",", 1)[1]

            try:
                image_data = base64.b64decode(data)
            except Exception as e:
                await websocket.send_json({"error": f"Invalid base64: {e}"})
                continue

            try:
                image = Image.open(io.BytesIO(image_data)).convert("RGB")
            except Exception as e:
                await websocket.send_json({"error": f"Invalid image data: {e}"})
                continue

            # Run detection
            results = model(image, conf=0.15)
            detections: List[DetectionResponse] = []

            if len(results[0].boxes) > 0:
                for pred in results[0].boxes:
                    conf = float(pred.conf[0])
                    cls = int(pred.cls[0])
                    label = model.names[cls]
                    translated_text = translate_label(label, language)
                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "translation": translated_text
                    })

            await websocket.send_json(detections)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
