path = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(path,'r',encoding='utf-8') as f:
    lines = f.readlines()
for i,line in enumerate(lines[40:46], start=41):
    print(i, repr(line))
