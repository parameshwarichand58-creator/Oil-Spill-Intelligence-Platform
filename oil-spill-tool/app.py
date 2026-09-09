from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

ship_model = YOLO('yolov8n.pt')

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"error": "Invalid image"}

    results = ship_model(img)
    ship_found = False
    for r in results:
        for box in r.boxes:
            ship_found = True

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, (0, 70, 50), (10, 255, 255))
    oil_pixels = np.count_nonzero(mask)
    oil_found = oil_pixels > 1000

    if oil_found and ship_found:
        status = "CULPRIT SHIP IDENTIFIED! Ship is adjacent to the oil slick."
    elif oil_found:
        status = "OIL SPILL DETECTED! But no ship in frame."
    else:
        status = "No oil spill detected in this image."

    return {"result": status, "oil_pixels": int(oil_pixels)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
