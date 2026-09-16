const fs = require('fs');
let v = fs.readFileSync('c:/Smart-Factory/fas-saas/lib/validations.ts', 'utf8');
v = v.split('import { z } from "zod";').join('');
v = v.split('import { z } from \'zod\';').join('');
v = v.split('import { z } from `zod`;').join(''); // just in case
const newV = 'import { z } from "zod";\n' + v;
fs.writeFileSync('c:/Smart-Factory/fas-saas/lib/validations.ts', newV);
console.log('Fixed validations.ts completely');
