import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const file = pathToFileURL(path.resolve(process.argv[2])).href;
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(file);

console.log('===== Playwright ariaSnapshot (body) =====');
console.log(await p.locator('body').ariaSnapshot());

console.log('===== Chromium CDP full AX tree (non-ignored) =====');
const cdp = await p.context().newCDPSession(p);
await cdp.send('Accessibility.enable');
const { nodes } = await cdp.send('Accessibility.getFullAXTree');
for (const n of nodes) {
  if (n.ignored) continue;
  const role = n.role && n.role.value;
  const name = n.name && n.name.value;
  if (role === 'RootWebArea') continue;
  const props = (n.properties || []).map(x => x.name + '=' + JSON.stringify(x.value.value)).join(',');
  console.log(String(role).padEnd(18) + ' name=' + JSON.stringify(name === undefined ? null : name) + (props ? '  props=' + props : ''));
}
await b.close();
