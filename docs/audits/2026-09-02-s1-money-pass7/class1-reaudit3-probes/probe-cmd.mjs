import { readFileSync } from 'node:fs';
const src = readFileSync('packages/core/utils/percentComplete.ts', 'utf8');
const marker = process.argv[2];
if (src.includes(marker)) { console.log(`${marker}_EXPECTED: the defect is present`); process.exit(1); }
console.log(`${marker}: clean`); process.exit(0);
