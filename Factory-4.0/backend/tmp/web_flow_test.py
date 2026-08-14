import requests, io
from PIL import Image, ImageDraw

base='http://localhost:8000'
# create image
img = Image.new('RGB',(256,256), color=(73,109,137))
d = ImageDraw.Draw(img)
d.text((40,110),'WebTest', fill=(255,255,255))
buf = io.BytesIO(); img.save(buf, format='JPEG'); buf.seek(0)
files = {'file': ('webtest.jpg', buf, 'image/jpeg')}
# register as manager
print('Registering...')
r = requests.post(base + '/api/auth/register-face', data={'name':'WebUser','role':'manager'}, files=files, timeout=15)
print('reg status', r.status_code, r.text[:200])
# reset buffer
buf.seek(0)
files = {'file': ('webtest.jpg', buf, 'image/jpeg')}
print('Logging in...')
r2 = requests.post(base + '/api/auth/login-face', files=files, timeout=15)
print('login status', r2.status_code)
print(r2.text)
try:
    token = r2.json().get('token')
except:
    token = None
if token:
    print('\nCalling /api/maintenance with token...')
    h={'Authorization':f'Bearer {token}'}
    r3 = requests.get(base + '/api/maintenance', headers=h, timeout=15)
    print('maintenance status', r3.status_code)
    print(r3.text[:400])
else:
    print('No token')
