# `webkit-ios26` — a REAL v1.6 WebKit container

Captured 2026-08-19 by `.github/workflows/legacy-container-capture.yml` from the shipped Capacitor app
built off `origin/v1.6-dev`, running on an **iOS 26.2** simulator. Run
[`32271630276`](https://github.com/jsnyde03/debt-app-v1/actions/runs/32271630276).

## Why this is committed rather than regenerated

⛔ **A synthesised fixture cannot find the defect this one found.** A SQLite file written and closed
cleanly by `node:sqlite` has no write-ahead log. The real one does — and **all 22 keys are in it**:

| copied | result |
|---|---|
| `localstorage.sqlite3` alone | `no such table: ItemTable` |
| main + `-wal` | **22 `debtPlanner.*` keys** |

The main database is **4 KB and does not contain `ItemTable` at all**; the `-wal` beside it is 28 KB and
holds everything. WebKit runs the store in WAL mode and had not checkpointed it. `readLegacyStores.ts`
originally copied only the main file, which on a real device would have read **zero legacy keys** and
reported the user as having no data to migrate — a total, silent migration failure that every synthetic
test passed.

The capture artifact expires after 90 days and the tree that produced it is deleted at 5.5.1, so the
fixture lives here instead.

## What was changed, and what was not

- **Unmodified:** both database files, byte for byte.
- **Shortened:** the two salted directory names. The real ones are 43-character base64
  (`V1hwwAhM1l_7ygNYjVjKXGGmsIrmvTC8bqwMTKJByNU`, twice) and the full path exceeded Windows' 260-character
  limit. **The DEPTH is preserved exactly**, which is the only thing the walk depends on —
  `WebKit/<bundle-id>/WebsiteData/Default/<salt>/<salt>/LocalStorage/localstorage.sqlite3`.
- **Omitted:** `-shm`, which SQLite regenerates (verified: main + `-wal` alone reads all 22 keys), and the
  rest of `Library/` (RevenueCat state, WebKit caches) — none of it is legacy user data.

## ⚠️ What this fixture does NOT prove

Its key set is the **SIM_SMOKE seeder's**, not a real user's. It has `hasConfiguredPaycheck` (seeder-only)
and lacks `isDemoMode`, `resetSnapshot`, `rolloverCount`, `reviewRequested`, `lastHandledPaydayDate` and
any `__corrupt__` quarantine bytes. **It proves LOCATION, SHAPE and the WAL behaviour — not coverage.**
The adversarial corpus is 5.10's job and is built by hand.
