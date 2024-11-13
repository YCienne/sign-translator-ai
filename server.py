from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import torch
from PIL import Image
import io
from ultralytics import YOLO
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] to allow all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your YOLO model
model = YOLO('runs/detect/train/weights/best.pt')
print("Model loaded successfully")

class DetectionResponse(BaseModel):
    label: str
    confidence: float
    box: list
    translation: Optional[str] = None

@app.post("/predict", response_model=list[DetectionResponse])
async def predict(file: UploadFile = File(...), language: str = 'English'):
    try:
        # Read and open the image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Run inference with the YOLO model
        results = model(image)
        
        detections = []
        for pred in results[0].boxes:
            x1, y1, x2, y2 = pred.xyxy[0]
            conf = pred.conf[0]
            cls = pred.cls[0]
            label = model.names[int(cls)]
            translated_text = translate_label(label, language)
            detection = {
                "label": f"{label}",  # Append language for demonstration
                "confidence": float(conf),
                "box": [float(x1), float(y1), float(x2), float(y2)],
                "translation": translated_text
            }
            detections.append(detection)
        
        return detections

    except Exception as e:
        return {"error": str(e)}
    
def translate_label(label, language):
    translations = {
        "Spanish": "Traducción en español",
        "French": "Traduction en français",
        "Korean": "한국어 번역",
        # Add translations as needed
    }
    return translations.get(language, label)