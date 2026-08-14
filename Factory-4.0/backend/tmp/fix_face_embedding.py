import sqlite3
conn = sqlite3.connect('fas.db')
cur = conn.cursor()
cols = [c[1] for c in cur.execute('PRAGMA table_info(users)')]
print('Existing columns:', cols)
if 'face_embedding' not in cols:
    cur.execute('ALTER TABLE users ADD COLUMN face_embedding TEXT')
    conn.commit()
    print('Added face_embedding column')
else:
    print('face_embedding already exists')
conn.close()
