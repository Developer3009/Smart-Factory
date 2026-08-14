import os
import io
import json
import time
from datetime import datetime, timedelta
from typing import Optional
from PIL import Image
import imagehash
import jwt
import json
import math

from fastapi import HTTPException
from src.db.connection import get_db_connection

# Optional: prefer face_recognition when available for better accuracy
try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except Exception:
    FACE_REC_AVAILABLE = False

JWT_SECRET = os.getenv('JWT_SECRET', 'dev_secret')
JWT_ALGO = 'HS256'
JWT_EXP_MINUTES = int(os.getenv('JWT_EXP_MINUTES', '1440'))

PHASH_THRESHOLD = int(os.getenv('PHASH_THRESHOLD', '8'))  # hamming distance threshold
FACE_EMBED_THRESHOLD = float(os.getenv('FACE_EMBED_THRESHOLD', '0.6'))  # Euclidean distance threshold for face embeddings


def _compute_phash_from_bytes(image_bytes: bytes) -> str:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        ph = imagehash.phash(img)
        return ph.__str__()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")


def _compute_face_embedding_from_bytes(image_bytes: bytes):
    if not FACE_REC_AVAILABLE:
        raise RuntimeError('face_recognition library not available')
    try:
        # face_recognition can load from file-like objects
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        encs = face_recognition.face_encodings(image)
        if not encs:
            raise HTTPException(status_code=400, detail='No face found in image')
        # use the first face found
        return encs[0].tolist()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image / face processing error: {e}")


def register_face(name: str, role: str, image_bytes: bytes):
    conn = get_db_connection()
    cur = conn.cursor()
    now = datetime.now().isoformat()

    phash = None
    embedding_json = None
    if FACE_REC_AVAILABLE:
        emb = _compute_face_embedding_from_bytes(image_bytes)
        embedding_json = json.dumps(emb)
        # also compute phash for fallback
        try:
            phash = _compute_phash_from_bytes(image_bytes)
        except Exception:
            phash = None
    else:
        phash = _compute_phash_from_bytes(image_bytes)

    # insert user (or update if email/name exists) -- keep simple for prototype
    cur.execute("SELECT user_id FROM users WHERE email = ? OR name = ?", (None, name))
    row = cur.fetchone()
    if row:
        user_id = row[0] if not isinstance(row, dict) else row.get('user_id')
        cur.execute("UPDATE users SET role = ?, face_hash = ?, face_embedding = ?, face_registered_at = ? WHERE user_id = ?", (role, phash, embedding_json, now, user_id))
    else:
        cur.execute("INSERT INTO users (name, role, email, password_hash, face_hash, face_embedding, face_registered_at) VALUES (?, ?, ?, ?, ?, ?, ?)", (name, role, None, None, phash, embedding_json, now))
        user_id = getattr(cur, 'lastrowid', None)
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "registered", "user_id": user_id, "role": role}


def _hamming(a: str, b: str) -> int:
    # both strings are hex from imagehash
    try:
        ha = imagehash.hex_to_hash(a)
        hb = imagehash.hex_to_hash(b)
        return ha - hb
    except Exception:
        return 999


def _euclidean(a, b):
    # a and b are lists
    try:
        s = 0.0
        for x, y in zip(a, b):
            d = x - y
            s += d * d
        return math.sqrt(s)
    except Exception:
        return 1e9


def find_user_by_image(image_bytes: bytes) -> Optional[dict]:
    conn = get_db_connection()
    conn.row_factory = None
    cur = conn.cursor()

    if FACE_REC_AVAILABLE:
        probe = _compute_face_embedding_from_bytes(image_bytes)
        cur.execute("SELECT user_id, name, role, face_embedding FROM users WHERE face_embedding IS NOT NULL")
        candidates = cur.fetchall()
        best = None
        best_dist = 1e9
        for row in candidates:
            if isinstance(row, dict):
                uid = row.get('user_id')
                name = row.get('name')
                role = row.get('role')
                emb_json = row.get('face_embedding')
            else:
                uid, name, role, emb_json = row
            if not emb_json:
                continue
            try:
                emb = json.loads(emb_json)
            except Exception:
                continue
            d = _euclidean(probe, emb)
            if d < best_dist:
                best_dist = d
                best = {"user_id": uid, "name": name, "role": role, "dist": d}
        cur.close(); conn.close()
        if best and best['dist'] <= FACE_EMBED_THRESHOLD:
            return best
        return None

    # fallback to phash
    phash = _compute_phash_from_bytes(image_bytes)
    cur.execute("SELECT user_id, name, role, face_hash FROM users WHERE face_hash IS NOT NULL")
    candidates = cur.fetchall()
    best = None
    best_dist = 999
    for row in candidates:
        if isinstance(row, dict):
            uid = row.get('user_id')
            name = row.get('name')
            role = row.get('role')
            fh = row.get('face_hash')
        else:
            uid, name, role, fh = row
        if not fh:
            continue
        d = _hamming(phash, fh)
        if d < best_dist:
            best_dist = d
            best = {"user_id": uid, "name": name, "role": role, "dist": d}
    cur.close(); conn.close()
    if best and best['dist'] <= PHASH_THRESHOLD:
        return best
    return None


def create_jwt(user_id: int, role: str, name: str):
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)
    payload = {"sub": str(user_id), "role": role, "name": name, "exp": exp}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    return token


def verify_jwt(token: str) -> dict:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return data
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
