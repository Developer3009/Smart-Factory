from PIL import Image
import io
import requests

# create a small test image
img = Image.new('RGB', (64,64), color=(255,0,0))
b = io.BytesIO()
img.save(b, format='PNG')
b.seek(0)
files = {'file': ('test.png', b, 'image/png')}
resp = requests.post('http://localhost:8000/api/auth/register-face', files=files, data={'name':'AutoWebImg','role':'manager'})
print('status', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)
