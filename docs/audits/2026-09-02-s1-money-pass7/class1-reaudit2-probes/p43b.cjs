const DET = /\.split\((?:'\\n'|\/\\r\?\\n\/)\)/;
const fs = require('fs');
for (const f of ['check-zz-reaudit-probe.ts','check-apostrophes.ts','check-contrast.ts','check-store-id-writes.ts']) {
  const s = fs.readFileSync('scripts/'+f,'utf8');
  console.log(f, '->', DET.test(s));
}
