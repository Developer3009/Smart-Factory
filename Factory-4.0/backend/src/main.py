from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from src.db.connection import get_db_connection, is_postgres
from src.simulator.engine import simulator_engine
from src.agent.ml import run_predictive_maintenance
from src.agent.llm import run_chat, run_agent
from src.auth import register_face, find_user_by_image, create_jwt, verify_jwt
import os
import requests
import json
from datetime import datetime
from fastapi import Depends, Header

app = FastAPI(title="FAS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    ensure_schema()
    simulator_engine.start()

@app.on_event("shutdown")
def shutdown_event():
    simulator_engine.stop()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

# Models
class SpeedRequest(BaseModel):
    multiplier: float

class MachineIdRequest(BaseModel):
    machine_id: int

class InventoryRefillRequest(BaseModel):
    quantity: int = 0

class ChatRequest(BaseModel):
    question: str


def ensure_schema():
    conn = get_db_connection()
    cur = conn.cursor()
    # inventory column
    if is_postgres():
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory'")
        cols = [r['column_name'] if isinstance(r, dict) else r[0] for r in cur.fetchall()]
        if 'last_restocked_at' not in cols:
            cur.execute("ALTER TABLE inventory ADD COLUMN last_restocked_at TIMESTAMP")
    else:
        cur.execute("PRAGMA table_info(inventory)")
        columns = [col[1] for col in cur.fetchall()]
        if 'last_restocked_at' not in columns:
            cur.execute("ALTER TABLE inventory ADD COLUMN last_restocked_at TEXT")

    # users face columns
    if is_postgres():
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
        cols = [r['column_name'] if isinstance(r, dict) else r[0] for r in cur.fetchall()]
        if 'face_hash' not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN face_hash TEXT")
        if 'face_registered_at' not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN face_registered_at TIMESTAMP")
        if 'last_seen' not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP")
    else:
        cur.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cur.fetchall()]
        if 'face_hash' not in columns:
            cur.execute("ALTER TABLE users ADD COLUMN face_hash TEXT")
        if 'face_registered_at' not in columns:
            cur.execute("ALTER TABLE users ADD COLUMN face_registered_at TEXT")
        if 'last_seen' not in columns:
            cur.execute("ALTER TABLE users ADD COLUMN last_seen TEXT")

    conn.commit()
    cur.close()
    conn.close()


def create_alert(message: str, severity: str = "warning"):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO alerts (message, severity, created_at, resolved) VALUES (?, ?, ?, 0)",
        (message, severity, datetime.now().isoformat())
    )
    conn.commit()
    cur.close()
    conn.close()

# Simulator Endpoints
@app.post("/api/simulator/start")
def start_simulator():
    simulator_engine.start()
    return {"status": "Simulator started"}


from fastapi import File, UploadFile, Form

# Face / Auth endpoints (prototype)
@app.post('/api/auth/register-face')
async def api_register_face(name: str = Form(...), role: str = Form(...), file: UploadFile = File(...)):
    """Register a user with a face image (multipart/form-data: name, role, file)
    Returns JWT token and user info so the client can auto-login and show the dashboard.
    Prototype only — secure and production hardening required.
    """
    if not file:
        raise HTTPException(status_code=400, detail='image file required')
    data = await file.read()
    res = register_face(name, role, data)
    # If registration succeeded, create a JWT and return the token + user info to auto-login the client
    try:
        user_id = int(res.get('user_id')) if isinstance(res, dict) and res.get('user_id') is not None else None
    except Exception:
        user_id = None
    if user_id:
        token = create_jwt(user_id=user_id, role=role, name=name)
        # update last_seen
        conn = get_db_connection(); cur = conn.cursor(); cur.execute("UPDATE users SET last_seen = ? WHERE user_id = ?", (datetime.now().isoformat(), user_id)); conn.commit(); cur.close(); conn.close()
        user_out = {'user_id': user_id, 'name': name, 'role': role, 'dist': None}
        return {"token": token, "user": user_out, "status": "registered"}
    return res


