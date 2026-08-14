import sqlite3
import csv
import os
import zipfile
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))  # backend/tmp -> backend
DB_PATH = os.path.join(ROOT, 'fas.db')
OUT_DIR = os.path.join(ROOT, 'tmp')
now = datetime.now().strftime('%Y%m%d_%H%M%S')
zip_name = os.path.join(OUT_DIR, f'db_export_{now}.zip')

if not os.path.exists(DB_PATH):
    print('ERROR: DB not found at', DB_PATH)
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = [r[0] for r in cur.fetchall()]
if not tables:
    print('No tables found')
    conn.close()
    raise SystemExit(1)

csv_files = []
for t in tables:
    out_csv = os.path.join(OUT_DIR, f'{t}.csv')
    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        writer = None
        for row in cur.execute(f'SELECT * FROM "{t}"'):
            if writer is None:
                # write header from description
                cols = [d[0] for d in cur.description]
                writer = csv.writer(f)
                writer.writerow(cols)
            writer.writerow(row)
    csv_files.append(out_csv)

# create zip
with zipfile.ZipFile(zip_name, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for f in csv_files:
        zf.write(f, arcname=os.path.basename(f))

print('WROTE', zip_name)
conn.close()
