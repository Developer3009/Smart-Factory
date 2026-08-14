import requests
r = requests.post('http://localhost:8000/api/auth/register-face', files={'file': open('tmp/demo_face4.py','rb')}, data={'name':'AutoWebUser','role':'manager'})
print('status', r.status_code)
try:
    print(r.json())
except Exception as e:
    print(r.text)
