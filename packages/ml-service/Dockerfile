# ============================================
# Mail Guard AI — ML Service Dockerfile
# Optimized lightweight CPU build (~600MB)
# ============================================

# --- Stage 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 1. Install PyTorch CPU-only (prevents 6GB+ of unused NVIDIA CUDA GPU binaries)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. Install ML service requirements
COPY pyproject.toml .
RUN pip install --no-cache-dir --no-deps . && \
    pip install --no-cache-dir "fastapi>=0.115.0" "uvicorn[standard]>=0.30.0" "transformers>=4.44.0" "onnxruntime>=1.18.0" "shap>=0.46.0" "scikit-learn>=1.5.0" "pandas>=2.2.0" "numpy>=1.26.0" "pydantic>=2.8.0" "pydantic-settings>=2.4.0" "python-dotenv>=1.0.0" "httpx>=0.27.0"

# --- Stage 2: Runtime ---
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy only runtime python site-packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code and lightweight ONNX models
COPY src/ ./src/
COPY models/ ./models/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
