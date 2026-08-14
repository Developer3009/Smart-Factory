import re
p = r'C:\Smart-Factory.worktrees\project-live-readiness-check\Factory-4.0\mobile\App.js'
with open(p,'r',encoding='utf-8') as f:
    s = f.read()
# Replace Authorization placeholder inside axios.get calls for maintenance and alerts
s2 = re.sub(r"axios\.get\(\`\$\{BASE_URL\}/api/maintenance\`\,\s*\{\s*headers\:\s*\{\s*Authorization\:\s*`[^`]*`\s*\}\s*\}\)\s*", "axios.get(`${BASE_URL}/api/maintenance`, { headers }), ", s)
s2 = re.sub(r"axios\.get\(\`\$\{BASE_URL\}/api/alerts\`\,\s*\{\s*headers\:\s*\{\s*Authorization\:\s*`[^`]*`\s*\}\s*\}\)\s*", "axios.get(`${BASE_URL}/api/alerts`, { headers }), ", s2)
if s != s2:
    with open(p,'w',encoding='utf-8') as f:
        f.write(s2)
    print('patched')
else:
    print('nochange')
