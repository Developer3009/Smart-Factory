import sqlite3
from src.db.seed import get_db_connection

def run_predictive_maintenance():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT machine_id FROM machines WHERE status = 'running'")
    machines = cur.fetchall()
    
    for row in machines:
        m_id = row[0]
        # Fetch last 50 readings
        cur.execute("""
            SELECT sr.value 
            FROM sensor_readings sr
            JOIN sensors s ON sr.sensor_id = s.sensor_id
            WHERE s.machine_id = ?
            ORDER BY sr.timestamp DESC LIMIT 50
        """, (m_id,))
        readings = [r[0] for r in cur.fetchall()]
        
        if len(readings) < 30:
            continue
            
        # Pure python anomaly detection (Z-score based)
        mean = sum(readings) / len(readings)
        variance = sum((x - mean) ** 2 for x in readings) / len(readings)
        std_dev = variance ** 0.5 if variance > 0 else 1
        
        anomalies = 0
        for val in readings:
            z_score = abs(val - mean) / std_dev
            if z_score > 2.5:
                anomalies += 1
                
        anomaly_ratio = anomalies / len(readings)
        
        if anomaly_ratio > 0.1:
            # High risk
            cur.execute("""
                INSERT INTO ai_predictions (machine_id, type, predicted_value, confidence, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            """, (m_id, 'failure_risk', 'High', anomaly_ratio))
            pred_id = cur.lastrowid
            
            cur.execute("""
                INSERT INTO alerts (prediction_id, message, severity, created_at)
                VALUES (?, ?, ?, datetime('now'))
            """, (pred_id, f"High failure risk detected for machine {m_id} based on sensor drift.", "critical"))
            
    conn.commit()
    cur.close()
    conn.close()
