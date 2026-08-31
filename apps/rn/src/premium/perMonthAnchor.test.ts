/**
 * ⛔ **S1.12.5.8 [pass-5 `C5-6`] — THE PAYWALL'S PER-MONTH ANCHOR, ACROSS REAL STORE CURRENCIES.**
 *
 * ⚡ The old expression re-composed the figure with US placement and US separators after correctly
 * deriving the symbol, so `₩39,000` rendered as **₩3250.00/mo** — ungrouped, with minor units KRW does
 * not have — three lines under a card reading `₩39,000`. ⭐ The US row was right, which is why it survived.
 *
 * ⚠️ **Asserted on the SHAPE, not on an exact localized string.** `Intl` output varies by ICU version and
 * by the runtime's default locale; pinning `"€2.50"` would make this test a record of one machine.
 */
import { perMonthAnchor } from '@/premium/perMonthAnchor';

let passed = 0;
function assert(cond: boolean, label: string): void {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
}

export default function run(): void {
  // ⛔ Zero-decimal currencies must not carry minor units — the defect's loudest case.
  for (const [price, code] of [[3000, 'JPY'], [39000, 'KRW']] as [number, string][]) {
    const out = perMonthAnchor(price, code);
    assert(!/\.\d/.test(out), `⛔ C5-6 — ${code} has no minor units, so the anchor carries none (got ${out})`);
    assert(out.includes('/mo'), `⛔ C5-6 — …and it is still a per-month anchor (got ${out})`);
  }
  // ⛔ …and a two-decimal currency must still carry them.
  for (const [price, code] of [[29.99, 'USD'], [29.99, 'EUR'], [24.99, 'GBP']] as [number, string][]) {
    assert(/\.\d\d|,\d\d/.test(perMonthAnchor(price, code)), `⛔ C5-6 — ${code} keeps its minor units`);
  }
  // ⛔ THE HONEST FALLBACK. With no code there is no way to write the figure correctly, so it is dropped
  // rather than guessed — lane C's own call, and the reason this is not "format it as USD anyway".
  assert(perMonthAnchor(29.99, undefined) === '', '⛔ C5-6 — no currency code drops the anchor, never misformats it');
  assert(perMonthAnchor(29.99, 'NOT-A-CODE') === '', '⛔ C5-6 — …and an unusable code does the same rather than throwing');
  // ⭐ CONTROLS. "return empty always" satisfies every row above.
  assert(perMonthAnchor(29.99, 'USD').includes('2.50'), '⭐ C5-6 control — a real code still produces the figure');
  assert(perMonthAnchor(0, 'USD') === '', '⭐ C5-6 control — a zero price has no anchor to state');

  console.log(`  ✓ C5-6 — the per-month anchor follows the store's currency, or is dropped (${passed} assertions)`);
}
