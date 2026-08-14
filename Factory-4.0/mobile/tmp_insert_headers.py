p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s = f.read()
old = '      setLoading(true);\n'
new = '      setLoading(true);\n        const headers = token ? { Authorization: `Bearer ${token}` } : {};\n'
if old in s:
    s2 = s.replace(old, new, 1)
    with open(p,'w',encoding='utf-8') as f:
        f.write(s2)
    print('inserted')
else:
    print('pattern not found')
