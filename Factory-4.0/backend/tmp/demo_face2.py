import requests, io, json
from PIL import Image, ImageDraw

# create a simple image (placeholder face)
img = Image.new('RGB', (256,256), color=(73,109,137))
d = ImageDraw.Draw(img)
d.text((40,110), "TestFace", fill=(255,255,255))
buf = io.BytesIO()
img.save(buf, format='JPEG')
buf.seek(0)
files = {'file': ('testface.jpg', buf, 'image/jpeg')}
name = 'Test User'
role = 'manager'
base = 'http://localhost:8000'
print('Registering face (sending name/role in query)...')
try:
    r = requests.post(f"{base}/api/auth/register-face?name={name}&role={role}", files=files, timeout=15)
    print('Status:', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)
except Exception as e:
    print('Register request failed:', e)

# Reset buffer to repost
buf.seek(0)
files = {'file': ('testface.jpg', buf, 'image/jpeg')}
print('\nLogging in by face...')
try:
    r2 = requests.post(base + '/api/auth/login-face', files=files, timeout=15)
    print('Status:', r2.status_code)
    try:
        print(json.dumps(r2.json(), indent=2))
        token = r2.json().get('token')
    except Exception:
        print(r2.text)
        token = None
except Exception as e:
    print('Login request failed:', e)
    token = None

if token:
    headers = {'Authorization': f'Bearer {token}'}
    try:
        r3 = requests.get(base + '/api/auth/me', headers=headers, timeout=15)
        print('\n/me ->', r3.status_code)
        try:
            print(json.dumps(r3.json(), indent=2))
        except Exception:
            print(r3.text)
    except Exception as e:
        print('/me request failed:', e)
else:
    print('No token received; cannot call /api/auth/me')
