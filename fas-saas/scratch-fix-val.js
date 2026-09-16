const fs = require('fs');
let v = fs.readFileSync('c:/Smart-Factory/fas-saas/lib/validations.ts', 'utf8');
v = v.replace('import { z } from "zod";', ''); // removes only the first occurrence which is fine, or we can just replace all and add one at the top.
const newV = 'import { z } from "zod";\n' + v.split('import { z } from "zod";').join('');
fs.writeFileSync('c:/Smart-Factory/fas-saas/lib/validations.ts', newV);
console.log('Fixed validations.ts');
