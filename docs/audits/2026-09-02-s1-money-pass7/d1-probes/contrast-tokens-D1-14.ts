// D1 probe: which colour tokens does lint:contrast's grid actually cover?
import { colors } from '../../../../apps/rn/src/theme/colors.ts';

const GROUNDS = ['primary', 'secondary', 'tertiary', 'elevated'];
const FOREGROUNDS = ['text.primary','text.secondary','text.tertiary','accent.primary','accent.brand','accent.success','accent.warning','accent.danger','accent.gold'];
const EXTRA = ['text.onAccent','surface.heroText','surface.heroSub','surface.goldPillInk','accent.brand','surface.heroTop','surface.heroBottom','surface.goldPill','accent.accentSoft'];

const all = (g: string) => Object.keys(colors[g as keyof typeof colors] as object).map((n) => `${g}.${n}`);
for (const g of ['text', 'accent', 'background', 'surface', 'border']) {
  const names = all(g);
  const covered = names.filter((n) => FOREGROUNDS.includes(n) || EXTRA.includes(n) || (g === 'background' && GROUNDS.includes(n.split('.')[1])));
  const missing = names.filter((n) => !covered.includes(n));
  console.log(`${g}: ${names.length} tokens · ${covered.length} named by the grid/EXTRA_PAIRS · ${missing.length} named nowhere`);
  if (missing.length) console.log('   uncovered: ' + missing.join(', '));
}
