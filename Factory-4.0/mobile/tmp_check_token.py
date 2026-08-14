p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s=f.read()
print('contains ${token}?', '${token}' in s)
print('contains Bearer ${token}?', 'Bearer ${token}' in s)
print('line with headers:', [line for line in s.splitlines() if 'const headers' in line])
