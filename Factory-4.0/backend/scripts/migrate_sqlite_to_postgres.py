#!/usr/bin/env python3
"""
Simple migration helper: copies all tables from backend/fas.db (SQLite) into a target Postgres database using env vars.
WARNING: This script uses basic TEXT columns for simplicity and attempts to import CSV data. Review produced tables and types after import.

Usage (from backend directory):
  python scripts/migrate_sqlite_to_postgres.py

Environment variables (or .env): DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
"""
import os
import sqlite3
import csv
import tempfile
import psycopg2
from psycopg2 import sql

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fas.db')
PG_HOST = os.getenv('DB_HOST', 'localhost')
PG_PORT = int(os.getenv('DB_PORT', '5432'))
PG_USER = os.getenv('DB_USER', 'sf_user')
PG_PASSWORD = os.getenv('DB_PASSWORD', 'sf_password')
PG_DB = os.getenv('DB_NAME', 'sf_db')

if not os.path.exists(DB_PATH):
    print('SQLite DB not found at', DB_PATH)
    raise SystemExit(1)

print('Reading SQLite DB:', DB_PATH)
sqlite = sqlite3.connect(DB_PATH)
cur = sqlite.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = [r[0] for r in cur.fetchall()]
print('Found tables:', tables)

print('Connecting to Postgres at', PG_HOST)
pg = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname=PG_DB)
pg.autocommit = True
pgcur = pg.cursor()

for t in tables:
    print('Processing table', t)
    # dump to temp CSV
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
    outname = tmp.name
    writer = None
    cols = None
    for row in sqlite.execute(f'SELECT * FROM "{t}"'):
        if writer is None:
            cols = [d[0] for d in sqlite.cursor().description]
            writer = csv.writer(tmp)
            writer.writerow(cols)
        writer.writerow(row)
    tmp.close()
    if not cols:
        print('Skipping empty table', t)
        continue
    # Create table in Postgres if not exists with TEXT columns
    col_defs = ', '.join([f'"{c}" TEXT' for c in cols])
    create_sql = f'CREATE TABLE IF NOT EXISTS "{t}" ({col_defs});'
    print('Creating table (if not exists):', t)
    pgcur.execute(create_sql)
    # Use COPY to import
    with open(outname, 'r', encoding='utf-8') as f:
        try:
            pgcur.copy_expert(sql.SQL("COPY {} ({}) FROM STDIN WITH CSV HEADER").format(sql.Identifier(t), sql.SQL(',').join(map(sql.Identifier, cols))), f)
            print('Imported', t)
        except Exception as e:
            print('Import failed for', t, e)

pgcur.close(); pg.close(); sqlite.close()
print('Done')
