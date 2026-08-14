import io, json
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

print('Calling register_face directly...')
res = register_face('Demo Local', 'manager', image_bytes)
print(json.dumps(res, indent=2))

print('\nSearching for user by image...')
user = find_user_by_image(image_bytes)
print(json.dumps(user, indent=2))

if user:
    token = create_jwt(user_id=user['user_id'], role=user.get('role','operator'), name=user.get('name','User'))
    print('\nCreated JWT:')
    print(token)
    print('\nDecoded payload (not verified here):')
    # verify by printing decode via PyJWT not necessary; show token
else:
    print('No user found')
