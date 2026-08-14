import os
import re
import json
import requests
from datetime import datetime

from src.db.connection import get_db_connection

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

ALLOWED_TABLES = {
   "machines",
   "sensors",
   "sensor_readings",
   "production_runs",
   "defects",
   "downtime_events",
   "maintenance_logs",
   "inventory",
   "suppliers",
   "orders",
   "users",
   "ai_predictions",
   "alerts",
}

SCHEMA_DESC = """
tables:
- machines (machine_id, name, type, location, status)
- sensors (sensor_id, machine_id, sensor_type, unit)
- sensor_readings (reading_id, sensor_id, value, timestamp)
- production_runs (run_id, machine_id, product_name, start_time, end_time, units_produced, units_defective)
- defects (defect_id, run_id, defect_type, severity, timestamp)
- downtime_events (event_id, machine_id, reason, start_time, end_time)
- maintenance_logs (log_id, machine_id, service_date, type, notes)
- inventory (item_id, name, quantity, reorder_level, supplier_id, last_restocked_at)
- suppliers (supplier_id, name, lead_time_days)
- orders (order_id, item_id, quantity, order_date, status)
- alerts (alert_id, message, severity, created_at, resolved)
"""

def dict_factory(cursor, row):
   d = {}
   for idx, col in enumerate(cursor.description):
       d[col[0]] = row[idx]
   return d


def _clean_sql(sql: str) -> str:
   if not sql:
       return ""
   sql = sql.strip()
   sql = sql.replace("```sql", "").replace("```sqlite", "").replace("```", "").strip()
   sql = sql.replace("CURRENT_TIMESTAMP", "datetime('now')")
   sql = sql.replace("CURRENT_DATE", "date('now')")
   sql = sql.replace("CURRENT_TIME", "time('now')")
   sql = sql.replace("NOW()", "datetime('now')")
   if sql.endswith(";"):
       sql = sql[:-1].strip()
   return sql


def generate_sql(question: str, allow_mutation: bool = False) -> str:
   mode = "SELECT or data-changing SQL" if allow_mutation else "SELECT only"
   prompt = f"""You are an AI assistant for a factory operations database.
Here is the schema:
{SCHEMA_DESC}

Return ONLY a single valid SQL statement for this request. Use the database dialect supported by the app. Allowed tables: {', '.join(sorted(ALLOWED_TABLES))}.
Mode: {mode}
Rules:
- Do not include markdown fences.
- Do not include explanations.
- Do not use multiple statements.
- Only use allowed tables.
- For writes, restrict to INSERT/UPDATE/DELETE for operational changes and maintenance operations.
Question: {question}
"""
   try:
       res = requests.post(f"{OLLAMA_URL}/api/generate", json={
           "model": OLLAMA_MODEL,
           "prompt": prompt,
           "stream": False
       }, timeout=15)
       if res.status_code == 200:
           return _clean_sql(res.json().get("response", ""))
   except Exception as exc:
       print(f"Ollama error: {exc}")
   return ""


def _extract_table_name(sql: str):
   match = re.search(r"\b(?:FROM|INTO|UPDATE|JOIN)\s+([A-Za-z_][A-Za-z0-9_]*)", sql, flags=re.IGNORECASE)
   if match:
       return match.group(1).lower()
   return None


def validate_sql(sql: str, allow_mutation: bool = False) -> bool:
   if not sql:
       return False
   sql = sql.strip()
   sql_upper = sql.upper()
   if ";" in sql and not sql.endswith(";"):
       return False
   if "--" in sql or "/*" in sql or "*/" in sql:
       return False

   if allow_mutation:
       allowed_prefixes = ("SELECT", "INSERT", "UPDATE", "DELETE")
   else:
       allowed_prefixes = ("SELECT",)

   if not any(sql_upper.startswith(prefix) for prefix in allowed_prefixes):
       return False

   blocked = ["DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE", "ATTACH", "DETACH", "VACUUM", "PRAGMA"]
   for word in blocked:
       if word in sql_upper:
           return False

   table_name = _extract_table_name(sql)
   if table_name and table_name not in ALLOWED_TABLES:
       return False
   return True


def _execute_sql(sql: str):
   conn = get_db_connection()
   conn.row_factory = dict_factory
   cur = conn.cursor()
   try:
       cur.execute(sql)
       try:
           rows = cur.fetchall()
       except Exception:
           rows = []
       conn.commit()
       return {"query": sql, "rows_affected": getattr(cur, "rowcount", 0), "data": rows}
   finally:
       cur.close()
       conn.close()


def _schedule_maintenance(machine_id: int, service_date: str = None, maintenance_type: str = "scheduled", notes: str = ""):
   if service_date is None:
       service_date = datetime.now().date().isoformat()
   conn = get_db_connection()
   cur = conn.cursor()
   try:
       # verify machine exists
       cur.execute("SELECT machine_id FROM machines WHERE machine_id = ?", (machine_id,))
       if not cur.fetchone():
           raise ValueError(f"Machine {machine_id} does not exist")
       cur.execute(
           "INSERT INTO maintenance_logs (machine_id, service_date, type, notes) VALUES (?, ?, ?, ?)",
           (machine_id, service_date, maintenance_type, notes or "AI scheduled maintenance")
       )
       conn.commit()
       return {"status": "scheduled", "machine_id": machine_id, "service_date": service_date, "type": maintenance_type}
   finally:
       cur.close(); conn.close()


