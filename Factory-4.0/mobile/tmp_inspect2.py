p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    lines = f.readlines()
line = lines[42]
print('LINE42 REPR:', repr(line))
print('LINE42 RAW:', line)
print('SUB from "Authorization":', line[line.find('Authorization'):line.find('}')+1])
print('ALL CHARS:', [ (i,c,ord(c)) for i,c in enumerate(line[:80]) ])
