import { readFileSync } from 'node:fs';

/**
 * `S1.13.7.11` [pass-6 blocker **`C1-15`**] — the Cash Runway receipt's call site.
 *
 * ⛔ **`testEssentialsIsReadNotDerivedFromNet` proves the engine now CARRIES `essentials`. None of it
 * proves this screen reads it** — and the screen is the entire finding: the engine was never wrong, the
 * consumer back-solved. `buildMultiCycleTimeline` changed when `[D2-1]` folded the applied top-up into
 * cycle 0's `net`, `CashRunwayChart` did not, and the symptom appeared here. **A two-producer disagreement
 * is only visible from the side that did not move**, so the side that did not move is what this pins.
 *
 * ⚠️ Both directions, and comments are stripped first: this file's subject NAMES the retired expression in
 * its own docblock, and a scan that reads comments cannot tell a warning about the defect from the defect.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

console.log('\n▶ C1-15 — the Cash Runway receipt reads `essentials`, and names the money it was hiding');

const src = readFileSync(new URL('./CashRunwayChart.tsx', import.meta.url), 'utf8');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

assert(code.includes('function CashRunwayChart'), 'the chart source was actually read');
assert(code.includes('const essentials = cy.essentials;'), 'the receipt READS the carried figure');
assert(
  !/paycheckAmount\s*-\s*cy\.net|cy\.paycheckAmount\s*-\s*cy\.net/.test(code),
  '⛔ …and never back-solves it from the value it is supposed to explain, clamped or otherwise',
);

// ── the fourth row: with `essentials` read, income − essentials no longer equals the total ───
// ⛔ 🎯 2026-09-02 chose to NAME the moved cash rather than fold it into Income. A receipt whose rows do
// not add up is a receipt with a missing row; restating Income would make the moved cash invisible on the
// one screen that exists to say where the money went.
assert(code.includes('const movedIn = cy.movedIn;'), 'the moved cash is read as its own figure');
assert(/movedIn > 0 \?/.test(code), '…and rendered only when there is some, so an ordinary cycle is unchanged');
assert(
  /moved from \$\{EMERGENCY_FUND_NOUN\}/.test(code),
  'the row names where it came from, through the vocabulary owner rather than a second literal',
);
assert(
  /import \{[^}]*EMERGENCY_FUND_NOUN[^}]*\} from '@core\/copy\/vocabulary'/.test(code),
  '  …and that owner is imported, not re-typed',
);

// ── the control that keeps this from being a spelling test ───────────────────────
assert(
  code.includes('label="Income"') && code.includes('label="Expenses & essentials"') && code.includes('label="Left after essentials"'),
  'control: the three original rows are all still rendered — the fourth is an addition, not a replacement',
);

console.log(`\n✅ C1-15 — ${passed} assertion(s) passed\n`);
