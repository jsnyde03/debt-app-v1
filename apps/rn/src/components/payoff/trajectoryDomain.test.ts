import type { TrajectoryPoint } from '@/store/payoffSelectors';

import { endPillWidth, MIN_DOMAIN_MONTHS, trajectoryDomain, truncateToDomain } from './trajectoryDomain';

/**
 * P6.8.7g.4 (audit P1-3 / [D58]) — the payoff chart's x-domain.
 *
 * ⛔ **The defect this pins failed in the direction of the user doing WELL.** The domain was the extent of
 * everything drawn, and the minimums ghost is by definition the longest curve — so the closer someone got
 * to debt-free, the smaller the share of the axis their own line occupied. Measured on the app's own
 * seeds before the fix: **7.3%** of the width on the base seed, **4.8%** on the near-payoff one.
 *
 * ⚠️ **Half these cases exist for properties the OLD expression got RIGHT.** A finding names what is
 * wrong; it says nothing about what the site was also doing. The lean cone's reach and the
 * never-pays-off fallback are both pre-existing correct behaviour that a naive clamp would have broken.
 */

let passed = 0;

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function eq<T>(actual: T, expected: T, label: string) {
  assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/** A curve from `from` down to zero at `to`; `null` `to` never reaches zero. */
function curve(from: number, to: number | null, horizon = to ?? 120): TrajectoryPoint[] {
  const pts: TrajectoryPoint[] = [];
  for (let m = 0; m <= horizon; m++) {
    const balance = to == null ? from : Math.max(0, from * (1 - m / to));
    pts.push({ month: m, balance });
  }
  return pts;
}

function run() {
  console.log('Running payoff trajectory domain (P1-3) tests...');

  // ── the defect itself: a short plan against a long minimums curve ──
  {
    const active = curve(5000, 8);
    const ghost = curve(5000, 109);
    const domain = trajectoryDomain({ active, cone: [], all: [...active, ...ghost] });
    // Pre-fix this was 109 and the user's 8-month curve had 7.3% of the axis.
    eq(domain, 10, 'an 8-month plan against a 109-month ghost gets a 10-month axis, not 109');
    assert(8 / domain > 0.75, 'the user’s own curve now occupies most of the width');
  }
  {
    // The near-payoff seed — the case the finding called a "~4px sliver".
    const active = curve(1200, 2);
    const ghost = curve(1200, 42);
    const domain = trajectoryDomain({ active, cone: [], all: [...active, ...ghost] });
    eq(domain, MIN_DOMAIN_MONTHS, 'a 2-month payoff is floored, not clamped to 2');
  }

  // ── ⚠️ properties the OLD expression got right ──
  {
    // The lean (variable-income) curve pays off LATER than the typical plan. Clamping to the active
    // curve alone would cut the cone off — the exact thing the old comment said it was preventing.
    const active = curve(5000, 20);
    const cone = curve(5000, 34);
    const ghost = curve(5000, 109);
    const domain = trajectoryDomain({ active, cone, all: [...active, ...cone, ...ghost] });
    assert(domain >= 34, `the domain reaches the LEAN date, not just the active one (got ${domain})`);
    eq(domain, 40, 'and it is the lean end plus the margin, not the ghost’s extent');
  }
  {
    // A plan that never clears has no end to clamp to and must still draw across the full extent.
    const active = curve(5000, null, 600);
    const ghost = curve(5000, null, 600);
    eq(trajectoryDomain({ active, cone: [], all: [...active, ...ghost] }), 600, 'a plan that never pays off keeps the full extent');
  }
  {
    // Never wider than what is actually drawn: with no ghost, the margin must not invent empty axis
    // beyond the last real point.
    const active = curve(5000, 20);
    eq(trajectoryDomain({ active, cone: [], all: active }), 20, 'with nothing longer to show, the axis stops at the data');
  }
  {
    // Degenerate: an empty chart still yields a usable (non-zero, non-NaN) domain.
    const d = trajectoryDomain({ active: [], cone: [], all: [] });
    assert(Number.isFinite(d) && d >= 1, `an empty chart yields a finite domain (got ${d})`);
  }

  // ── truncation: the ghost stops AT the frame, not short of it ──
  {
    const ghost = curve(5000, 109);
    const cut = truncateToDomain(ghost, 10);
    assert(cut.length > 0, 'truncation returns something');
    // ⛔ The last point must be PAST the domain, not at it — otherwise the drawn segment stops short and
    // leaves a visible gap between the curve and the edge of the plot.
    assert(cut[cut.length - 1].month > 10, `the kept tail crosses the edge (last month ${cut[cut.length - 1].month})`);
    eq(cut[cut.length - 1].month, 11, 'and it crosses by exactly one point, not more');
  }
  {
    const short = curve(5000, 8);
    eq(truncateToDomain(short, 10).length, short.length, 'a curve inside the domain is untouched');
  }

  // ── [V3-5 · P6.8.9.7.7] The end pill's width estimate, at scales no e2e can produce ──────────────
  //
  // ⛔ V3-5 came back `CLOSED-UNPINNED` because **nothing in the repo could reach it**: `fontScale` is
  // always 1 in react-native-web, and `lint:type-scale`'s floor is 30 pt while this pill's text is 11.
  // Extracting the expression is what made it testable at all — the instrument had to change, not the test.
  {
    const S = 1.2; // LABEL_SCALE_MAX
    const at1 = endPillWidth('Oct 2026', 1, S);
    eq(at1, 20 + 8 * 6.5, 'at 1× the estimate is the unscaled width');

    // ⛔ THE PROPERTY THAT MATTERS: an UPPER bound. Under-estimating clamps the pill into a box smaller
    // than it draws, which is the overflow V3-5 is about — so this must never shrink as scale rises.
    assert(endPillWidth('Oct 2026', 1.2, S) > at1, 'it grows with font scale');
    eq(endPillWidth('Oct 2026', 2.0, S), endPillWidth('Oct 2026', 1.2, S), 'and stops at the label ceiling');
    assert(
      endPillWidth('Oct 2026', 0.85, S) < at1,
      'a system scale BELOW 1 shrinks it — the bound tracks the text rather than assuming a floor of 1',
    );

    // ⚠️ The null case is the pre-date state, and it must still reserve room: `null` is "no debt-free date
    // yet", not "no pill". Estimating 0 would let the clamp put it off the edge.
    // ⛔ **PINNED TO A VALUE, NOT TO `> 0`.** [S1.10.6.7.1 · pass-3 m1] The old assertion was
    // `endPillWidth(null, 1, S) > 0`, and the auditor proved it vacuous with a plant: the expression is
    // `(20 + chars * 6.5) * scale`, so the constant `20` term holds it above zero **whatever `chars` is**
    // — including the `0` that would reserve nothing at all for the label. It could not distinguish the
    // two states it existed to separate.
    //
    // ⚡ Compared against `at1` rather than a fresh literal because the fallback's whole meaning is
    // *"reserve an 8-character label's worth"*, and `at1` is `'Oct 2026'` — exactly 8 characters, and
    // already pinned to `20 + 8 * 6.5` six lines above. So this states the intent AND stays anchored to a
    // number, instead of restating the formula (which is `D3-7`'s defect in the same round).
    eq(endPillWidth(null, 1, S), at1, 'a missing date reserves an 8-character label\'s worth — the same as "Oct 2026"');
    assert(
      endPillWidth('September 2026', 1, S) > endPillWidth('Oct 2026', 1, S),
      'a longer label estimates wider — the month NAME is what moves this, not the year',
    );
  }

  console.log(`\n✅ payoff trajectory domain: ${passed} assertions passed\n`);
}

run();
