import json
import time
import socket
import psutil
import cv2
import platform
import threading
import requests
import os
import queue
from flask import Flask, Response
from flask_cors import CORS
from ultralytics import YOLO
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

# =====================================
# KONFIGURASI UMUM
# =====================================
DEVICE_NAME = socket.gethostname()

# ─── RTSP (MediaMTX) ─────────────────
RTSP_URL = "rtsp://localhost:8554/webcam"

# ─── MQTT (Resource Monitoring) ──────
MQTT_BROKER = "127.0.0.1"
MQTT_PORT   = 1883
MQTT_TOPIC  = "pt_epson/edge/resource"

# ─── APD Detection ───────────────────
MODEL_PATH   = r'C:\xampp\htdocs\SecVis\edge\best.pt'
API_URL      = os.environ.get('API_URL', 'http://127.0.0.1:8000/api/violations')
CAMERA_ID    = int(os.environ.get('CAMERA_ID', 1))
STREAM_PORT  = 5001
STORAGE_PATH = os.environ.get(
    'STORAGE_PATH',
    r"C:\xampp\htdocs\SecVis\backend\storage\app\public"
)

# ─── OPTIMASI CPU ────────────────────
INFER_WIDTH     = 416
INFER_HEIGHT    = 416
FRAME_SKIP      = 2
STREAM_FPS      = 15
STREAM_INTERVAL = 1.0 / STREAM_FPS

VIOLATION_CLASSES = ['no-helmet', 'no-vest', 'no-boots', 'no-gloves', 'no-glasses']

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

# =====================================
# INISIALISASI MODEL ONNX
# =====================================
print("[SecVis] Loading model YOLO...")
model = YOLO(MODEL_PATH)

ONNX_PATH = MODEL_PATH.replace('.pt', '.onnx')
if not os.path.exists(ONNX_PATH):
    print("[SecVis] Export model ke ONNX untuk optimasi CPU...")
    model.export(format='onnx', imgsz=INFER_WIDTH, simplify=True)
    print(f"[SecVis] ONNX tersimpan di {ONNX_PATH}")

model_onnx = YOLO(ONNX_PATH)
print("[SecVis] Model ONNX siap")

# =====================================
# SHARED STATE
# =====================================
latest_frame     = None
annotated_frame  = None
last_frame_time  = 0.0   # ← waktu frame terakhir diterima dari RTSP
frame_lock       = threading.Lock()
annotated_lock   = threading.Lock()

# =====================================
# ANTRIAN PELANGGARAN
# =====================================
violation_queue = queue.Queue()

def violation_worker():
    """
    Dedicated thread untuk proses pelanggaran.
    Tulis foto ke disk + kirim API satu per satu
    tanpa blocking main loop sama sekali.
    """
    while True:
        try:
            data = violation_queue.get(timeout=1)
        except queue.Empty:
            continue

        try:
            class_name = data["class_name"]
            confidence = data["confidence"]
            frame      = data["frame"]
            now        = data["timestamp"]

            timestamp = now.strftime('%Y%m%d_%H%M%S')
            tanggal   = now.strftime('%Y-%m-%d')
            filename  = f"cam{CAMERA_ID}_{timestamp}.jpg"
            foto_path = f"violations/{tanggal}/{filename}"
            folder    = os.path.join(STORAGE_PATH, 'violations', tanggal)
            os.makedirs(folder, exist_ok=True)

            foto_frame = cv2.resize(frame, (640, 480))
            cv2.imwrite(os.path.join(folder, filename), foto_frame,
                        [cv2.IMWRITE_JPEG_QUALITY, 70])

            res = requests.post(API_URL, json={
                "camera_id"         : CAMERA_ID,
                "jenis_pelanggaran" : class_name,
                "confidence_score"  : round(confidence * 100, 2),
                "foto_bukti"        : foto_path,
                "timestamp_deteksi" : now.strftime('%Y-%m-%d %H:%M:%S')
            }, timeout=5)
            print(f"[APD] Terkirim: {class_name} ({confidence:.2f}) → {res.status_code}")

        except Exception as e:
            print(f"[APD] Error simpan/kirim: {e}")
        finally:
            violation_queue.task_done()

# =====================================
# FLASK STREAM
# =====================================
app = Flask(__name__)
CORS(app)

