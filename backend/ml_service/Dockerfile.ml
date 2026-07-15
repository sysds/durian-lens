# ── ML Service Dockerfile ─────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY main.py .

# Copy trained model weights for hosted deployments.
COPY models ./models

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=15s --retries=5 \
  CMD sh -c 'curl -f "http://localhost:${PORT:-8000}/health" || exit 1'

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