def _update_machine_status(machine_id: int, status: str):
   allowed_status = {"running", "idle", "down"}
   status = status.lower()
   if status not in allowed_status:
       raise ValueError(f"Status {status} is not allowed. Use running, idle, or down.")
   conn = get_db_connection(); cur = conn.cursor()
   try:
       cur.execute("UPDATE machines SET status = ? WHERE machine_id = ?", (status, machine_id))
       if cur.rowcount == 0:
           raise ValueError(f"Machine {machine_id} does not exist")
       conn.commit()
       return {"status": "updated", "machine_id": machine_id, "new_status": status}
   finally:
       cur.close(); conn.close()


def _refill_inventory(item_id: int, quantity: int = 0):
   conn = get_db_connection(); cur = conn.cursor()
   try:
       cur.execute("SELECT name, quantity, reorder_level FROM inventory WHERE item_id = ?", (item_id,))
       row = cur.fetchone()
       if not row:
           raise ValueError(f"Inventory item {item_id} does not exist")
       if isinstance(row, dict):
           name = row.get("name") or "item"
           current_qty = int(row.get("quantity") or 0)
           reorder_level = int(row.get("reorder_level") or 0)
       else:
           name, current_qty, reorder_level = row
       target_qty = int(quantity) if quantity > 0 else max(current_qty, reorder_level or 20)
       cur.execute("UPDATE inventory SET quantity = ?, last_restocked_at = ? WHERE item_id = ?", (target_qty, datetime.now().isoformat(), item_id))
       conn.commit()
       return {"status": "refilled", "item_id": item_id, "item_name": name, "quantity": target_qty}
   finally:
       cur.close(); conn.close()


def _apply_direct_action(question: str):
   q = question.lower().strip()

   maintenance_match = re.search(r"(?:schedule|add|create)\s+(?:maintenance|service)\s+(?:for\s+)?machine\s*(\d+)", q)
   if maintenance_match:
       machine_id = int(maintenance_match.group(1))
       maintenance_type = "scheduled"
       if "monthly" in q:
           maintenance_type = "monthly"
       elif "continuous" in q or "runtime" in q:
           maintenance_type = "continuous_run"
       notes = f"AI scheduled maintenance per request: {question}"
       return _schedule_maintenance(machine_id, notes=notes, maintenance_type=maintenance_type)

   machine_status_match = re.search(r"machine\s*(\d+)\s+(?:set|mark|change|set\s+status\s+to|as|to)\s*([a-z]+)", q)
   if machine_status_match:
       return _update_machine_status(int(machine_status_match.group(1)), machine_status_match.group(2))

   machine_status_alt = re.search(r"(?:set|mark|change)\s+machine\s*(\d+)\s+(?:status\s+to\s+)?([a-z]+)", q)
   if machine_status_alt:
       return _update_machine_status(int(machine_status_alt.group(1)), machine_status_alt.group(2))

   inventory_match = re.search(r"(?:refill|restock|top up)\s+(?:inventory\s+)?(?:item\s*)?(\d+)(?:\s+to\s+(\d+))?", q)
   if inventory_match:
       item_id = int(inventory_match.group(1))
       qty = int(inventory_match.group(2)) if inventory_match.group(2) else 0
       return _refill_inventory(item_id, qty)

   inventory_update = re.search(r"(?:inventory|stock)\s+(?:item\s*)?(\d+)\s+(?:to|=)\s*(\d+)", q)
   if inventory_update:
       return _refill_inventory(int(inventory_update.group(1)), int(inventory_update.group(2)))

   reorder_match = re.search(r"reorder\s+(?:inventory\s+)?(?:item\s*)?(\d+)", q)
   if reorder_match:
       item_id = int(reorder_match.group(1))
       return _refill_inventory(item_id, 0)

   return None


def _summarize_result(question: str, result: dict):
   if result.get("status") in {"scheduled", "updated", "refilled"}:
       return f"Done: {result['status']}. {question}"
   if result.get("rows_affected") is not None:
       return f"The database action succeeded. {result['rows_affected']} rows were affected."
   return "The database action completed successfully."


def run_chat(question: str, allow_mutation: bool = False):
   direct_action = _apply_direct_action(question) if allow_mutation else None
   if direct_action is not None:
       return {
           "answer": _summarize_result(question, direct_action),
           "query": "direct_action",
           "data": direct_action,
           "mutated": True,
       }

   sql = generate_sql(question, allow_mutation=allow_mutation)
   if not sql:
       return {"answer": "I could not generate a valid query for that or Ollama is not running.", "query": "", "data": [], "mutated": False}

   if not validate_sql(sql, allow_mutation=allow_mutation):
       return {"answer": "I generated a query, but it was rejected for safety reasons. Only safe, allowed operations are permitted.", "query": sql, "data": [], "mutated": False}

   try:
       result = _execute_sql(sql)
   except Exception as exc:
       return {"answer": f"Error executing query: {str(exc)}", "query": sql, "data": [], "mutated": False}

   if allow_mutation:
       return {
           "answer": _summarize_result(question, result),
           "query": sql,
           "data": result["data"],
           "rows_affected": result["rows_affected"],
           "mutated": True,
       }

   answer_prompt = f"""You are an AI assistant. The user asked: {question}.
You ran this SQL query: {sql}
The database returned this data: {result['data']}

Please write a brief, natural language answer summarizing the data for the user."""
   try:
       res = requests.post(f"{OLLAMA_URL}/api/generate", json={
           "model": OLLAMA_MODEL,
           "prompt": answer_prompt,
           "stream": False
       }, timeout=15)
       if res.status_code == 200:
           answer = res.json().get("response", "").strip()
           return {"answer": answer, "query": sql, "data": result["data"], "mutated": False}
   except Exception:
       pass

   return {"answer": "Here is the raw data.", "query": sql, "data": result["data"], "mutated": False}


def run_agent(question: str):
   return run_chat(question, allow_mutation=True)