def generate_frames():
    last_sent = 0
    while True:
        now = time.time()

        if now - last_sent < STREAM_INTERVAL:
            time.sleep(0.005)
            continue

        with annotated_lock:
            if annotated_frame is None:
                time.sleep(0.01)
                continue
            ret, buffer = cv2.imencode('.jpg', annotated_frame,
                                       [cv2.IMWRITE_JPEG_QUALITY, 55])
            if not ret:
                continue
            frame_bytes = buffer.tobytes()

        last_sent = time.time()
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
        )

@app.route('/stream')
def stream():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    return {'status': 'ok', 'camera_id': CAMERA_ID}

def run_flask():
    app.run(host='0.0.0.0', port=STREAM_PORT, debug=False, threaded=True)

# =====================================
# FUNGSI BANTUAN RESOURCE MONITORING
# =====================================
def get_edge_status(cpu, ram):
    if cpu >= 95 or ram >= 95:
        return "critical"
    elif cpu >= 80 or ram >= 80:
        return "warning"
    return "healthy"

def get_device_temperature():
    try:
        if platform.system() == "Linux":
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    for entry in entries:
                        return round(entry.current, 2)
        return 0
    except:
        return 0

# =====================================
# THREAD: RESOURCE MONITORING via MQTT
# =====================================
def resource_monitoring_thread():
    def on_disconnect(client, userdata, rc):
        print(f"[Resource] MQTT terputus (rc={rc}), reconnect...")
        while True:
            try:
                client.reconnect()
                print("[Resource] MQTT reconnect berhasil")
                break
            except Exception:
                time.sleep(5)

    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
    mqtt_client.on_disconnect = on_disconnect

    while True:
        try:
            mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            break
        except Exception as e:
            print(f"[Resource] Gagal konek MQTT: {e}, retry 5 detik...")
            time.sleep(5)

    mqtt_client.loop_start()
    print(f"[Resource] Terhubung ke MQTT {MQTT_BROKER}:{MQTT_PORT}")

    reconnect_count = 0

    while True:
        # Cek RTSP dari shared state — tidak buka koneksi baru
        with frame_lock:
            has_frame  = latest_frame is not None
            frame_age  = time.time() - last_frame_time if has_frame else 0

        if has_frame:
            rtsp_status = "up"
            # Latency = usia frame sejak terakhir diterima (ms)
            latency = round(frame_age * 1000, 2)
        else:
            rtsp_status     = "down"
            latency         = 0.0
            reconnect_count += 1

        fps_rtsp = float(STREAM_FPS)

        # interval=0 → non-blocking
        cpu_percent    = psutil.cpu_percent(interval=0)
        ram_percent    = psutil.virtual_memory().percent
        disk_percent   = psutil.disk_usage("C:\\").percent
        uptime_seconds = int(time.time() - psutil.boot_time())
        device_temp    = get_device_temperature()
        edge_status    = get_edge_status(cpu_percent, ram_percent)
        network_sent   = round(psutil.net_io_counters().bytes_sent / (1024**2), 2)
        network_recv   = round(psutil.net_io_counters().bytes_recv / (1024**2), 2)

        payload = {
            "device_name"       : DEVICE_NAME,
            "timestamp"         : datetime.now(timezone.utc).isoformat(),
            "cpu_percent"       : cpu_percent,
            "ram_percent"       : ram_percent,
            "disk_percent"      : disk_percent,
            "edge_status"       : edge_status,
            "uptime_seconds"    : uptime_seconds,
            "device_temperature": device_temp,
            "network_sent_mb"   : network_sent,
            "network_recv_mb"   : network_recv,
            "rtsp_status"       : rtsp_status,
            "stream_fps"        : fps_rtsp,
            "rtsp_latency_ms"   : latency,
            "reconnect_count"   : reconnect_count
        }

        try:
            mqtt_client.publish(MQTT_TOPIC, json.dumps(payload), qos=1)
        except Exception as e:
            print(f"[Resource] Gagal publish MQTT: {e}")

        print(
            f"[Resource] CPU:{cpu_percent}% | RAM:{ram_percent}% | "
            f"DISK:{disk_percent}% | RTSP:{rtsp_status} | "
            f"FPS:{fps_rtsp} | LATENCY:{latency}ms | "
            f"EDGE:{edge_status}"
        )

        # Sleep 4 detik → total loop ~4-5 detik
        # sesuai interval = "5s" di telegraf.conf
        time.sleep(4)

