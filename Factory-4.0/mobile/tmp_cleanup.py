p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s = f.read()
s2 = s.replace('), ,', '),')
if s!=s2:
    with open(p,'w',encoding='utf-8') as f:
        f.write(s2)
    print('cleaned')
else:
    print('nochange')
