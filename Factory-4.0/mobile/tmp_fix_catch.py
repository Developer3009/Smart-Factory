p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s=f.read()
old = "      Alert.alert('Error', e.toString());\n"
new = "    } catch (e) { Alert.alert('Error', e.toString());\n"
if old in s:
    s2 = s.replace(old,new,1)
    with open(p,'w',encoding='utf-8') as f:
        f.write(s2)
    print('fixed catch')
else:
    print('pattern not found')
