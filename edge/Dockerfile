# Menggunakan base image Python versi ringan
FROM python:3.10-slim

# Docker akan menjalankan secara otomatis saat proses build untuk menginstal FFmpeg
RUN apt-get update && apt-get install -y ffmpeg libsm6 libxext6 && rm -rf /var/lib/apt/lists/*

# Mengatur folder kerja di dalam Docker
WORKDIR /app

# Menyalin file requirements dan menginstal library Python (seperti YOLO, OpenCV)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin seluruh script Python Anda ke dalam Docker
COPY . .

# Perintah untuk menjalankan program 
CMD ["python", "main_4.py"]
