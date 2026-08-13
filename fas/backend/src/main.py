from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from src.db.seed import get_db_connection
from src.simulator.engine import simulator_engine
from src.agent.ml import run_predictive_maintenance
from src.agent.llm import run_chat
import os
import requests
import json
from datetime import datetime

app = FastAPI(title="FAS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class ChatRequest(BaseModel):
    question: str

# Simulator Endpoints
@app.post("/api/simulator/start")
def start_simulator():
    simulator_engine.start()
    return {"status": "Simulator started"}

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
        SELECT i.item_id, i.name, i.quantity, i.reorder_level, s.name as supplier_name,
        (i.quantity <= i.reorder_level) as reorder_flag
        FROM inventory i
        LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
