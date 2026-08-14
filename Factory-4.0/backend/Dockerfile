FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# system deps for dlib/face_recognition
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake libopenblas-dev liblapack-dev libblas-dev \
    libx11-dev libgtk-3-dev libboost-all-dev wget git libjpeg-dev \
    libssl-dev libffi-dev pkg-config curl ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy requirements; ensure backend/requirements.txt includes face_recognition,dlib,imagehash,pyjwt,pillow,python-multipart,uvicorn,fastapi,requests
COPY backend/requirements.txt ./requirements.txt

RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# copy app
COPY backend/ /app

ENV PYTHONUNBUFFERED=1

# expose port and run uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
