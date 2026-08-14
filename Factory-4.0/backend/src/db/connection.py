import os
import sqlite3

# load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))
except Exception:
    pass

# psycopg2 is an optional dependency for Postgres support
try:
    import psycopg2
    from psycopg2 import extras
except Exception:
    psycopg2 = None
    extras = None

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'fas.db')


def is_postgres():
    host = os.getenv('DB_HOST')
    # Treat empty/None as SQLite
    return bool(host and host != '' and host.lower() not in ('sqlite', 'localhost-sqlite')) and psycopg2 is not None


class _CursorWrapper:
    def __init__(self, raw_cursor):
        self._cur = raw_cursor

    def execute(self, sql, params=None):
        # Translate sqlite-style ? params to psycopg2 %s params
        if params is None:
            params = None
        try:
            if isinstance(sql, str) and '?' in sql:
                sql = sql.replace('?', '%s')
            return self._cur.execute(sql, params)
        except Exception:
            # re-raise for visibility
            raise

    def executemany(self, sql, seq_of_params):
        if isinstance(sql, str) and '?' in sql:
            sql = sql.replace('?', '%s')
        return self._cur.executemany(sql, seq_of_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    @property
    def description(self):
        return self._cur.description

    @property
    def lastrowid(self):
        # psycopg2 does not support lastrowid; caller should use RETURNING in queries for Postgres
        return getattr(self._cur, 'lastrowid', None)

    def close(self):
        return self._cur.close()


class PostgresConnWrapper:
    def __init__(self, conn):
        self._conn = conn
        self.row_factory = None

    def cursor(self):
        # use RealDictCursor so fetchall() returns list of dicts
        raw = self._conn.cursor(cursor_factory=extras.RealDictCursor)
        return _CursorWrapper(raw)

    def commit(self):
        return self._conn.commit()

    def close(self):
        return self._conn.close()


def get_db_connection():
    """
    Returns a DB connection object. For SQLite it returns a sqlite3.Connection (with row_factory support).
    For Postgres it returns a PostgresConnWrapper whose cursor() yields dict-like rows and supports ?-style params.
    """
    if is_postgres():
        host = os.getenv('DB_HOST', 'localhost')
        port = int(os.getenv('DB_PORT', 5432))
        db = os.getenv('DB_NAME', 'fas')
        user = os.getenv('DB_USER', 'postgres')
        pwd = os.getenv('DB_PASSWORD', 'postgres')
        conn = psycopg2.connect(host=host, port=port, dbname=db, user=user, password=pwd)
        return PostgresConnWrapper(conn)

    # Fallback to sqlite
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
