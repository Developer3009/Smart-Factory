import requests, io
from PIL import Image, ImageDraw
from src.auth import verify_jwt

# create image
img = Image.new('RGB',(256,256), color=(73,109,137))
d = ImageDraw.Draw(img)
d.text((40,110),'TestFace', fill=(255,255,255))
buf = io.BytesIO(); img.save(buf, format='JPEG'); buf.seek(0)
img_bytes = buf.getvalue()
base='http://localhost:8000'
# login
r = requests.post(base + '/api/auth/login-face', files={'file':('f.jpg', io.BytesIO(img_bytes),'image/jpeg')}, timeout=15)
print('Login status', r.status_code)
print(r.text)
try:
    token = r.json().get('token')
except:
    token = None
print('Token repr:', repr(token))
if token:
    try:
        decoded = verify_jwt(token)
        print('Local verify_jwt passed:', decoded)
    except Exception as e:
        print('Local verify_jwt failed:', e)
    # call /me with token
    h = {'Authorization': f'Bearer {token}'}
    r2 = requests.get(base + '/api/auth/me', headers=h, timeout=15)
    print('/api/auth/me status', r2.status_code)
    print(r2.text)
else:
    print('No token')
