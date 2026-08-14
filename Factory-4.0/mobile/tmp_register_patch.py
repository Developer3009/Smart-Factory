import re
p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s=f.read()
pattern = re.compile(r"if \(res\.data && res\.data\.status === 'registered'\) \{[^}]*\} else \{[^}]*\}", re.DOTALL)
new = "if (res.data && res.data.token) {\n         setToken(res.data.token);\n         setUser(res.data.user);\n         Alert.alert('Registered and logged in', `Welcome ${res.data.user.name}`);\n       } else if (res.data && res.data.status === 'registered') {\n         Alert.alert('Registered', `User registered as ${role}. Proceeding to login...`);\n         // auto-login after register\n         await loginFace();\n       } else {\n         Alert.alert('Registered', JSON.stringify(res.data));\n       }"
if pattern.search(s):
    s2 = pattern.sub(new, s, count=1)
    with open(p,'w',encoding='utf-8') as f:
        f.write(s2)
    print('patched register')
else:
    print('pattern not found')
