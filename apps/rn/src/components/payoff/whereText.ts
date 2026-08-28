import type { WhatIfResult } from '@/store/analysisSelectors';

/**
 * The mechanism, in one plain-language line: where the extra dollars actually go.
 *
 * ⛔ **EXTRACTED AT S1.11.3.4, and the extraction IS the fix.** [pass-3 `m6`] The rule lived as a closure
 * inside `WhatIfControls.tsx`, which is why nothing tested it: the file imports React Native and cannot be
 * loaded by the node runner at all. Its registered guard was therefore the fixed line itself — a token that
 * proves the sentence exists and can never be made to red. `tested-helper-is-not-a-used-helper`, in the
 * shape that memory names explicitly: *"if the producer is a closure inside a component, extract it — that
 * shape is why nobody tested it."*
 *
 * ⚠️ **The case this exists for**, and the one `m6` was raised about: when the extra clears the first debt
 * and there is NO second, `second` is `undefined`, so a branch written as `first.isPaidOff && second` was
 * skipped and the fall-through said *"Goes straight to your Chase"* about money that in fact **pays Chase
 * off** — the strongest thing the simulator can say, described as if it merely made a dent. No number was
 * wrong; the better sentence was simply unavailable to the previous shape.
 */
export function whereText(result: WhatIfResult): string | null {
  const paid = result.allocation.filter((a) => a.amount > 0);
  if (paid.length === 0) return null;
  const [first, second] = paid;
  if (first.isPaidOff && second) return `Pays off your ${first.debtName}, then hits ${second.debtName}`;
  if (first.isPaidOff) return `Pays off your ${first.debtName}`;
  return `Goes straight to your ${first.debtName}`;
}
