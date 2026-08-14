p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    lines = f.readlines()
line = lines[42]
print('CHARS 80-120:', [ (i,c,ord(c)) for i,c in enumerate(line[80:120], start=80) ])
print('SUBSTR from 80 to 100:', repr(line[80:100]))
print('FULL LINE:', line)
