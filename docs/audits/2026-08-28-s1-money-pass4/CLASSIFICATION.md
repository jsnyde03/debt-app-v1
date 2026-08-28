# S1.11.1 — pass 4 RECORDED and CLASSIFIED

Pin `e65f9c7`. Written **in the same step as the record**, per the standing rule that `s1p2` and `s1p3`
each had to be registered in `SWEPT_CLAIMS` first and it was twice nearly missed.

## What was written

- ⭐ **`s1p4` registered in `SWEPT_CLAIMS`** (`scripts/surface-coverage.ts`) — it was absent.
- **Claims written back to two files**, because the route spans two surfaces:
  `surface-coverage.s1.json` **+106 `s1p4` / +63 `partial`** · `surface-coverage.s0.json`
  **+17 `s1p4` / +16 `partial`**.
- **Coverage moved: S1 `125 → 63` unswept · S0 `62 → 50` unswept.** Both gates green.

⚠️ **The route is 217 files, not the 216 the plan carried.** Both sources — the four manifests and
`ROUTING-ORIGINS.tsv` — agree at **217** with **0 disjoint**. The typed `216` had decayed; it is the ninth
instance of the undercount class, and it was sitting in a row warning about undercounts.

## ⛔ Coverage was NOT credited by route membership

A blanket `s1p4` on all 217 would be exactly the unevidenced-coverage error the resume protocol refused.
Every auditor named what it did **not** reach, so each routed file was classified against its own lane's
§6: **130 fully swept → `s1p4`** · **87 named as not-reached → `partial`**.

⚠️ **Three corrections were made by reading the matches rather than trusting them**, and each would have
inflated the number:

| correction | what it was |
|---|---|
| §6 extraction ran to **end of file** | it swallowed the isolation sections; 12 files were marked not-reached on a mention in a *restore log*. Bounded to the next `##`. |
| `Card.tsx` matched inside **`AffordabilityCard.tsx`** | a basename substring with no path boundary. Now boundary-anchored. |
| `colors.ts` and `haptics.ts` appear in §6 saying **"read in full"** | named in a not-reached section *as exceptions to it*. Overridden after reading the line. |

⭐ **And one correction in the other direction.** C's §6 disclaims three *directories* wholesale —
`components/ui/`, `theme/`, `motion/`, *"not read line-by-line"*. A per-file matcher structurally cannot
see a directory statement, and **silence reads as swept**: **30 more files** were moved to `partial`.
⚠️ C's own sentence says *"the 16 stateless files"* and its route holds **21** under `components/ui/`.

## ⚡ The [D69] table — 29 of 34 COUNT, and ALL EIGHT BLOCKERS COUNT

[D69] exempts a finding from the convergence count when its file was **unswept** — nobody had read it.

| origin | blocker | major | minor | total | swept before pass 4? | [D69] |
|---|---|---|---|---|---|---|
| **fix-churn** | 6 | 5 | 2 | **13** | yes — a claim exists, the bytes moved under it | ✅ **COUNT** |
| **instrument** | 1 | 9 | 4 | **14** | yes — S0 claims | ✅ **COUNT** |
| ⛔ **unrouted** | 1 | 0 | 1 | **2** | yes — `history.tsx` `s1p3` · `progress.tsx` `s1p2` · `journeySelectors.ts` `r17,s1p1` | ✅ **COUNT** |
| **first-look** | 0 | 3 | 0 | **3** | no — never swept by any pass | ⛔ exempt |
| **off-surface** | 0 | 2 | 0 | **2** | **no claims file exists** — `readBackup.ts`, `scripts/tsconfig.json` | ⛔ exempt |
| | **8** | **19** | **7** | **34** | | **29 COUNT · 5 exempt** |

⛔ **Compare pass 3: 9 of 20 blocker+majors counted, because 11 were first-look.** Pass 4 inverts it —
**29 of 34 count, and every one of the eight blockers is on ground a previous pass had already swept.**
The reservoir is not what produced this round; the changed files are.

⚠️ **The two unrouted findings count, and that is the sharper result.** `C4-9` — the Progress ring
crediting **$12,000 the user has not paid** — sits on `progress.tsx`, which carries an `s1p2` claim and was
routed to **nobody** this round because it did not change. A finding on swept ground that no lane was
looking at is the exact shape `S1.11.6` exists to close.

## Where the five exemptions go

⛔ **Exempt from the CONVERGENCE COUNT is not exempt from being FIXED** — [D65] converges on 0/0 of what
counts, and all five are still real defects on the fix list (`S1.11.4`/`.5`).

⚠️ **The two `off-surface` exemptions are exempt for a bad reason** — not because nobody read them, but
because **no inventory exists to say whether anyone did.** `readBackup.ts` and its test are S3 files that
S1's own fixing edited. That is `S1.10.6.10`, held for just-before-S2.
