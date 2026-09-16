const fs = require('fs');
let v = fs.readFileSync('c:/Smart-Factory/fas-saas/app/api/vendors/route.ts', 'utf8');
v = v.replace('if (!body.email || !body.phone)', 'if (!email || !phone)');
fs.writeFileSync('c:/Smart-Factory/fas-saas/app/api/vendors/route.ts', v);
console.log('Fixed vendors route');
