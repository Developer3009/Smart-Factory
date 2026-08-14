import os
import random
from datetime import datetime, timedelta
from src.db.connection import get_db_connection, is_postgres


def _apply_sqlite_schema(conn):
    cur = conn.cursor()
    with open(os.path.join(os.path.dirname(__file__), "schema.sql"), "r") as f:
        schema_sql = f.read()
    cur.executescript(schema_sql)
    cur.close()


def _apply_postgres_schema(conn):
    # Read sqlite schema and adapt it for Postgres
    with open(os.path.join(os.path.dirname(__file__), "schema.sql"), "r") as f:
        sql = f.read()

    # Basic transformations to make schema Postgres-compatible
    sql = sql.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
    sql = sql.replace("DATETIME", "TIMESTAMP")
    sql = sql.replace("BOOLEAN DEFAULT 0", "BOOLEAN DEFAULT FALSE")

    # Split statements and execute (simple splitter)
    cur = conn.cursor()
    for stmt in sql.split(';'):
        stmt = stmt.strip()
        if not stmt:
            continue
        try:
            cur.execute(stmt)
        except Exception:
            # ignore errors like DROP TABLE IF EXISTS when table doesn't exist
            pass
    conn.commit()
    cur.close()


def seed_data():
    conn = get_db_connection()
    cur = conn.cursor()

    # Clear existing data via schema
    print("Executing schema...")
    if is_postgres():
        _apply_postgres_schema(conn)
    else:
        # sqlite implementation expects executescript available on cursor; use connection directly
        _apply_sqlite_schema(conn)

    print("Seeding users...")
    users = [
        ("Admin User", "admin", "admin@fas.com", "hash123"),
        ("Manager User", "manager", "manager@fas.com", "hash123"),
        ("Operator User", "operator", "operator@fas.com", "hash123")
    ]
    for u in users:
        cur.execute("INSERT INTO users (name, role, email, password_hash) VALUES (%s, %s, %s, %s)" if is_postgres() else "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)", u)

    print("Seeding suppliers...")
    suppliers = [
        ("Global Parts Inc.", 14),
        ("FastTech Electronics", 5),
        ("Industrial Supply Co.", 7)
    ]
    for s in suppliers:
        cur.execute("INSERT INTO suppliers (name, lead_time_days) VALUES (%s, %s)" if is_postgres() else "INSERT INTO suppliers (name, lead_time_days) VALUES (?, ?)", s)
    
    print("Seeding inventory...")
    inventory = [
        ("Motor Bearings", 150, 50, 1),
        ("Lubricant 500ml", 300, 100, 3),
        ("Sensor Cables", 45, 20, 2),
        ("Control Valves", 8, 10, 1),
        ("Coolant 5L", 60, 30, 3)
    ]
    for i in inventory:
        cur.execute("INSERT INTO inventory (name, quantity, reorder_level, supplier_id) VALUES (%s, %s, %s, %s)" if is_postgres() else "INSERT INTO inventory (name, quantity, reorder_level, supplier_id) VALUES (?, ?, ?, ?)", i)

    print("Seeding machines...")
    machines = [
        ("CNC Lathe A1", "CNC", "Zone A", "idle"),
        ("CNC Lathe A2", "CNC", "Zone A", "idle"),
        ("Injection Molder B1", "Molder", "Zone B", "idle"),
        ("Assembly Robot C1", "Robot", "Zone C", "idle"),
        ("Assembly Robot C2", "Robot", "Zone C", "idle"),
        ("Packaging Line P1", "Packaging", "Zone P", "idle")
    ]
    for m in machines:
        cur.execute("INSERT INTO machines (name, type, location, status) VALUES (%s, %s, %s, %s)" if is_postgres() else "INSERT INTO machines (name, type, location, status) VALUES (?, ?, ?, ?)", m)
    
    # Get machine IDs
    cur.execute("SELECT machine_id, type FROM machines")
    machine_records = cur.fetchall()
    
    print("Seeding sensors...")
    for m in machine_records:
        # rows from sqlite are row objects; from Postgres using RealDictCursor they are dicts
        m_id = m['machine_id'] if isinstance(m, dict) else m[0]
        m_type = m['type'] if isinstance(m, dict) else m[1]
        sensors = [("temperature", "C")]
        if m_type in ["CNC", "Robot"]:
            sensors.append(("vibration", "mm/s"))
            sensors.append(("rpm", "rev/min"))
        elif m_type == "Molder":
            sensors.append(("pressure", "bar"))
        
        for s_type, s_unit in sensors:
            cur.execute("INSERT INTO sensors (machine_id, sensor_type, unit) VALUES (%s, %s, %s)" if is_postgres() else "INSERT INTO sensors (machine_id, sensor_type, unit) VALUES (?, ?, ?)", (m_id, s_type, s_unit))

    print("Seeding historical data (production runs, downtime)...")
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    for m in machine_records:
        m_id = m['machine_id'] if isinstance(m, dict) else m[0]
        # Generate 20 runs per machine over 30 days
        for _ in range(20):
            run_start = start_date + timedelta(days=random.uniform(0, 29), hours=random.uniform(0, 23))
            run_end = run_start + timedelta(hours=random.uniform(1, 4))
            units_prod = random.randint(50, 500)
            units_def = int(units_prod * random.uniform(0, 0.05)) # up to 5% defects
            
            if is_postgres():
                cur.execute("""
                    INSERT INTO production_runs (machine_id, product_name, start_time, end_time, units_produced, units_defective)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING run_id
                """, (m_id, "Product-" + str(random.randint(1,5)), run_start.isoformat(), run_end.isoformat(), units_prod, units_def))
                run_id = cur.fetchone()['run_id']
            else:
                cur.execute("""
                    INSERT INTO production_runs (machine_id, product_name, start_time, end_time, units_produced, units_defective)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (m_id, "Product-" + str(random.randint(1,5)), run_start.isoformat(), run_end.isoformat(), units_prod, units_def))
                run_id = cur.lastrowid
            
            # create defects
            if units_def > 0:
                for _ in range(random.randint(1, min(units_def, 5))):
                    d_type = random.choice(["Scratch", "Alignment", "Missing Part", "Cracked"])
                    sev = random.choice(["low", "medium", "high"])
                    d_time = run_start + timedelta(minutes=random.uniform(10, 60))
                    cur.execute("INSERT INTO defects (run_id, defect_type, severity, timestamp) VALUES (%s, %s, %s, %s)" if is_postgres() else "INSERT INTO defects (run_id, defect_type, severity, timestamp) VALUES (?, ?, ?, ?)", 
                                (run_id, d_type, sev, d_time.isoformat()))

        # Generate a few downtime events
        for _ in range(random.randint(1, 3)):
            down_start = start_date + timedelta(days=random.uniform(0, 29))
            down_end = down_start + timedelta(hours=random.uniform(1, 6))
            reason = random.choice(["Motor Failure", "Calibration", "Jammed part", "Overheating"])
            cur.execute("INSERT INTO downtime_events (machine_id, reason, start_time, end_time) VALUES (%s, %s, %s, %s)" if is_postgres() else "INSERT INTO downtime_events (machine_id, reason, start_time, end_time) VALUES (?, ?, ?, ?)",
                        (m_id, reason, down_start.isoformat(), down_end.isoformat()))
            
            # create maintenance log for the downtime
            cur.execute("INSERT INTO maintenance_logs (machine_id, service_date, type, notes) VALUES (%s, %s, %s, %s)" if is_postgres() else "INSERT INTO maintenance_logs (machine_id, service_date, type, notes) VALUES (?, ?, ?, ?)",
                        (m_id, down_end.date().isoformat(), "corrective", f"Fixed {reason}"))

    conn.commit()
    cur.close()
    conn.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_data()
