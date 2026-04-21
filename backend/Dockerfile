FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir -U pip

# Install CPU-only torch first — prevents sentence-transformers from pulling the 2.5 GB GPU build
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY src ./src
COPY data ./data

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000"]
