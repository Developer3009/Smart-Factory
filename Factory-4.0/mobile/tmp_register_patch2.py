p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    lines=f.readlines()
for idx,line in enumerate(lines):
    if "if (res.data && res.data.status === 'registered') {" in line:
        start=idx
        break
else:
    print('start not found'); raise SystemExit(0)
# find matching else or closing brace for this if
# we know the original structure has 4 lines inside if then else ... so replace next 6 lines
new_block = ["        if (res.data && res.data.token) {\n",
             "          setToken(res.data.token);\n",
             "          setUser(res.data.user);\n",
             "          Alert.alert('Registered and logged in', `Welcome ${res.data.user.name}`);\n",
             "        } else if (res.data && res.data.status === 'registered') {\n",
             "          Alert.alert('Registered', `User registered as ${role}. Proceeding to login...`);\n",
             "          // auto-login after register\n",
             "          await loginFace();\n",
             "        } else {\n",
             "          Alert.alert('Registered', JSON.stringify(res.data));\n",
             "        }\n"]
# original had the if line plus 6 more lines; replace from start to start+7
end = start+7
lines[start:end+1] = new_block
with open(p,'w',encoding='utf-8') as f:
    f.writelines(lines)
print('patched')
