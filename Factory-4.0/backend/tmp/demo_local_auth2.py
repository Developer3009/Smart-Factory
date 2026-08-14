import io
from PIL import Image, ImageDraw
from src.auth import register_face, find_user_by_image, create_jwt

# create test image
img = Image.new('RGB', (256,256), color=(73,109,137))
d = ImageDraw.Draw(img)
d.text((40,110), "TestFace", fill=(255,255,255))
buf = io.BytesIO()
img.save(buf, format='JPEG')
buf.seek(0)
image_bytes = buf.getvalue()

print('Registering...')
reg = register_face('DemoLocal2', 'manager', image_bytes)
print('Register result:', reg)

user = find_user_by_image(image_bytes)
print('Found user:')
if user:
    print(' user_id:', int(user['user_id']))
    print(' name:', user.get('name'))
    print(' role:', user.get('role'))
    token = create_jwt(user_id=int(user['user_id']), role=user.get('role','operator'), name=user.get('name','User'))
    print('\nJWT:', token)
else:
    print(' No user matched')
