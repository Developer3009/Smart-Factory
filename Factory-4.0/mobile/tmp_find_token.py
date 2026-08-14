p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    for i,line in enumerate(f, start=1):
        if '${token}' in line:
            print(i, line.rstrip())
