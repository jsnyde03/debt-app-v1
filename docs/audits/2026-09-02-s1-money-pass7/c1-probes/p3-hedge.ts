/* C1 pass-7 probe 3: does the card RENDER the §2.0.d hedge it spends its one-hedge budget on?
 * One store, one variable = `confidence`. The card's own render condition is copied verbatim from
 * PaydayGuardianCard.tsx:401. */
import { buildGuardianBrief, type GuardianInput } from '@core/guardian/buildGuardianBrief';

const base: GuardianInput = {
  isPremium: true,
  floor: 200,
  discretionary: 1000,
  kept: 200,
  deployedToDebt: 800,
  deploySpread: false,
  shortfall: 0,
  focusDebtName: 'Visa',
};

/** PaydayGuardianCard.tsx:401 — the ONLY place `brief.detail` reaches the screen. */
const cardRendersDetail = (b: { staleAdvisory?: boolean; pausedDeploy?: boolean; state: string }) =>
  b.staleAdvisory === true || !!b.pausedDeploy || b.state === 'at-risk';

const cases: [string, GuardianInput][] = [
  ['1 · fresh, clear (no hedge owed)', base],
  ['2 · AGING inputs, clear', { ...base, confidence: { freshness: 'aging' } }],
  ['3 · discovery holdback, clear', { ...base, confidence: { discoveryHoldbackActive: true } }],
  ['4 · cold-start holdback, clear', { ...base, confidence: { coldStartHoldbackActive: true } }],
  ['5 · AGING inputs, TIGHT (discretionary 150)', { ...base, discretionary: 150, kept: 150, deployedToDebt: 0, confidence: { freshness: 'aging' } }],
  ['6 · AGING inputs, AT-RISK (shortfall 300)', { ...base, shortfall: 300, confidence: { freshness: 'aging' } }],
  ['7 · STALE inputs (hard cutoff)', { ...base, confidence: { freshness: 'stale' } }],
];

for (const [label, input] of cases) {
  const b = buildGuardianBrief(input);
  const shown = cardRendersDetail(b);
  const hedged = /a little while ago|planning from the low side|small safety net while I get to know/.test(b.detail);
  console.log(`\n${label}`);
  console.log(`  state=${b.state}  detail RENDERED by the card? ${shown}   detail CARRIES a hedge? ${hedged}`);
  console.log(`  detail = ${JSON.stringify(b.detail)}`);
  if (hedged && !shown) console.log('  >>> HEDGE SPENT AND DISCARDED <<<');
}
