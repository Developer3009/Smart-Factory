import os
import requests
import sqlite3
from src.db.seed import get_db_connection

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

SCHEMA_DESC = """
tables:
- machines (machine_id, name, type, location, status)
- sensors (sensor_id, machine_id, sensor_type, unit)
- sensor_readings (reading_id, sensor_id, value, timestamp)
- production_runs (run_id, machine_id, product_name, start_time, end_time, units_produced, units_defective)
- defects (defect_id, run_id, defect_type, severity, timestamp)
- downtime_events (event_id, machine_id, reason, start_time, end_time)
- maintenance_logs (log_id, machine_id, service_date, type, notes)
- inventory (item_id, name, quantity, reorder_level, supplier_id)
- suppliers (supplier_id, name, lead_time_days)
- orders (order_id, item_id, quantity, order_date, status)
"""

def generate_sql(question: str) -> str:
    prompt = f"""You are an AI assistant for a factory database running SQLite.
Here is the schema:
{SCHEMA_DESC}

Return ONLY a single valid SQLite SELECT statement that answers the question. Do not add markdown blocks, explanations, or any other text.
Question: {question}
"""
    try:
        res = requests.post(f"{OLLAMA_URL}/api/generate", json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }, timeout=15)
        if res.status_code == 200:
            sql = res.json().get("response", "").strip()
            # Basic cleanup
            sql = sql.replace("```sql", "").replace("```sqlite", "").replace("```", "").strip()
            return sql
    except Exception as e:
        print(f"Ollama error: {e}")
    return ""

def validate_sql(sql: str) -> bool:
    sql_upper = sql.upper().strip()
    if not sql_upper.startswith("SELECT"):
        return False
    # Prevent multiple statements
    if ";" in sql and not sql.endswith(";"):
        return False
    
    blocked_keywords = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "PRAGMA"]
    for word in blocked_keywords:
        if word in sql_upper:
            return False
            
    return True

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def run_chat(question: str):
    sql = generate_sql(question)
    
    if not sql:
        return {"answer": "I could not generate a valid query for that or Ollama is not running.", "query": "", "data": []}
        
    if not validate_sql(sql):
        return {"answer": "I generated a query, but it was rejected for safety reasons (only SELECT is allowed).", "query": sql, "data": []}
        
    # Execute SQL
    data = []
    try:
        conn = get_db_connection()
        conn.row_factory = dict_factory
        cur = conn.cursor()
        cur.execute(sql)
        data = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as e:
        return {"answer": f"Error executing query: {str(e)}", "query": sql, "data": []}
        
    # Translate back to English
    answer_prompt = f"""You are an AI assistant. The user asked: {question}. 
You ran this SQL query: {sql}
The database returned this data: {data}

Please write a brief, natural language answer summarizing the data for the user."""

    try:
        res = requests.post(f"{OLLAMA_URL}/api/generate", json={
            "model": OLLAMA_MODEL,
            "prompt": answer_prompt,
            "stream": False
        }, timeout=15)
        if res.status_code == 200:
            answer = res.json().get("response", "").strip()
            return {"answer": answer, "query": sql, "data": data}
    except Exception:
        pass
        
    return {"answer": "Here is the raw data.", "query": sql, "data": data}
