# Storage Safety Groundwork — Pre-v1.5 Plan

_Created 2026-06-30. A between-versions (post-v1.4, pre-v1.5) safety pass. Pulls the storage-versioning + safe-load work **forward from v1.6** because it must land **before v1.5 adds pay-cycle/journey data structures** — you want the versioning + corruption-handling mechanism in place before the next schema-affecting change, not after. Scope is deliberately small and contained; this is not a re-architecture._

---

## Why now (the sequencing argument)

- v1.6 already schedules "storage schema versioning + migration path" and notes the mechanism must exist **before the first schema-breaking change** ([FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) v1.6).
- **v1.5 ("Track Your Journey") is that schema-affecting change** — it extends pay-cycle history and adds journey/milestone data. So the versioning item is mis-ordered at v1.6; it belongs immediately before v1.5.
- This is a re-order, not a roadmap pause: the work was already planned, it just needs to move one slot earlier for correct dependency order.

---

## The actual defect (verified in code)

Two lossy corruption paths exist today, and the common one is the dangerous one:

1. **Silent overwrite-with-default (the critical one).** [loadStoredState.ts](../lib/storage/loadStoredState.ts) catches a JSON parse error, `console.warn`s, and returns the **fallback default**. Every consumer hook then persists state in a `useEffect` — so on the next render it **writes the default back over the corrupt original**, destroying any chance of recovery. A single corrupt `debtPlanner.debts` value silently wipes every debt, permanently, on an app whose data is local-only with no cloud copy.

2. **Explicit delete.** The legacy [debtPlannerStorage.ts](../lib/storage/debtPlannerStorage.ts) `loadDebtPlannerState()` calls `localStorage.removeItem(STORAGE_KEY)` on parse error — an outright delete. (This `debt-planner-v1` blob appears **vestigial** — referenced only in its own file + docs, not live app code. Confirm and remove as part of this work.)

Neither path distinguishes **"key absent" (legitimate first run → default is correct)** from **"key present but corrupt" (default is data loss)**. That distinction is the heart of the fix.

Additional structural facts (context, not all in scope):
- **~20 independent keys**, no schema version anywhere, no atomic multi-key write. Rollover writes `debts` + `completedRecommendedActions` + `cycleHistory` as separate `setItem` calls — a crash between them leaves inconsistent state.
- Storage logic is scattered across `loadStoredState` + raw `localStorage.setItem` calls in hooks and `app/page.tsx`.

---

## Deliverables

### 1. A single safe-storage module (the centralizing move)

<details>
<summary>New <code>lib/storage/safeStorage.ts</code> — one read/write path all hooks route through</summary>

- `readKey<T>(key, fallback): { value: T; status: 'ok' | 'absent' | 'recovered' | 'corrupt' }`
  - **absent** → return fallback, safe to persist (genuine first run).
  - **ok** → parsed cleanly.
  - **corrupt** → parse failed: **do NOT return a default that will be written back.** Quarantine first (deliverable 2), surface a flag (deliverable 4), and return fallback marked `corrupt` so callers can choose not to auto-persist.
- `writeKey<T>(key, value)` — single write path; the only place version stamping and (future) atomic-batch logic lives.
- Keep the signature close to today's `loadStoredState(key, fallback)` so call-site migration is mechanical.

**Why central:** every v1.5+ data change then inherits versioning + corruption safety for free, instead of each new key reinventing it.
</details>

### 2. Quarantine corrupt data instead of discarding it

On a corrupt read, copy the raw string to `debtPlanner.__corrupt__.<key>.<ISO-timestamp>` **before** returning the fallback. Never overwrite the quarantine. This converts "silent permanent loss" into "recoverable, with breadcrumbs" — and gives a real artifact for a future support/restore flow.

### 3. Schema versioning + migration runner

<details>
<summary>New <code>lib/storage/migrateState.ts</code> + a <code>debtPlanner.schemaVersion</code> key</summary>

- Single `debtPlanner.schemaVersion` integer key.
- `migrateState()` runs at startup: reads stored version, applies an **ordered list of migration fns** up to the current code version, writes the new version.
- **No migrations needed yet** (matches the roadmap) — this is purely the mechanism, in place before v1.5's first schema-affecting change.
- Establish the convention now so v1.5's journey-data shape change ships as migration #1 rather than an ad-hoc parse.
</details>

### 4. Replace silent failure with a surfaced, non-destructive signal

- On `corrupt` status: show a one-time, non-blocking banner ("We couldn't read some saved data and protected the original — you can restore from a backup"). No financial figures in the message.
- Leave a `track('storage_corruption', { key })` seam (no values, just the event) for when analytics lands in v1.6 — wire the call site now, no-op until the provider exists. Honors the v1.6 "never send financial figures" privacy rule.

### 5. Audit + route every key through the module

Mechanically migrate all live `debtPlanner.*` readers/writers off raw `loadStoredState`/`setItem` onto `safeStorage`. Prioritize the **data-bearing** keys (`debts`, `goals`, `requiredExpenses`, `livingExpenses`, `cycleHistory`, `completedRecommendedActions`) first; settings/flag keys (`darkMode`, `hasCompletedOnboarding`, etc.) are lower-stakes and can follow. Remove the dead `debt-planner-v1` blob once confirmed unused.

### 6. (Optional, recommended) Rolling pre-rollover snapshot

Before each destructive rollover, write a single-slot `debtPlanner.__autosnapshot__` of prior state, enabling an in-app "undo last rollover / restore" path. This is the highest-value *user-facing* safety net but is additive — ship deliverables 1–5 first; treat 6 as a fast-follow if the gap allows.

---

## Out of scope (deliberately)

- Atomic multi-key transactions / collapsing the ~20 keys into one blob — real, but a bigger refactor; note it, don't do it here.
- Encryption at rest (a separate divergence-from-Gig/Freedom question, not a corruption fix).
- The FinKit cross-app interchange adapter — waits for Gig to ship its export; rides v1.5/v1.6.

---

## Test strategy

The whole point is correctness, so this is test-led. Add to the existing `lib/testing/` + Playwright suites a **per-status matrix** for `readKey`:

| Stored state | Expected behavior |
|---|---|
| key absent | return fallback, status `absent`, safe to persist |
| valid JSON | return parsed value, status `ok` |
| corrupt JSON | quarantine raw bytes, return fallback status `corrupt`, **original NOT overwritten** |
| older `schemaVersion` | migration runs, version stamped forward, data intact |

Plus a regression test that **a corrupt `debtPlanner.debts` no longer results in an empty persisted debts array** (the headline bug). Re-run the full existing e2e suite — these keys underpin every flow.

---

## Sequencing & risk

1. Build `safeStorage` + quarantine + the test matrix (deliverables 1, 2, 4-seam).
2. Add `migrateState` mechanism + `schemaVersion` (deliverable 3).
3. Route data-bearing keys through it, then flag keys; remove the dead blob (deliverable 5).
4. Optional autosnapshot (deliverable 6).
5. Full regression run before merge.

**Risk:** Low-medium. No new dependencies, no UI surface change beyond the corruption banner, logic is unit-testable in isolation. The one real risk is the call-site audit (deliverable 5) — a missed raw `setItem` bypasses the safety path. Grep-gate it: after the migration, **no `localStorage.setItem("debtPlanner.*")` should remain outside `safeStorage.ts`**. Do it on a branch (per the branch-workflow convention), tests green before merge.
