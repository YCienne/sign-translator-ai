import pytest
from fastapi.testclient import TestClient
from PIL import Image
import io
import base64
from server import app, DetectionResponse  # Import from server.py

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_model(monkeypatch):
    class MockResult:
        def __init__(self):
            self.boxes = [MockBox()]
            
    class MockBox:
        def __init__(self):
            self.xyxy = [[0, 0, 100, 100]]
            self.conf = [0.95]
            self.cls = [0]
            
    class MockModel:
        def __init__(self, *args, **kwargs):
            self.names = {0: "hello"}
            
        def __call__(self, *args, **kwargs):
            return [MockResult()]
    
    # Patch the model in server.py
    monkeypatch.setattr("server.model", MockModel())

@pytest.fixture(autouse=True)
def mock_translate(monkeypatch):
    def mock_translate_label(label, language):
        if language == "es":
            return "hola"
        return label
        
    monkeypatch.setattr("server.translate_label", mock_translate)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Sign Language Detection API!"}

def test_predict_endpoint_with_image():
    # Create test image
    img = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    
    # Make request
    files = {"file": ("test.png", img_byte_arr.getvalue(), "image/png")}
    response = client.post("/predict", files=files)
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["label"] == "hello"
    assert data[0]["confidence"] == 0.95
    assert len(data[0]["box"]) == 4

def test_websocket_predict():
    # Create test image
    img = Image.new('RGB', (100, 100))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    
    # Test WebSocket connection
    with client.websocket_connect("/ws/predict") as websocket:
        websocket.send_text(img_base64)
        data = websocket.receive_json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["label"] == "hello"