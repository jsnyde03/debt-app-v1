# S1 pass 4 — auditor **A**: the money engine, and the specs that claim to guard it

**Route:** `ROUTING-A.txt` — 60 files, 7,351 lines. `packages/core/**` + `apps/rn/tests/**`.
**Pin:** `e65f9c7`. **Branch:** `v1.7-dev`.

## Method / isolation

All plants were run in an **isolated detached worktree** at the pin:

```
git -C /c/Users/Jason/debt-app-v1 worktree add --detach /c/Users/Jason/audit-a-wt e65f9c7
```

`node_modules` was junctioned in from the main checkout (read-only use). **No file in
`/c/Users/Jason/debt-app-v1` was edited, committed or pushed.** Verification of that is at the
bottom of this file.

Baseline in the worktree, before any plant:

```
npx tsx packages/core/testing/runRegressionTests   → EXIT=0, "✅ All regression tests passed."
```

---

## 1. Findings

_(appended as confirmed)_

---

## 2. Closure verdicts

_(appended as confirmed)_

---

## 3. Findings tally by origin

_(at end)_

---

## 4. Swept and found clean — BY PATH

_(at end)_

---

## 5. Measured, and NOT a defect

_(at end)_

---

## 6. NOT REACHED — by path

_(at end)_
