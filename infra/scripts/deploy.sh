#!/usr/bin/env bash
# Zero-downtime blue-green deploy for itsjaya-backend.
# Called by GitHub Actions after git pull — do not run this before pulling.
set -euo pipefail

ENV_FILE="/home/ubuntu/itsjaya.env"
IMAGE="itsjaya-backend"
DATA_DIR="/data"

# ── 1. Tag current image as :previous for rollback ───────────────────────────
docker tag "${IMAGE}:latest" "${IMAGE}:previous" 2>/dev/null || true

# ── 2. Build new image ────────────────────────────────────────────────────────
echo "[deploy] Building new image..."
docker build -t "${IMAGE}:latest" ./backend
echo "[deploy] Build complete."

# ── 3. Start new container on staging port 8001 ───────────────────────────────
docker rm -f itsjaya-backend-new 2>/dev/null || true

docker run -d \
  --name itsjaya-backend-new \
  --restart no \
  --env-file "$ENV_FILE" \
  -v "${DATA_DIR}:/data" \
  -p 8001:8000 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "${IMAGE}:latest"

# ── 4. Health check — up to 120s for ONNX model warmup ───────────────────────
echo "[deploy] Waiting for new container to pass health check..."
HEALTHY=0
for i in $(seq 1 24); do
  if curl -sf http://localhost:8001/health > /dev/null 2>&1; then
    HEALTHY=1
    echo "[deploy] Health check passed after $((i * 5))s."
    break
  fi
  echo "[deploy] Attempt $i/24 — not ready, waiting 5s..."
  sleep 5
done

if [ "$HEALTHY" -eq 0 ]; then
  echo "[deploy] ERROR: New container failed health check. Old container still running."
  docker rm -f itsjaya-backend-new || true
  exit 1
fi

# ── 5. Swap — stop old, start new on port 8000 ───────────────────────────────
docker stop itsjaya-backend 2>/dev/null || true
docker rm   itsjaya-backend 2>/dev/null || true
docker rm -f itsjaya-backend-new

docker run -d \
  --name itsjaya-backend \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -v "${DATA_DIR}:/data" \
  -p 8000:8000 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "${IMAGE}:latest"

# ── 6. Prune dangling images, keep :previous ─────────────────────────────────
docker image prune -f
echo "[deploy] Deploy complete."
