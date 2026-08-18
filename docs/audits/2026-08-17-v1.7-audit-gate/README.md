# v1.7 whole-app audit gate — 2026-08-17

**Target version:** v1.7 "The Elevation", on `v1.7-dev` at the commit below.
**Gate state at audit time:** `validate:release:rn` green — 184 e2e · 10 embed · 10 `test:stamp` · 83 lane checks.

## Method ([D31] — the audits change METHOD, not just model)

**Partitioned fan-out, not redundant.** Six lenses, each given a DISJOINT slice of the generated
artifacts and nothing else. The slices sum to the whole inventory, so coverage is complete by
construction rather than by sampling — and total input is ~par with a single inline pass.

⛔ **No lens was given the carried-in findings list from `DEBT_ELEVATION_PLAN.md`.** That list was
authored by the same agent running this gate, and an audit that inherits its own agenda cannot
discover what the agenda omitted. Anchoring is the specific failure being avoided
(Hearthlight Law II: *any enumerated list becomes the menu the reader orders from*).

⚠️ **Adversarial is applied where this project's record says it PAYS: refutation, not discovery.**
`CoachMarkLayer` is where five mechanisms were asserted and four refuted; Law IV measured 2 of 4
stated mechanisms wrong while all 4 recommendations were sound. So findings are challenged before
they become work, and no finding is trusted for its stated mechanism.

## The lenses

| lens | slice | lines |
|---|---|---|
| L1 | voice & tone — every user-facing string, by file | 1,971 |
| L2 | drift — copy duplicated across files ("two places, one rule") | 88 |
| L3 | proxy + capped-outcome gates — copy gated on a condition | 105 |
| L4 | numbers & visual cohesion — formatters, shared primitives | 51 |
| L5 | states & first-run path — surfaces, vocabulary, coverage | 301 |
| L6 | the unclassified props — the gate's own blind spot | 215 |

## Inputs, verbatim

`slices/` holds exactly what each lens was given. Regenerate the sources with
`npm run audit:strings` · `audit:surfaces` · `audit:coverage`.

⚠️ **Figures move.** At audit time: **844 copy · 358 unclassified · 76 cross-file duplicates ·
93 of 147 conditional gates carry copy · 15 surfaces, 4 reaching >1 money formatter.** Read them
from the generated files, never from a doc quoting them — that has gone stale three times.

## Findings

`findings/` — one file per lens, written incrementally as each lens works.
0b4d4db
