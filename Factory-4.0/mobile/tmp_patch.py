p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s = f.read()
old = "Authorization: `******"
new = "Authorization: `Bearer ${token}`"
if old in s:
    s2 = s.replace(old,new)
    with open(p,'w',encoding='utf-8') as f:
        f.write(s2)
    print('Patched file')
else:
    print('Pattern not found')
