import cv2
import requests
import os
import threading
from flask import Flask, Response
from flask_cors import CORS
from ultralytics import YOLO
from datetime import datetime

# ─── Konfigurasi ────────────────────────────────────────────────
model             = YOLO('best.pt')
API_URL           = os.environ.get('API_URL', 'http://127.0.0.1:8000/api/violations')
CAMERA_ID         = int(os.environ.get('CAMERA_ID', 1))
STREAM_PORT       = 5001
STORAGE_PATH      = os.environ.get('STORAGE_PATH', r"C:\xampp\htdocs\SecVis\backend\storage\app\public")
VIOLATION_CLASSES = ['no-helmet', 'no-vest', 'no-boots', 'no-gloves', 'no-glasses']

# Threshold per kelas
CONFIDENCE_THRESHOLD = {
    'no-helmet'  : 0.50,
    'no-vest'    : 0.50,
    'no-boots'   : 0.50,
    'no-gloves'  : 0.80,
    'no-glasses' : 0.50,
}

COLORS = {
    'helmet'    : (0, 255, 0), 'glasses'   : (0, 255, 0),
    'gloves'    : (0, 255, 0), 'vest'      : (0, 255, 0),
    'boots'     : (0, 255, 0),
    'no-helmet' : (0, 0, 255), 'no-glasses': (0, 0, 255),
    'no-gloves' : (0, 0, 255), 'no-vest'   : (0, 0, 255),
    'no-boots'  : (0, 0, 255), 'person'    : (0, 255, 255),
}

latest_frame = None
frame_lock   = threading.Lock()
app          = Flask(__name__)
CORS(app)

def generate_frames():
    while True:
        with frame_lock:
            if latest_frame is None:
                continue
            ret, buffer = cv2.imencode('.jpg', latest_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
        )

@app.route('/stream')
def stream():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    return {'status': 'ok', 'camera_id': CAMERA_ID}

def run_flask():
    app.run(host='0.0.0.0', port=STREAM_PORT, debug=False, threaded=True)

def main():
    global latest_frame

    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    print(f"[SecVis] Stream aktif di http://localhost:{STREAM_PORT}/stream")

    cap = cv2.VideoCapture(0)
    print("[SecVis] K3 Monitoring dimulai...")

    prev_time = datetime.now()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame, verbose=False)
        violations_detected = []

        for result in results:
            for box in result.boxes:
                confidence = float(box.conf[0])
                class_name = model.names[int(box.cls[0])]
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                color = COLORS.get(class_name, (128, 128, 128))

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                label = f"{class_name} {int(confidence * 100)}%"
                (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(frame, (x1, y1 - lh - 6), (x1 + lw + 6, y1), color, -1)
                cv2.putText(frame, label, (x1 + 3, y1 - 3),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

                threshold = CONFIDENCE_THRESHOLD.get(class_name, 0.80)
                if class_name in VIOLATION_CLASSES and confidence >= threshold:
                    violations_detected.append(class_name)

                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    tanggal   = datetime.now().strftime('%Y-%m-%d')
                    filename  = f"cam{CAMERA_ID}_{timestamp}.jpg"
                    foto_path = f"violations/{tanggal}/{filename}"

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
                        print(f"[{datetime.now()}] Error kirim API: {e}")

        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (frame.shape[1], 90), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

        if violations_detected:
            cv2.putText(frame, "PELANGGARAN K3", (10, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            missing = ', '.join(sorted(set(violations_detected)))
            cv2.putText(frame, f"Missing: {missing}", (10, 62),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        else:
            cv2.putText(frame, "APD Lengkap", (10, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.putText(frame, "Semua APD terdeteksi", (10, 62),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 0), 1)

        now = datetime.now()
        fps = 1 / max((now - prev_time).total_seconds(), 0.001)
        prev_time = now
        cv2.putText(frame, f"FPS: {fps:.1f}", (10, frame.shape[0] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        with frame_lock:
            latest_frame = frame.copy()

        cv2.imshow('SecVis - K3 Monitoring', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()