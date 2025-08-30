from fastapi import FastAPI, UploadFile, File, WebSocket, Form
from pydantic import BaseModel
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import base64
import os
import requests  
from ultralytics import YOLO
from google.cloud import translate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "runs", "detect", "train", "weights", "best.pt")
model = YOLO(MODEL_PATH)
print("Model loaded successfully")

PROJECT_ID = os.getenv("PROJECT_ID", " ")
LOCATION = "global"

client = translate.TranslationServiceClient()
PARENT = f"projects/{PROJECT_ID}/locations/{LOCATION}"


class DetectionResponse(BaseModel):
    label: str
    confidence: float
    box: Optional[List[float]] = None
    translation: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to the Sign Language Detection API!"}

def translate_text(text: str, language: str, source_lang: str = "en") -> str:
    if not text or not language or language == "en":
        return text
    
    try:
        response = client.translate_text(
        request={
            "parent": PARENT,
            "contents": [text],
            "mime_type": "text/plain",
            "source_language_code": source_lang,
            "target_language_code": language
        }
    )
        return response.translations[0].translated_text
    except Exception as e:
        print(f"[translate_text] Translation failed: {e}")
        return text

@app.post("/predict", response_model=List[DetectionResponse])
async def predict(file: UploadFile = File(...), language: str = Form("en")):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = model(image)
        detections: List[DetectionResponse] = []
        for pred in results[0].boxes:
            x1, y1, x2, y2 = pred.xyxy[0]
            conf = float(pred.conf[0])
            cls = int(pred.cls[0])
            pred.label = model.names[cls]
            translations = translate_text(pred.label, language)
            detections.append(DetectionResponse(
                label=pred.label,
                confidence=conf,
                box=[float(x1), float(y1), float(x2), float(y2)],
                translation=translations
            ))
        return detections
    except Exception as e:
        print(f"/predict error: {e}")
        return []

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket, language: str = 'en' ):
    # Accept language via query param, ws://.../ws/predict?lang=fr
    await websocket.accept()
    language = websocket.query_params.get("lang", "en")
    try:
        while True:
            # Expect either raw base64 string OR JSON: {"image":"...", "language":"xx"}
            msg = await websocket.receive_text()

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

                    translations = translate_text(label, language)
                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "translation": translations
                    })

            await websocket.send_json(detections)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
