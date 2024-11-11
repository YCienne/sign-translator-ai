from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import torch
from PIL import Image
import io
from ultralytics import YOLO
import numpy as np


app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Welcome to the Sign Language Detection API!"}


# Load your YOLO model 
model = YOLO('runs/detect/train/weights/best.pt')
print("Model loaded successfully")


class DetectionResponse(BaseModel):
    label: str
    confidence: float
    box: list

@app.post("/predict", response_model=list[DetectionResponse])
async def predict(file: UploadFile = File(...)):
    try:
        # Read and open the image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Run inference with the YOLO model
        results = model(image)
        print(results)  # Check output format
        
        detections = []
        # Access predictions based on `results` structure observed
        for pred in results[0].boxes:
            x1, y1, x2, y2 = pred.xyxy[0]
            conf = pred.conf[0]
            cls = pred.cls[0]
            label = model.names[int(cls)]
            detection = {
                "label": label,
                "confidence": float(conf),
                "box": [float(x1), float(y1), float(x2), float(y2)]
            }
            detections.append(detection)
        
        return detections

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}


    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}
