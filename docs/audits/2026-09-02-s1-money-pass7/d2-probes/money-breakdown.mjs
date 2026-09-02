import { readFileSync } from 'node:fs';
const WORDS = ['balance','amount','paycheck','payday','payment','debt','reserve','goal','apr','interest','cash','money','currency','dollar','surplus','shortfall','allocat','budget','expense','income','payoff','snowball','avalanche','premium','price','cost','bnpl','minimum','cushion','buffer','cycle','forecast','projection','milestone','subscription','refund','billing','floor','guardian','owe','spend','afford'];
const RE = new RegExp(`(${WORDS.join('|')})`, 'i');
const claims = JSON.parse(readFileSync('scripts/surface-coverage.s1.json','utf8'));
const files = Object.keys(claims);
let byPath = 0, byContent = 0, unreadable = 0, none = 0;
const pathHits = {};
const pathOnly = [];
for (const f of files) {
  const p = RE.test(f);
  if (p) { byPath++; pathHits[RE.exec(f)[1].toLowerCase()] = (pathHits[RE.exec(f)[1].toLowerCase()] ?? 0) + 1; }
  let c = null;
  try { c = RE.test(readFileSync(f,'utf8')); } catch { unreadable++; c = true; }
  if (!p && c) byContent++;
  if (!p && !c) none++;
  if (p && !c) pathOnly.push(f);
}
console.log('surface files          :', files.length);
console.log('money-bearing (either) :', files.length - none);
console.log('  matched by PATH      :', byPath);
console.log('  matched by CONTENT only:', byContent);
console.log('  unreadable->included :', unreadable);
console.log('NOT money-bearing      :', none);
console.log('matched by path but NOT by content:', pathOnly.length, pathOnly.slice(0,10));
console.log('path-word tally:', Object.entries(pathHits).sort((a,b)=>b[1]-a[1]).slice(0,15));
// which single word carries the most CONTENT-only files
const only = {};
for (const w of WORDS) {
  const re = new RegExp(w,'i');
  let n = 0;
  for (const f of files) {
    if (RE.test(f)) continue;
    let t=''; try { t = readFileSync(f,'utf8'); } catch { continue; }
    if (re.test(t)) n++;
  }
  only[w]=n;
}
console.log('content matches per word (top 12):', Object.entries(only).sort((a,b)=>b[1]-a[1]).slice(0,12));
// the SOLE-reason test: how many files would leave the population if word W were removed
const soleReason = {};
for (const w of WORDS) {
  const others = WORDS.filter((x)=>x!==w);
  const RE2 = new RegExp(`(${others.join('|')})`,'i');
  let n=0;
  for (const f of files) {
    let t=f; try { t = f + '\n' + readFileSync(f,'utf8'); } catch { continue; }
    if (RE.test(t) && !RE2.test(t)) n++;
  }
  if (n) soleReason[w]=n;
}
console.log('files whose ONLY money word is W:', soleReason);