@app.post('/api/auth/login-face')
async def api_login_face(file: UploadFile = File(...)):
    """Login via face image. Returns JWT if matched."""
    try:
        if not file:
            raise HTTPException(status_code=400, detail='image file required')
        data = await file.read()
        user = find_user_by_image(data)
        if not user:
            raise HTTPException(status_code=401, detail='No matching face found')
        token = create_jwt(user_id=int(user['user_id']), role=str(user.get('role','operator')), name=str(user.get('name','User')))
        # update last seen
        conn = get_db_connection(); cur = conn.cursor(); cur.execute("UPDATE users SET last_seen = ? WHERE user_id = ?", (datetime.now().isoformat(), int(user['user_id']))); conn.commit(); cur.close(); conn.close()
        # normalize user dict to JSON-serializable types
        user_out = {
            'user_id': int(user.get('user_id')),
            'name': str(user.get('name','')),
            'role': str(user.get('role','')),
            'dist': int(user.get('dist')) if user.get('dist') is not None else None,
        }
        return {"token": token, "user": user_out}
    except Exception as e:
        # return error details for debugging (temporary)
        return {"error": str(e)}


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing Authorization')
    if authorization.lower().startswith('bearer '):
        token = authorization.split(' ',1)[1]
    else:
        token = authorization
    data = verify_jwt(token)
    return data


def require_role(role: str):
    def _dep(user=Depends(get_current_user)):
        user_role = user.get('role')
        if user_role != role and user_role != 'admin':
            raise HTTPException(status_code=403, detail='Forbidden')
        return user
    return _dep


@app.get('/api/auth/me')
def me(user=Depends(get_current_user)):
    return user

@app.post("/api/simulator/stop")
def stop_simulator():
    simulator_engine.stop()
    return {"status": "Simulator stopped"}

@app.post("/api/simulator/speed")
def set_speed(req: SpeedRequest):
    simulator_engine.set_speed(req.multiplier)
    return {"status": f"Speed set to {req.multiplier}x"}

@app.post("/api/simulator/inject-failure")
def inject_failure(req: MachineIdRequest):
    simulator_engine.inject_failure(req.machine_id)
    return {"status": f"Failure injected for machine {req.machine_id}"}

@app.post("/api/simulator/inject-defect-spike")
def inject_defect(req: MachineIdRequest):
    simulator_engine.inject_defect_spike(req.machine_id)
    return {"status": f"Defect spike injected for machine {req.machine_id}"}

@app.get("/api/simulator/status")
def get_simulator_status():
    return simulator_engine.get_status()

# CRUD Endpoints
@app.get("/api/machines")
def get_machines():
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("SELECT * FROM machines")
    res = cur.fetchall()
    cur.close()
    conn.close()
    return res

@app.get("/api/machines/{machine_id}/readings")
def get_machine_readings(machine_id: int, range: str = "24h"):
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT sr.timestamp, sr.value, s.sensor_type, s.unit 
        FROM sensor_readings sr
        JOIN sensors s ON sr.sensor_id = s.sensor_id
        WHERE s.machine_id = ?
        ORDER BY sr.timestamp DESC LIMIT 300
    """, (machine_id,))
    res = cur.fetchall()
    cur.close()
    conn.close()
    return res[::-1] # return chronological

@app.get("/api/production/oee")
def get_oee():
    # Mock OEE logic for now
    return {"overall": 85.5, "availability": 90.0, "performance": 95.0, "quality": 99.0}

@app.get("/api/downtime")
def get_downtime():
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT d.event_id, d.reason, d.start_time, d.end_time, m.name as machine_name
        FROM downtime_events d
        JOIN machines m ON d.machine_id = m.machine_id
        ORDER BY d.start_time DESC LIMIT 50
    """)
    res = cur.fetchall()
    cur.close()
    conn.close()
    return res

