const fs = require('fs');

// 1. Fix api-middleware.ts
let mw = fs.readFileSync('c:/Smart-Factory/fas-saas/lib/api-middleware.ts', 'utf8');
mw = mw.replace('!ctx.permissions.includes("*")', '!ctx.permissions.includes("*") && !ctx.permissions.includes("*:*")');
fs.writeFileSync('c:/Smart-Factory/fas-saas/lib/api-middleware.ts', mw);
console.log('Fixed api-middleware.ts');

// 2. Fix vendors/route.ts
let v = fs.readFileSync('c:/Smart-Factory/fas-saas/app/api/vendors/route.ts', 'utf8');
if (v.includes('if (!body.email || !body.phone)')) {
  // Wait, let's see how body is defined in vendors
  // We'll just replace it back and do it correctly.
  console.log('Vendors route needs manual fix.');
}
