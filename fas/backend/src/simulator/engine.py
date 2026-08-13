import threading
import time
import random
from datetime import datetime
import sqlite3
from src.db.seed import get_db_connection

class Simulator:
    def __init__(self):
        self.is_running = False
        self.speed_multiplier = 1.0
        self.machines = {} # { machine_id: { state: 'running', ticks_in_state: 0, drift_target: None, sensors: [] } }
        self.thread = None
        self.conn = None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.conn = get_db_connection()
        self.conn.row_factory = sqlite3.Row
        self._load_machines()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
        if self.conn:
            self.conn.close()

    def set_speed(self, multiplier: float):
        self.speed_multiplier = multiplier

    def inject_failure(self, machine_id: int):
        if machine_id in self.machines:
            self.machines[machine_id]['drift_target'] = 20 # 20 ticks of drift before failure

    def inject_defect_spike(self, machine_id: int):
        if machine_id in self.machines:
            self.machines[machine_id]['defect_spike'] = 5 # high defects for next 5 runs

    def get_status(self):
        return {
            "is_running": self.is_running,
            "speed": self.speed_multiplier,
            "machines": self.machines
        }

    def _load_machines(self):
        cur = self.conn.cursor()
        cur.execute("SELECT machine_id, status FROM machines")
        for row in cur.fetchall():
            m_id = row['machine_id']
            status = row['status']
            cur.execute("SELECT sensor_id, sensor_type FROM sensors WHERE machine_id = ?", (m_id,))
            sensors = [{"id": r['sensor_id'], "type": r['sensor_type']} for r in cur.fetchall()]
            
            self.machines[m_id] = {
                "state": status if status in ['running', 'idle', 'down'] else 'idle',
                "ticks_in_state": 0,
                "drift_target": None,
                "defect_spike": 0,
                "sensors": sensors,
                "current_run_id": None,
                "units_produced": 0,
                "units_defective": 0,
                "run_start": None
            }
        cur.close()

    def _run_loop(self):
        base_tick_seconds = 2.0
        while self.is_running:
            sleep_time = base_tick_seconds / self.speed_multiplier
            time.sleep(sleep_time)
            
            cur = self.conn.cursor()
            now = datetime.now()
            
            for m_id, m_data in self.machines.items():
                m_data['ticks_in_state'] += 1
                
                # State transitions
                if m_data['state'] == 'idle':
                    if random.random() < 0.1: # 10% chance to start running each tick
                        self._update_machine_state(cur, m_id, 'running')
                        m_data['run_start'] = now
                        m_data['units_produced'] = 0
                        m_data['units_defective'] = 0
                        
                        # Start a production run
                        cur.execute("INSERT INTO production_runs (machine_id, product_name, start_time) VALUES (?, ?, ?)",
                                   (m_id, f"Product-{random.randint(100, 999)}", now.isoformat()))
                        m_data['current_run_id'] = cur.lastrowid
                
                elif m_data['state'] == 'running':
                    # Generate sensor data
                    is_drifting = m_data['drift_target'] is not None and m_data['drift_target'] > 0
                    if is_drifting:
                        m_data['drift_target'] -= 1
                    
                    for sensor in m_data['sensors']:
                        base_val = 0
                        if sensor['type'] == 'temperature': base_val = 70.0
                        elif sensor['type'] == 'vibration': base_val = 2.0
                        elif sensor['type'] == 'rpm': base_val = 1500.0
                        elif sensor['type'] == 'pressure': base_val = 100.0
                        
                        noise = random.gauss(0, base_val * 0.05)
                        val = base_val + noise
                        
                        if is_drifting:
                            # Add drift (e.g., +20% over baseline linearly over 20 ticks)
                            drift_factor = (20 - m_data['drift_target']) / 20.0
                            val += base_val * 0.3 * drift_factor
                            
                        cur.execute("INSERT INTO sensor_readings (sensor_id, value, timestamp) VALUES (?, ?, ?)",
                                   (sensor['id'], val, now.isoformat()))

                    # Production logic
                    m_data['units_produced'] += random.randint(1, 5)
                    defect_chance = 0.01
                    if is_drifting: defect_chance = 0.05
                    if m_data['defect_spike'] > 0: defect_chance = 0.15
                    
                    if random.random() < defect_chance:
                        m_data['units_defective'] += 1
                        cur.execute("INSERT INTO defects (run_id, defect_type, severity, timestamp) VALUES (?, ?, ?, ?)",
                                   (m_data['current_run_id'], "Anomaly", "medium", now.isoformat()))

                    # Inventory drain (every 5 ticks)
                    if m_data['ticks_in_state'] % 5 == 0:
                        cur.execute("UPDATE inventory SET quantity = quantity - 1 WHERE quantity > 0")

                    # Transition out of running
                    if is_drifting and m_data['drift_target'] == 0:
                        # Drift finished -> FAILURE!
                        self._update_machine_state(cur, m_id, 'down')
                        cur.execute("INSERT INTO downtime_events (machine_id, reason, start_time) VALUES (?, ?, ?)",
                                   (m_id, "Simulated Failure", now.isoformat()))
                        self._end_production_run(cur, m_id, now)
                        m_data['drift_target'] = None
                        if m_data['defect_spike'] > 0: m_data['defect_spike'] -= 1
                    
                    elif m_data['ticks_in_state'] > random.randint(30, 60):
                        # Normal stop
                        self._update_machine_state(cur, m_id, 'idle')
                        self._end_production_run(cur, m_id, now)
                        if m_data['defect_spike'] > 0: m_data['defect_spike'] -= 1

                elif m_data['state'] == 'down':
                    if m_data['ticks_in_state'] > random.randint(10, 20):
                        self._update_machine_state(cur, m_id, 'idle')
                        cur.execute("UPDATE downtime_events SET end_time = ? WHERE machine_id = ? AND end_time IS NULL", (now.isoformat(), m_id))

            self.conn.commit()
            cur.close()

    def _update_machine_state(self, cur, m_id, new_state):
        cur.execute("UPDATE machines SET status = ? WHERE machine_id = ?", (new_state, m_id))
        self.machines[m_id]['state'] = new_state
        self.machines[m_id]['ticks_in_state'] = 0

    def _end_production_run(self, cur, m_id, end_time):
        run_id = self.machines[m_id].get('current_run_id')
        if run_id:
            cur.execute("UPDATE production_runs SET end_time = ?, units_produced = ?, units_defective = ? WHERE run_id = ?",
                       (end_time.isoformat(), self.machines[m_id]['units_produced'], self.machines[m_id]['units_defective'], run_id))
        self.machines[m_id]['current_run_id'] = None

# Global instance
simulator_engine = Simulator()
