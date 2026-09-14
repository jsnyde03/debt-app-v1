# ▶ START HERE, COLD — class 5, `.12.6.5.8`: the `[D79]` re-audit

**Rewritten 2026-09-14 at the close of `.5.7`.** The active build is **`.12.6.5.8`**, the row marked ▶ in
[`DEBT_ELEVATION_PLAN.md`](../../DEBT_ELEVATION_PLAN.md). Its numbered sub-steps (8.1–8.5) are the sequence. Detail for
everything class 5 built lives in `DEBT_ELEVATION_LOG.md`, searchable by `.12.6.5`.

⛔ **🎯 2026-09-14: this re-audit is dispatched from a FRESH SESSION, and the audit itself is run by FRESH AGENTS.** The
session that built class 5 wrote this handoff and stopped. Do not reuse its conclusions as the brief's verdicts: hand the
auditors the fix range, the findings and the attack points, never an answer.

## ⛔ Verify the state. Do not take a row of it on trust.

```
cd /c/Users/Jason/debt-app-v1
git status --porcelain --untracked-files=all          # expect empty
git log --oneline -3 ; git rev-list --count origin/v1.7-dev..HEAD     # expect 0
gh run list --branch v1.7-dev --workflow web-e2e.yml --limit 2 --json headSha,status,conclusion
npm --prefix /c/Users/Jason/debt-app-v1 run lint:rn -- --fast
npm --prefix /c/Users/Jason/debt-app-v1 run lint:finding-guards
```

⚠️ **No SHA of this handoff's own commit is quoted, on purpose** — a document cannot name the commit it ships in, and a
pasted hash goes stale the moment it is written. `86a1901c` is `.5.7`'s last CODE commit; the docs commit carrying this
file sits on top of it. Ask `git log`.

Expected: tree clean and pushed · CI `conclusion: success` on HEAD · fast gates all green · finding-guards green with
**stale 2 (cap 8)** — `S1-ROUTE-STALE-READ` and `S1-ROUTE-EXIT-REACHABLE`, both held for pass 8 — and **authored 9 (cap 9)**.
⛔ **Read CI's `conclusion` field**, never a watcher's exit code.

## What `.5.7` closed, in one screen

- **④a** a queued Siri payment or payday tap that outlives its drain applies once — through a second drain, Undo, restore
  and reset (`store/appliedIntents.ts`, carried by the store's set wrapper).
- **④a** ⛔ **pass-6 `C3-6` was reopened** — its closed guard could never fire — and closed: a Lock Screen tap names the
  payday it was drawn for; `lastHandledPaydayDate` no longer refuses the roll *(🎯)*.
- **④b** three surfaces promising money the engine would not hold now ask the engine: the reserve offer (**pass-7 `B1-2`,
  a blocker, pulled forward from class 6**), the Cash Runway hold line, the save-for-it confirmation.
- **⑤** `hero-date-fit`'s host-dependent red was a real clip on web; the date now sizes to its slot regardless of font.
- **⑦** one registration batch of 14 proofs and one drain: **26 of 26 MATCHED**.

## What the `.5.8` brief must carry

- **The fix range:** from **`c7df99c2`** (class 4 closed, class 5 promoted) to the pin. ⛔ **Corrected 2026-09-14 at
  `.5.8.1`** — this line first said `72bd6619`, which is `.5.7` alone: 14 of the class's 76 commits and 25 of its 70 code
  files. Derive the changed files by `git diff --stat c7df99c2..<pin>`, never from this list. → **the brief is
  [`CLASS5-REAUDIT-BRIEF.md`](CLASS5-REAUDIT-BRIEF.md)**.
- **The questions `[D79]` fixes:** is each class-5 finding actually closed · what did the fixes break · **interaction** with
  already-closed classes (shared file, import or producer) · guards whose pinned files moved · closure by PLANTING, not by
  `lint:finding-guards` (a deletion detector, not a proof).
- **The exit:** zero new defects ATTRIBUTABLE to class 5's fixes. Reservoir defects are filed to their own class.
- **Dispatch shape:** fresh lane agents, **no sub-agents**, each writing findings to disk as it goes.

## ⚠️ Open items carried out of `.5.7`

- ✅ **CI's font for `hero-date-fit` — MEASURED, and it is NOT Roboto.** Run `34867948477` on `c9065152`: "September" =
  **5.00 em** at 402 pt (Roboto 4.78 · Segoe UI 5.17 · Arial 5.77). The Roboto explanation of CI's old green is refuted and
  the backlog row says so; the face is unidentified. The fix held on it — the run concluded `success`. Not a `.5.8` item.
- **The Payday Countdown Live Activity almost never starts** — it counts from `currentDate`, which nothing moves with the
  calendar. Measured, filed to the backlog, not fixed.
- **Save-for-it's "ready by" date** needs a multi-cycle instrument → P6.10.
- **`native-e2e` has not compiled `.5.7`'s Swift** (`PaydayLandedIntent` in both copies, `PaydayLiveActivity`). Manual
  dispatch only; batch it with the next native change.

## ⚠️ Traps this session paid for

- **The Edit and Write tools decode a backslash-u escape** in their input into the character it names. It wrote a raw ESC
  into a committed log once. Describe such text in words; anchor edits on backslash-free lines.
- **The shell's working directory drifts between calls.** A relative `--prefix apps/rn` and a relative Playwright config both
  resolved to `apps\rn\apps\rn\…` and never ran. Use absolute paths; an exit code from a run that never started is not a verdict.
- **`grep -l` matches CONTENTS, not names** — it reported a spec missing that `git ls-files` found. **`node -e` probes can print
  nothing at all** — write probes to a file.
- **[D81]:** per fix, `npm run lint:rn -- --fast` (static gates, self-tests skipped and named); full `lint:rn` at a sub-step's
  close or after a gate script, `scripts/lib/` or the harness changed.
- **The proof caps force an ORDER.** A `MIN_ENTRIES` raise stales the six proofs that plant into `check-finding-guards.ts`;
  new entries push `authored` over its cap; readers cannot prove while the ledger is red. Prove new entries and stale
  non-readers first, gate-check, then readers. `prove:guards` requires only each proof's own targets clean
  (`prove-guards.ts:351`), so records accumulating in the registry do not block the next id.
- **A usage count from grep includes comments.** eslint caught an import left unused that grep had counted as used.
- ⛔ **Pass-6 and pass-7 finding ids COLLIDE.** `S1P7-C3-6-LIVEACTIVITY-END-LANDED` is not pass-6 `C3-6`.
- **NEVER `git add -A`.** Stage explicit paths.
