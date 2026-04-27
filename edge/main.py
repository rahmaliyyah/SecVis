import cv2
import requests
import os
from ultralytics import YOLO
from datetime import datetime

# Load model
model = YOLO('best.pt')

# Konfigurasi
API_URL = "http://127.0.0.1:8000/api/violations"
CAMERA_ID = 1
CONFIDENCE_THRESHOLD = 0.5

# Path storage Laravel
STORAGE_PATH = r"C:\xampp\htdocs\SecVis\backend\storage\app\public"

VIOLATION_CLASSES = ['no-helmet', 'no-vest', 'no-boots', 'no-gloves', 'no-glasses']

cap = cv2.VideoCapture(0)
print("SecVis Edge Device - Monitoring dimulai...")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)

    for result in results:
        for box in result.boxes:
            confidence = float(box.conf[0])
            class_name = model.names[int(box.cls[0])]

            if class_name in VIOLATION_CLASSES and confidence >= CONFIDENCE_THRESHOLD:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                tanggal   = datetime.now().strftime('%Y-%m-%d')
                filename  = f"cam1_{timestamp}.jpg"
                foto_path = f"violations/{tanggal}/{filename}"

                # Simpan foto ke storage Laravel
                folder = os.path.join(STORAGE_PATH, 'violations', tanggal)
                os.makedirs(folder, exist_ok=True)
                cv2.imwrite(os.path.join(folder, filename), frame)

                try:
                    res = requests.post(API_URL, json={
                        "camera_id"         : CAMERA_ID,
                        "jenis_pelanggaran" : class_name,
                        "confidence_score"  : round(confidence * 100, 2),
                        "foto_bukti"        : foto_path,
                        "timestamp_deteksi" : datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }, timeout=5)
                    print(f"[{datetime.now()}] Terkirim: {class_name} ({confidence:.2f}) → {res.status_code}")
                except Exception as e:
                    print(f"[{datetime.now()}] Error: {e}")

    cv2.imshow('SecVis - Monitoring APD', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()