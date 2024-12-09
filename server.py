from fastapi import FastAPI, UploadFile, File, Form, WebSocket
from pydantic import BaseModel
from PIL import Image
import io
from ultralytics import YOLO
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import base64
import pickle

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_methods=["*"],
    allow_headers=["*"],
)


model = YOLO('runs/detect/train/weights/best.pt')
print("Model loaded successfully")

model_2 = pickle.load(open('./model.p', 'rb'))

class DetectionResponse(BaseModel):
    label: str
    confidence: float
    box: list
    translation: Optional[str] = None
    
@app.get("/")
async def root():
    return {"message": "Welcome to the Sign Language Detection API!"}

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
                "label": f"{label}",  
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
        
    }
    return translations.get(language, label)

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            try:
                data = await websocket.receive_text()
                # print(f"Received Base64 string length: {len(data)}")
                # print(f"Base64 string preview: {data[:50]}...")
                image_data = base64.b64decode(data)
                print("Received and decoded image")  
                # with open("frame.jpg", "wb") as f:
                #     f.write(image_data)
                # Image.open("frame.jpg").show()
                try:
                    image = Image.open(io.BytesIO(image_data)).convert("RGB")
                    print("Image converted to PIL.Image")
                except Exception as e:
                    print(f"Error converting image: {e}")
                    await websocket.send_json({"error": "Invalid image data"})
                    continue
                results = model(image, conf = 0.25)
                # print("Model inference results:", results)
                
                detections = []
                for pred in results[0].boxes:
                    print("Prediction box:", pred.xyxy[0], "Confidence:", pred.conf[0], "Class:", pred.cls[0])
                    if len(results[0].boxes) == 0:
                        print("No detections in this frame.")
                        continue
                    conf = pred.conf[0]
                    cls = pred.cls[0]
                    label = model.names[int(cls)]
                    detection = {
                        "label": f"{label}",  
                        "confidence": float(conf),
                        
                    }
                    detections.append(detection)
                    
                    return detections
                
                print("Sending detections:", detections)  
                await websocket.send_json(detections)
            except Exception as e:
                print(f"Error processing frame: {e}")  
                await websocket.send_json({"error": str(e)})
    except Exception as e:
        print(f"WebSocket error: {e}")  
    finally:
        await websocket.close()
