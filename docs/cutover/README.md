# Cutover test backups (5.11)

Three files for the device session. ⛔ **Every figure below is asserted in
`apps/rn/src/data/migrationAudit/cutoverFiles.test.ts`**, so if a file drifts from this page the suite
reds. That is the only reason the numbers here can be trusted on the far side — a hand-made artifact
deciding what a check can see is this repo's most expensive recurring defect.

## The files

| file | what it is for |
|---|---|
| **`v16-populated.json`** | ⭐ **Seed the test phone.** v1.6 ships `readBackupFile`, so importing this into a v1.6 install gives a realistic portfolio in seconds. A hand-typed one ends up being three debts and no history |
| **`v16-damaged.json`** | The same portfolio carrying the defect 5.10 measured — v1.6's onboarding let `Number("4,271")` through as `NaN`, which persists as `null`. The only way to see the repair report render on a device |
| **`v17-envelope.json`** | A v1.7 backup, for the export→import round trip on the new build |

## The figures to check after the upgrade

⚠️ Deliberately distinct values. **A portfolio of round numbers cannot tell a successful migration from a
default** — that is exactly how the pre-5.8 importer looked like it worked while blanking the income.

| | expected |
|---|---|
| Income | **3247** ⚠️ the field that used to arrive blank |
| Pay cycle | **biweekly** |
| Debts | **3** — Visa **4271** · Car loan **11380** · Dental **843** |
| Bills | **4** — Rent 1465 · Electric 138 · Phone 71 · Car insurance 592 (quarterly) |
| Living expenses | **2** — Groceries 483 · Fuel 176 |
| Goal | Emergency fund, target 1500 |
| Strategy | **avalanche** ⚠️ not the default — if it reads snowball, it was defaulted, not migrated |
| Repairs reported | **none** |

## The session

1. **Precondition, and the easiest thing to get wrong:** the phone must have **v1.6 installed from the
   App Store**, not a v1.7 build. If RN storage already exists the bridge correctly declines to run and
   you prove nothing. A phone that has had v1.7 needs the app deleted, 1.6 reinstalled, then seeded.
2. Import `v16-populated.json` into v1.6 (its own Import Backup).
3. Install the v1.7 TestFlight build **over** it — ⛔ **do not delete first.** Deleting takes the WebKit
   container with it, which is the thing being migrated. Same bundle id, so it upgrades in place.
4. Launch once. Compare against the table above.
5. Open **More → `legacy-bridge-probe`**. ⚠️ `keys=0 truncated=no` is a clean install; `keys=0
   truncated=yes` is a failed search. **Same number, opposite findings.**
6. Then, on the same build, the file flows that have no off-device proof: **Export → Save as a file**
   (share sheet), and **Import → Choose a file** with `v17-envelope.json` from Files.

## What a failure looks like

⚡ All three defects 5.10 found were **failures that rendered as ordinary states**, so the tells are
quiet rather than loud:

- **an empty app** after upgrade → the bridge was skipped, not "no data". Check the probe's `truncated`.
- **income blank, everything else fine** → the paycheck mapping, the exact pre-5.8 signature.
- **a debt showing 0 / paid off** → an unreadable balance. It should appear in the repair report instead.
- **strategy reads snowball** → defaulted rather than migrated.
