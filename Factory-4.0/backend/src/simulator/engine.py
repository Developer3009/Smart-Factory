import threading
import time
import random
from datetime import datetime
import sqlite3
from src.db.connection import get_db_connection, is_postgres

class Simulator:
    def __init__(self):
        self.is_running = False
        self.speed_multiplier = 1.0
        self.machines = {} # { machine_id: { state: 'running', ticks_in_state: 0, drift_target: None, sensors: [] } }
        self.thread = None
        self.conn = None
        self.alert_cache = {}

    def _notify_once(self, key, message, severity='warning'):
        now = time.time()
        last_sent = self.alert_cache.get(key)
        if last_sent and now - last_sent < 30:
            return
        self.alert_cache[key] = now

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO alerts (message, severity, created_at, resolved) VALUES (?, ?, ?, 0)",
            (message, severity, datetime.now().isoformat())
        )
        conn.commit()
        cur.close()
        conn.close()

    def _get_machine_name(self, cur, machine_id):
        row = cur.execute("SELECT name FROM machines WHERE machine_id = ?", (machine_id,)).fetchone()
        if isinstance(row, dict):
            return row.get('name') or f"Machine {machine_id}"
        return row[0] if row else f"Machine {machine_id}"

    def _get_last_maintenance(self, cur, machine_id):
        try:
            cur.execute("SELECT MAX(service_date) AS last_date FROM maintenance_logs WHERE machine_id = ?", (machine_id,))
            row = cur.fetchone()
            if isinstance(row, dict):
                value = row.get('last_date')
            else:
                value = row[0] if row else None
            if isinstance(value, str):
                return datetime.fromisoformat(value).date()
            return value
        except Exception:
            return None

    def _schedule_maintenance(self, cur, machine_id, maintenance_type, reason):
        base_window_days = 30

        if is_postgres():
            cur.execute(
                """
                SELECT COUNT(*) AS count
                FROM maintenance_logs
                WHERE machine_id = %s
                  AND service_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
                """,
                (machine_id,),
            )
        else:
            cur.execute(
                "SELECT COUNT(*) AS count FROM maintenance_logs WHERE machine_id = ? AND service_date BETWEEN date('now') AND date('now', '+' || ? || ' days')",
                (machine_id, base_window_days),
            )
        row = cur.fetchone()
        if isinstance(row, dict):
            count = row.get('count') or 0
        else:
            count = row[0] if row else 0
        if int(count) > 0:
            return False

        today = datetime.now().date().isoformat()
        if is_postgres():
            cur.execute(
                "INSERT INTO maintenance_logs (machine_id, service_date, type, notes) VALUES (%s, %s, %s, %s)",
                (machine_id, today, maintenance_type, reason),
            )
        else:
            cur.execute(
                "INSERT INTO maintenance_logs (machine_id, service_date, type, notes) VALUES (?, ?, ?, ?)",
                (machine_id, today, maintenance_type, reason),
            )
        return True

    def _check_monthly_maintenance(self, cur, m_id, now, machine_name):
        last_maintenance = self._get_last_maintenance(cur, m_id)
        if last_maintenance is not None:
            days_since = (now.date() - last_maintenance).days
            if days_since < 30:
                return
        scheduled = self._schedule_maintenance(cur, m_id, 'monthly', f"Monthly preventive maintenance due for {machine_name}.")
        if scheduled:
            self._notify_once(
                f"machine_{m_id}_monthly_maintenance",
                f"Monthly maintenance scheduled for {machine_name}.",
                "warning",
            )

    def _check_continuous_run_maintenance(self, cur, m_id, m_data, now, machine_name):
        if m_data.get('state') != 'running':
            m_data['started_running_at'] = None
            return
        if not m_data.get('started_running_at'):
            m_data['started_running_at'] = now
            return
        continuous_days = (now - m_data['started_running_at']).days
        if continuous_days >= 15 and not m_data.get('continuous_run_maintenance_scheduled'):
            scheduled = self._schedule_maintenance(cur, m_id, 'continuous_run', f"Machine {machine_name} has run continuously for {continuous_days} days; scheduled maintenance required.")
            if scheduled:
                m_data['continuous_run_maintenance_scheduled'] = True
                self._notify_once(
                    f"machine_{m_id}_continuous_maintenance",
                    f"{machine_name} has operated continuously for {continuous_days} days; preventive maintenance scheduled.",
                    "warning",
                )

    def _reset_maintenance_flags(self, m_data):
        m_data['continuous_run_maintenance_scheduled'] = False
        m_data['started_running_at'] = None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.conn = get_db_connection()
        self.conn.row_factory = sqlite3.Row
        self._load_machines()
        self.conn.close()
        self.conn = None
        self._seed_initial_readings()
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def _seed_initial_readings(self):
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        for m_id, m_data in self.machines.items():
            for sensor in m_data['sensors']:
                sensor_id = sensor['id']
                sensor_type = sensor['type']
                existing = cur.execute(
                    "SELECT COUNT(*) FROM sensor_readings WHERE sensor_id = ?",
                    (sensor_id,)
                ).fetchone()[0]
                if existing > 0:
                    continue

                base_value = 70.0
                if sensor_type == 'vibration':
                    base_value = 2.0
                elif sensor_type == 'rpm':
                    base_value = 1500.0
                elif sensor_type == 'pressure':
                    base_value = 100.0

                cur.execute(
                    "INSERT INTO sensor_readings (sensor_id, value, timestamp) VALUES (?, ?, ?)",
                    (sensor_id, base_value, datetime.now().isoformat())
                )
        conn.commit()
        cur.close()
        conn.close()

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
        self.conn = None

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
                "run_start": None,
                "started_running_at": None,
                "continuous_run_maintenance_scheduled": False,
                "monthly_maintenance_scheduled": False
            }
        cur.close()

    def _run_loop(self):
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        base_tick_seconds = 2.0
        try:
            while self.is_running:
                sleep_time = base_tick_seconds / self.speed_multiplier
                time.sleep(sleep_time)

                cur = conn.cursor()
                now = datetime.now()

                for m_id, m_data in self.machines.items():
                    m_data['ticks_in_state'] += 1
                    machine_name = self._get_machine_name(cur, m_id)

                    # Maintenance scheduling rules
                    self._check_monthly_maintenance(cur, m_id, now, machine_name)
                    self._check_continuous_run_maintenance(cur, m_id, m_data, now, machine_name)

                    # State transitions
                    if m_data['state'] == 'idle':
                        if random.random() < 0.1: # 10% chance to start running each tick
                            self._update_machine_state(cur, m_id, 'running')
                            m_data['run_start'] = now
                            m_data['units_produced'] = 0
                            m_data['units_defective'] = 0
                            m_data['started_running_at'] = now
                            m_data['continuous_run_maintenance_scheduled'] = False

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

                            threshold_map = {
                                'temperature': 95,
                                'vibration': 5,
                                'rpm': 2000,
                                'pressure': 130,
                            }
                            threshold = threshold_map.get(sensor['type'])
                            if threshold is not None and val > threshold:
                                machine_name = self._get_machine_name(cur, m_id)
                                self._notify_once(
                                    f"machine_{m_id}_{sensor['type']}_high",
                                    f"{machine_name} sensor {sensor['type']} exceeded safe threshold ({val:.2f} > {threshold}).",
                                    "critical",
                                )

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
                            m_data['started_running_at'] = None

                conn.commit()
                cur.close()
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def _update_machine_state(self, cur, m_id, new_state):
        prev_state = self.machines[m_id]['state']
        cur.execute("UPDATE machines SET status = ? WHERE machine_id = ?", (new_state, m_id))
        self.machines[m_id]['state'] = new_state
        self.machines[m_id]['ticks_in_state'] = 0

        if new_state == 'running':
            self.machines[m_id]['started_running_at'] = datetime.now()
            self.machines[m_id]['continuous_run_maintenance_scheduled'] = False
        elif new_state in ('idle', 'down'):
            self.machines[m_id]['started_running_at'] = None
            self.machines[m_id]['continuous_run_maintenance_scheduled'] = False

        if new_state == 'down' and prev_state != 'down':
            machine_name = self._get_machine_name(cur, m_id)
            self._notify_once(
                f"machine_{m_id}_down",
                f"Machine {machine_name} is not working and has entered a down state.",
                "critical",
            )

    def _end_production_run(self, cur, m_id, end_time):
        run_id = self.machines[m_id].get('current_run_id')
        if run_id:
            cur.execute("UPDATE production_runs SET end_time = ?, units_produced = ?, units_defective = ? WHERE run_id = ?",
                       (end_time.isoformat(), self.machines[m_id]['units_produced'], self.machines[m_id]['units_defective'], run_id))
        self.machines[m_id]['current_run_id'] = None

# Global instance
simulator_engine = Simulator()
