FROM python:3.11-alpine

WORKDIR /app

# Install runtime dependencies
# Chromium and Chromedriver are much lighter on Alpine
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    libstdc++ \
    libxml2 \
    libxslt

# Set environment variables for Alpine Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

COPY requirements.txt .

# Install build dependencies, install packages, then remove build deps
# This keeps the image extremely small
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    libxml2-dev \
    libxslt-dev \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del .build-deps

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