# =====================================
# THREAD: BACA RTSP
# =====================================
def rtsp_reader_thread():
    global latest_frame, last_frame_time

    print(f"[RTSP] Menghubungkan ke {RTSP_URL}...")
    while True:
        cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if cap.isOpened():
            print("[RTSP] Koneksi berhasil")
            break
        print("[RTSP] Stream belum tersedia, retry 3 detik...")
        cap.release()
        time.sleep(3)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[RTSP] Reconnect...")
            cap.release()
            time.sleep(2)
            cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            continue
        with frame_lock:
            latest_frame    = frame.copy()
            last_frame_time = time.time()  # ← catat waktu frame diterima

# =====================================
# COOLDOWN
# =====================================
last_violation_time = {}
COOLDOWN_SECONDS    = 10

def is_cooldown_active(class_name):
    now  = time.time()
    last = last_violation_time.get(class_name, 0)
    if now - last < COOLDOWN_SECONDS:
        return True
    last_violation_time[class_name] = now
    return False

# =====================================
# HELPER: GAMBAR BOUNDING BOX
# =====================================
def draw_boxes(frame, results, h_orig, w_orig):
    for result in results:
        for box in result.boxes:
            confidence = float(box.conf[0])
            class_name = model_onnx.names[int(box.cls[0])]
            x1 = int(box.xyxy[0][0] * w_orig / INFER_WIDTH)
            y1 = int(box.xyxy[0][1] * h_orig / INFER_HEIGHT)
            x2 = int(box.xyxy[0][2] * w_orig / INFER_WIDTH)
            y2 = int(box.xyxy[0][3] * h_orig / INFER_HEIGHT)
            color = COLORS.get(class_name, (128, 128, 128))

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"{class_name} {int(confidence * 100)}%"
            (lw, lh), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(frame,
                          (x1, y1 - lh - 6), (x1 + lw + 6, y1),
                          color, -1)
            cv2.putText(frame, label, (x1 + 3, y1 - 3),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

# =====================================
# MAIN: APD DETECTION
# =====================================
def main():
    global annotated_frame

    threading.Thread(target=run_flask, daemon=True).start()
    print(f"[SecVis] Flask stream → http://localhost:{STREAM_PORT}/stream")

    threading.Thread(target=violation_worker, daemon=True).start()
    print("[SecVis] Violation worker thread dimulai")

    threading.Thread(target=resource_monitoring_thread, daemon=True).start()
    print("[SecVis] Resource monitoring thread dimulai")

    threading.Thread(target=rtsp_reader_thread, daemon=True).start()
    print(f"[SecVis] RTSP reader → {RTSP_URL}")

    print("[SecVis] Menunggu frame dari RTSP...")
    while True:
        with frame_lock:
            if latest_frame is not None:
                break
        time.sleep(0.1)

    print("[SecVis] K3 Monitoring dimulai! Tekan Ctrl+C untuk stop.")

    frame_count     = 0
    last_results    = []
    last_violations = []

    while True:
        with frame_lock:
            frame = latest_frame.copy()

        h_orig, w_orig = frame.shape[:2]
        frame_count   += 1
        frame_resized  = cv2.resize(frame, (INFER_WIDTH, INFER_HEIGHT))

        if frame_count % FRAME_SKIP == 0:
            results             = model_onnx(frame_resized, verbose=False)
            last_results        = results
            violations_detected = []

            for result in results:
                for box in result.boxes:
                    confidence = float(box.conf[0])
                    class_name = model_onnx.names[int(box.cls[0])]
                    threshold  = CONFIDENCE_THRESHOLD.get(class_name, 0.80)

                    if class_name in VIOLATION_CLASSES and confidence >= threshold:
                        violations_detected.append(class_name)

                        if not is_cooldown_active(class_name):
                            violation_queue.put({
                                "class_name" : class_name,
                                "confidence" : confidence,
                                "frame"      : frame.copy(),
                                "timestamp"  : datetime.now()
                            })

            draw_boxes(frame, results, h_orig, w_orig)
            last_violations = violations_detected

        else:
            violations_detected = last_violations
            draw_boxes(frame, last_results, h_orig, w_orig)

        # ── Overlay status APD ──
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w_orig, 90), (0, 0, 0), -1)
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

        # ── Update annotated frame untuk dashboard ──
        with annotated_lock:
            annotated_frame = frame.copy()

if __name__ == '__main__':
    main()