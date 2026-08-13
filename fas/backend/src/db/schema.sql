-- sqlite_schema.sql
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS ai_predictions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS downtime_events;
DROP TABLE IF EXISTS defects;
DROP TABLE IF EXISTS production_runs;
DROP TABLE IF EXISTS sensor_readings;
DROP TABLE IF EXISTS sensors;
DROP TABLE IF EXISTS machines;

CREATE TABLE machines (
  machine_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  type TEXT,
  location TEXT,
  status TEXT
);

CREATE TABLE sensors (
  sensor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER REFERENCES machines,
  sensor_type TEXT,
  unit TEXT
);

CREATE TABLE sensor_readings (
  reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id INTEGER REFERENCES sensors,
  value REAL,
  timestamp DATETIME
);

CREATE TABLE production_runs (
  run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER REFERENCES machines,
  product_name TEXT,
  start_time DATETIME,
  end_time DATETIME,
  units_produced INTEGER,
  units_defective INTEGER
);

CREATE TABLE defects (
  defect_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER REFERENCES production_runs,
  defect_type TEXT,
  severity TEXT,
  timestamp DATETIME
);

CREATE TABLE downtime_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER REFERENCES machines,
  reason TEXT,
  start_time DATETIME,
  end_time DATETIME
);

CREATE TABLE maintenance_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER REFERENCES machines,
  service_date DATE,
  type TEXT,
  notes TEXT
);

CREATE TABLE suppliers (
  supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  lead_time_days INTEGER
);

CREATE TABLE inventory (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  quantity INTEGER,
  reorder_level INTEGER,
  supplier_id INTEGER REFERENCES suppliers
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER REFERENCES inventory,
  quantity INTEGER,
  order_date DATE,
  status TEXT
);

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  role TEXT,
  email TEXT UNIQUE,
  password_hash TEXT
);

CREATE TABLE ai_predictions (
  prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER REFERENCES machines,
  type TEXT,
  predicted_value TEXT,
  confidence REAL,
  created_at DATETIME
);

CREATE TABLE alerts (
  alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_id INTEGER REFERENCES ai_predictions,
  message TEXT,
  severity TEXT,
  created_at DATETIME,
  resolved BOOLEAN DEFAULT 0
);
