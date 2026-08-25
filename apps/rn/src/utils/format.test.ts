import { summariseNames } from '@/utils/format';

/**
 * [P6.8.9.7.11.14.1 · audit P1-4] `summariseNames` — the truncation that replaced a bare `.join(' · ')`.
 *
 * ⛔ **The original defect is the first case below.** `state-today-many.png` rendered
 * `Bill 1 · Bill 2 · … · Creditor 11 — $2,658` as a 23-name run-on filling four lines of the Guardian's
 * shortfall card. The assertion that would have failed then is `more > 0`.
 *
 * ⚠️ The `max + 1` case is the one that matters most and is the least likely to be looked at: truncating
 * there costs the reader a name and buys them *"+1 more"*, which is longer. It must NOT truncate.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`format/summariseNames: ${label}`);
  passed += 1;
}
function eq(actual: unknown, expected: unknown, label: string) {
  assert(actual === expected, `${label} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

const twentyThree = Array.from({ length: 23 }, (_, i) => `Bill ${i + 1}`);

// ── The defect itself: 23 names must not all render ────────────────────────────────────────────────
{
  const { shown, more } = summariseNames(twentyThree, 3);
  eq(shown, 'Bill 1 · Bill 2 · Bill 3', '23 names at max 3 shows exactly three');
  eq(more, 20, '…and reports the other twenty');
  assert(!shown.includes('Bill 4'), 'the fourth name is not in the string at all');
  // ⚠️ Pinned as a LENGTH, not just a count: the finding was about a paragraph, and a helper that
  // returned all 23 names with `more: 20` beside them would satisfy every count assertion above.
  assert(shown.length < 30, 'the shown string is one short line, not a paragraph');
}

// ── The boundary that buys nothing ──────────────────────────────────────────────────────────────────
{
  const four = ['Rent', 'Card', 'Power', 'Phone'];
  const { shown, more } = summariseNames(four, 3);
  eq(more, 0, 'max + 1 names does NOT truncate — "+1 more" is longer than the name it hides');
  eq(shown, 'Rent · Card · Power · Phone', '…and every name is shown');

  const five = [...four, 'Water'];
  eq(summariseNames(five, 3).more, 2, 'max + 2 is where truncation starts earning its place');
  eq(summariseNames(five, 3).shown, 'Rent · Card · Power', '…showing max, not max + 1');
}

// ── Under the limit, and the empty/degenerate ends ──────────────────────────────────────────────────
{
  eq(summariseNames(['Rent', 'Card'], 3).shown, 'Rent · Card', 'a short list is untouched');
  eq(summariseNames(['Rent', 'Card'], 3).more, 0, '…with nothing hidden');
  eq(summariseNames([], 3).shown, '', 'no names → empty string, not "0 more"');
  eq(summariseNames([], 3).more, 0, '…and no remainder');
  eq(summariseNames(['Rent'], 3).shown, 'Rent', 'one name');
  // A caller that computes `max` from a layout could hand us 0. Show the list rather than hide it all.
  eq(summariseNames(twentyThree, 0).more, 0, 'max 0 degrades to the full list, never to "+23 more" alone');
}

console.log(`  ✓ format/summariseNames — ${passed} assertions`);