@app.get("/api/defects/summary")
def get_defects_summary():
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT defect_type, COUNT(*) as count 
        FROM defects 
        GROUP BY defect_type 
        ORDER BY count DESC
    """)
    by_type = cur.fetchall()
    
    cur.execute("""
        SELECT m.name as machine_name, COUNT(d.defect_id) as count
        FROM defects d
        JOIN production_runs pr ON d.run_id = pr.run_id
        JOIN machines m ON pr.machine_id = m.machine_id
        GROUP BY m.name
        ORDER BY count DESC
    """)
    by_machine = cur.fetchall()
    
    cur.close()
    conn.close()
    return {"by_type": by_type, "by_machine": by_machine}

@app.get("/api/inventory")
def get_inventory():
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT i.item_id, i.name, i.quantity, i.reorder_level, i.last_restocked_at, s.name as supplier_name,
        (i.quantity <= i.reorder_level) as reorder_flag
        FROM inventory i
        LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
    """)
    res = cur.fetchall()
    cur.close()
    conn.close()

    for item in res:
        reorder_level = item.get('reorder_level') or 0
        quantity = item.get('quantity') or 0
        if reorder_level and quantity <= reorder_level * 0.3:
            create_alert(f"Inventory critical: {item['name']} is at {quantity} units, which is below 70% depletion threshold.", "critical")

    return res


@app.post("/api/inventory/{item_id}/reorder")
def reorder_inventory(item_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT name, quantity, reorder_level FROM inventory WHERE item_id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if isinstance(row, dict):
        name = row.get('name')
        quantity = row.get('quantity') or 0
        reorder_level = row.get('reorder_level') or 0
    else:
        name, quantity, reorder_level = row

    refill_quantity = max(quantity + (reorder_level or 0), reorder_level or quantity)
    now = datetime.now().isoformat()
    cur.execute(
        "UPDATE inventory SET quantity = ?, last_restocked_at = ? WHERE item_id = ?",
        (refill_quantity, now, item_id),
    )
    conn.commit()
    cur.close()
    conn.close()
    create_alert(f"Reorder placed for {name}. Stock replenished to {refill_quantity} units.", "warning")
    return {"status": "Reorder placed", "item_id": item_id, "quantity": refill_quantity}


@app.post("/api/inventory/{item_id}/refill")
def refill_inventory(item_id: int, req: InventoryRefillRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT name, reorder_level FROM inventory WHERE item_id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if isinstance(row, dict):
        name = row.get('name')
        reorder_level = row.get('reorder_level') or 0
    else:
        name, reorder_level = row

    target_quantity = req.quantity if req.quantity > 0 else max(reorder_level or 0, 20)
    now = datetime.now().isoformat()
    cur.execute(
        "UPDATE inventory SET quantity = ?, last_restocked_at = ? WHERE item_id = ?",
        (target_quantity, now, item_id),
    )
    conn.commit()
    cur.close()
    conn.close()
    create_alert(f"Inventory refilled for {name}. Restocked to {target_quantity} units.", "info")
    return {"status": "Inventory refilled", "item_id": item_id, "quantity": target_quantity}

@app.get("/api/maintenance")
def get_maintenance():
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT ml.log_id, ml.machine_id, m.name as machine_name, ml.service_date, ml.type, ml.notes
        FROM maintenance_logs ml
        JOIN machines m ON ml.machine_id = m.machine_id
        ORDER BY ml.service_date DESC, ml.log_id DESC
        LIMIT 50
    """)
    res = cur.fetchall()
    cur.close()
    conn.close()
    return res

@app.get("/api/alerts")
def get_alerts():
    conn = get_db_connection()
    conn.row_factory = dict_factory
    cur = conn.cursor()
    cur.execute("SELECT * FROM alerts WHERE resolved = 0 ORDER BY created_at DESC LIMIT 50")
    res = cur.fetchall()
    cur.close()
    conn.close()
    return res

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE alerts SET resolved = 1 WHERE alert_id = ?", (alert_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "Resolved"}

# AI Agent endpoints
@app.post("/api/agent/predict-maintenance")
def predict_maintenance():
    try:
        run_predictive_maintenance()
        return {"status": "Prediction run completed"}
    except Exception as e:
        return {"status": f"Error: {e}"}

@app.post("/api/agent/chat")
def chat_agent(req: ChatRequest):
    return run_chat(req.question)

@app.post("/api/agent/operate")
def operate_agent(req: ChatRequest):
    return run_agent(req.question)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
