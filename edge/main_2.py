import json
import time
import socket
import psutil
import cv2
import platform
import threading
import requests
import os
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
# INISIALISASI MODEL & FLASK
# =====================================
model           = YOLO(MODEL_PATH)
latest_frame    = None  # frame MENTAH dari RTSP (untuk YOLO)
annotated_frame = None  # frame SUDAH ada bounding box (untuk stream dashboard)
frame_lock      = threading.Lock()
annotated_lock  = threading.Lock()
app             = Flask(__name__)
CORS(app)

# =====================================
# FLASK STREAM ENDPOINT
# stream ini kirim frame yang SUDAH ada bounding box YOLO
# =====================================
def generate_frames():
    while True:
        with annotated_lock:
            if annotated_frame is None:
                continue
            ret, buffer = cv2.imencode('.jpg', annotated_frame,
                                       [cv2.IMWRITE_JPEG_QUALITY, 75])
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
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
        print(f"[Resource] MQTT terputus (rc={rc}), mencoba reconnect...")
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
    print(f"[Resource] Terhubung ke MQTT broker {MQTT_BROKER}:{MQTT_PORT}")

    reconnect_count = 0

    while True:
        try:
            start_read = time.time()
            cap_check  = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
            ret, _     = cap_check.read()
            latency    = round((time.time() - start_read) * 1000, 2)
            fps_rtsp   = cap_check.get(cv2.CAP_PROP_FPS)
            cap_check.release()

            if not ret:
                reconnect_count += 1
                rtsp_status = "down"
                print("[Resource] RTSP tidak bisa dibaca")
            else:
                rtsp_status = "up"
        except Exception:
            rtsp_status     = "down"
            latency         = 0
            fps_rtsp        = 0
            reconnect_count += 1

        cpu_percent    = psutil.cpu_percent(interval=1)
        ram_percent    = psutil.virtual_memory().percent
        disk_percent   = psutil.disk_usage("C:\\").percent
        uptime_seconds = int(time.time() - psutil.boot_time())
        device_temp    = get_device_temperature()
        edge_status    = get_edge_status(cpu_percent, ram_percent)
        network_sent   = round(psutil.net_io_counters().bytes_sent / (1024 * 1024), 2)
        network_recv   = round(psutil.net_io_counters().bytes_recv / (1024 * 1024), 2)

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
            "stream_fps"        : round(fps_rtsp, 2),
            "rtsp_latency_ms"   : latency,
            "reconnect_count"   : reconnect_count
        }

        try:
            mqtt_client.publish(MQTT_TOPIC, json.dumps(payload), qos=1)
        except Exception as e:
            print(f"[Resource] Gagal publish MQTT: {e}")

        print(
            f"[Resource] CPU:{cpu_percent}% | RAM:{ram_percent}% | "
            f"DISK:{disk_percent}% | TEMP:{device_temp}C | "
            f"RTSP:{rtsp_status} | FPS:{round(fps_rtsp,2)} | "
            f"LATENCY:{latency}ms | EDGE:{edge_status}"
        )

        time.sleep(5)

# =====================================
# THREAD: BACA RTSP STREAM
# simpan frame MENTAH ke latest_frame
# =====================================
def rtsp_reader_thread():
    global latest_frame

    print(f"[RTSP] Menghubungkan ke {RTSP_URL}...")

    while True:
        cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
        if cap.isOpened():
            print("[RTSP] Koneksi berhasil")
            break
        print("[RTSP] Stream belum tersedia, retry 3 detik...")
        cap.release()
        time.sleep(3)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[RTSP] Frame gagal dibaca, mencoba reconnect...")
            cap.release()
            time.sleep(2)
            cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
            continue

        with frame_lock:
            latest_frame = frame.copy()

# =====================================
# COOLDOWN: HINDARI SPAM API
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
# MAIN: APD DETECTION
# =====================================
def main():
    global annotated_frame

    # Jalankan Flask stream (kirim annotated_frame ke dashboard)
    threading.Thread(target=run_flask, daemon=True).start()
    print(f"[SecVis] Flask stream aktif di http://localhost:{STREAM_PORT}/stream")

    # Jalankan resource monitoring
    threading.Thread(target=resource_monitoring_thread, daemon=True).start()
    print("[SecVis] Resource monitoring thread dimulai")

    # Jalankan RTSP reader
    threading.Thread(target=rtsp_reader_thread, daemon=True).start()
    print(f"[SecVis] RTSP reader thread dimulai → {RTSP_URL}")

    # Tunggu frame pertama tersedia
    print("[SecVis] Menunggu frame dari RTSP stream...")
    while True:
        with frame_lock:
            if latest_frame is not None:
                break
        time.sleep(0.1)

    print("[SecVis] K3 Monitoring dimulai! Tekan 'q' untuk keluar.")
    prev_time = datetime.now()

    while True:
        # Ambil frame mentah dari RTSP reader
        with frame_lock:
            frame = latest_frame.copy()

        # ── Jalankan YOLO di frame ──
        results             = model(frame, verbose=False)
        violations_detected = []

        for result in results:
            for box in result.boxes:
                confidence = float(box.conf[0])
                class_name = model.names[int(box.cls[0])]
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                color = COLORS.get(class_name, (128, 128, 128))

                # Gambar bounding box ke frame
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                label = f"{class_name} {int(confidence * 100)}%"
                (lw, lh), _ = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(frame,
                              (x1, y1 - lh - 6), (x1 + lw + 6, y1),
                              color, -1)
                cv2.putText(frame, label, (x1 + 3, y1 - 3),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)

                # Cek pelanggaran
                threshold = CONFIDENCE_THRESHOLD.get(class_name, 0.80)
                if class_name in VIOLATION_CLASSES and confidence >= threshold:
                    violations_detected.append(class_name)

                    if is_cooldown_active(class_name):
                        continue

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
                            "timestamp_deteksi" : datetime.now().strftime(
                                '%Y-%m-%d %H:%M:%S')
                        }, timeout=5)
                        print(f"[APD] Terkirim: {class_name} "
                              f"({confidence:.2f}) → {res.status_code}")
                    except Exception as e:
                        print(f"[APD] Error kirim API: {e}")

        # ── Overlay status APD ──
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

        # ── FPS counter ──
        now       = datetime.now()
        fps       = 1 / max((now - prev_time).total_seconds(), 0.001)
        prev_time = now
        cv2.putText(frame, f"FPS: {fps:.1f}", (10, frame.shape[0] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        # ── Simpan frame SUDAH TERANOTASI ke annotated_frame
        # Ini yang dikirim ke dashboard React via Flask stream ──
        with annotated_lock:
            annotated_frame = frame.copy()

        # ── Tampilkan di window lokal ──
        cv2.imshow('SecVis - K3 Monitoring', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()
    print("[SecVis] Program dihentikan.")

if __name__ == '__main__':
    main()