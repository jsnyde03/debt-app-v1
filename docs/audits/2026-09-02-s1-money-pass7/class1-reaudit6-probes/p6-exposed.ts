import { readFileSync } from 'node:fs';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
const NL = String.fromCharCode(10);
function isCode(line: string, state: { inBlock: boolean }): boolean {
  const t = line.trim();
  const startsBlock = t.startsWith('/*') && !t.includes('*/');
  const wasInBlock = state.inBlock;
  if (startsBlock) state.inBlock = true;
  else if (wasInBlock && t.includes('*/')) state.inBlock = false;
  return !(wasInBlock || startsBlock || t.startsWith('//') || t.startsWith('*'));
}
for (const f of process.argv.slice(2)) {
  const src = readFileSync(f, 'utf8');
  const oldLines = src.split(NL);
  const state = { inBlock: false };
  const oldKept = oldLines.map((l) => isCode(l, state));
  const newLines = stripCommentsOnly(src).split(NL);
  console.log('=== ' + f);
  for (let i = 0; i < oldLines.length; i++) {
    const nEmpty = (newLines[i] ?? '').trim() === '';
    if (!oldKept[i] && !nEmpty) {
      console.log(`  L${i + 1} OLD-DROPPED / NEW-KEPT:`);
      console.log(`    src: ${JSON.stringify(oldLines[i].slice(0, 130))}`);
      console.log(`    new: ${JSON.stringify(newLines[i].slice(0, 130))}`);
    }
  }
}
