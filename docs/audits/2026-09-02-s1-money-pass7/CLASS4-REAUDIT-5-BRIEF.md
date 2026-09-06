# Class 4 — re-audit **5**: the brief

> ⛔ **You are a FRESH auditor.** The session that wrote round 4's fixes is not writing this. That is
> `[D79]` step **b**, and it has now paid for itself four rounds running — most sharply in round 4, where
> **all three findings were defects the previous round's fixes created**, including a **blocker**.

## What you are auditing

**Round 4** — the commits from `bc2151ff` to the head of `v1.7-dev`. Round 4 closed `R4-1`–`R4-3` in
[`CLASS4-REAUDIT-4.md`](CLASS4-REAUDIT-4.md).

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM THE FINDING LIST.**

```
git diff --stat bc2151ff..HEAD -- apps packages scripts
git log --oneline bc2151ff..HEAD
```

**6 files, +142/−25**, over 6 commits. **Four of them are the harness that certifies every other finding
closed** — `check-finding-guards.ts`, `prove-guards.ts`, `test-gate-plants.ts`, `finding-guards.json`.
Weight accordingly.

**Cumulative scope — `[D79]` step c.** Class 1's **95** + class 4's 11 + rounds 1–4's 8 + 6 + 4 + 3 =
**127**.

⚠️ **Derive it two ways and treat a disagreement as a finding.** ⛔ **The two derivations available here
are NOT independent** — both depend on the out-of-band fact that `W9b` exists only in
`DEBT_ELEVATION_LOG.md`. A file-driven enumeration of this directory returns **123** and reports no error,
and a heading-shaped enumeration is silently **zero on five of the six class-1 rounds**. Round 4 measured
that and said so; do not treat their agreement as confirmation.

## The two questions, and nothing else

1. **Is each closed?** Not *"is there a fix"* — is the defect refused, **by planting**, red for the reason
   that names it.
2. **What did round 4's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

## ⛔ Where round 4 is most likely to have gone wrong

⚠️ **Leads, not a checklist. A stated mechanism is a hypothesis** — and in round 4 the brief's own
**highest-value lead was refuted by measurement**, so treat these the same way.

- ⛔ **`freed: isOneTimeBnplLump(subject) ? 0 : …` — IS 0 RIGHT AT EVERY SURFACE THAT READS IT?** The fix
  relies on `showCascade` (`nextDebtName != null && freedPerMonth > 0`) and `ShareCard`'s own `> 0` to
  omit the clause. **Check the a11y utterance, the ShareCard, and any persisted `pendingPayoff` blob**:
  is there a reader that renders `freed` **without** a `> 0` guard, or one that treats 0 as "unknown"
  rather than "none"? And a stored `pendingPayoff` written by an OLDER build carries the old value —
  what renders then?
- ⛔ **THE ONE-TIME ROW WAS ADDED TO A TABLE THAT ITERATES SHAPES. WHAT SHAPE IS STILL MISSING?** Round 3
  iterated four and shipped a blocker in the fifth. Enumerate `BNPL_MONTHLY_FACTOR`'s keys and every
  `recurrence` the app can persist, and check the celebration against **all** of them — `per-paycheck`
  especially, which is the only recurrence `cyclesPerMonth` actually changes and which **round 4 recorded
  as asserted nowhere**.
- ⛔ **`const resolved = proof.expect ?? token ?? ''` — is the refusal now correct in BOTH directions?**
  It must refuse a resolved-empty expectation and **must not** refuse a legitimate one. Round 3's first
  cut of this rule broke two of `prove:guards`' own self-test controls by being too broad. Re-run
  `--selftest` and, separately, confirm no live registry entry became unprovable.
- ⛔ **THE BORROW WAIVER NOW REQUIRES THE NOTE TO NAME A LENDER, VIA A `replace()` ON THE ID.** Attack the
  matcher: an id whose prefix the regex does not strip; a note naming a **different** entry than the
  actual lender; a note containing the lender id as a substring of a longer id. **Fire-count anything you
  propose** — round 2's remedy fired on 90 legitimate entries, round 3's candidates on 84 and 30.
- ⚠️ **The `[R3-3-borrow]` fixture now carries `"proofNote": "shares a red"`.** Round 4 measured that
  reverting `waived` gives `reason=WRONG`. **Is `reason=WRONG` the right discriminator, or is the scenario
  now redding for the fixture's `MIN_ENTRIES` problem rather than for the borrow?** Read the planted run's
  full output, not its exit code.
- ⚠️ **`authored` is 9 against a cap of 9 — headroom ZERO.** Any new proof you propose re-enters the
  record-deadlock. Say so rather than working around it silently.

## Method — non-negotiable, and round 4 paid for the last two

- ⛔ **A plant must make an assertion FAIL, never THROW past it** — including failing to COMPILE.
- ⛔ **Verify every restore with `cmp`** against a copy taken BEFORE the plant. Never `git diff`, never
  `git checkout --`.
- ⛔ **PUT THE RESTORE IN A `finally`.** A 10-minute tool timeout stranded a plant on disk in round 4; the
  tree was only saved because the next command re-checked it. A plant loop's last action is the restore,
  so nothing normally runs after it.
- ⚠️ **Force UTF-8 on BOTH ends of any subprocess capture.** Round 4 lost two measurements to cp1252:
  `subprocess.run(..., encoding="utf-8", errors="replace")` **and** `PYTHONIOENCODING=utf-8` for printing.
  Both failures looked like the measurement, not the harness.
- ⚠️ **`cd /c/Users/Jason/debt-app-v1 &&` in EVERY shell call**, including backgrounded ones. The working
  directory resets, and a command that runs in the wrong repo returns empty output that reads as a real
  negative result.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`) — CRLF repo. **Edit `finding-guards.json` with a JSON
  serializer**; the `indent=2, ensure_ascii=False` round-trip is byte-identical here.
- ⚠️ **A guard token must be in CODE and stop before any `${`.** Four corrections so far.
- ⚠️ **Keep probes OUT of `apps/rn/`** — use `class4-reaudit5-probes/`.
- **Write findings incrementally to disk.** ⛔ **No sub-agents.** Quote worst-case spend before anything long.

## Output

`CLASS4-REAUDIT-5.md` here. Per finding: **consequence · `file:line` · the measurement · mechanism (marked
HYPOTHESIS) · remedy (marked UNVERIFIED)**, severity `blocker`/`major`/`minor`. Record what you measured
and found **not** to be a defect, too.

⛔ **A finding can be right while its fix is wrong, and this cluster has measured that five rounds
running.** Round 3's `Math.floor` remedy was **strictly worse than the bug**. Round 4's own report was
right about a defect and **wrong about its exposure** (10 entries claimed, 4 measured). State remedies as
UNVERIFIED and measure before recommending.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files, and
**commit nothing**.
