# Pass 5 — the dispatch, recorded verbatim

**Dispatched:** 2026-08-30 · **Target tree:** `65566a09b96cdad8072261ac4a710ee1733be467` (`v1.7-dev`, clean).
**Pin the route was generated from:** `e65f9c7` → HEAD. **Agents:** four, fresh, one per lane, in parallel.
**Agent type:** `general-purpose`, model inherited (Opus 5).

## Pre-dispatch verification (the dispatch is part of the audit and gets the audit's rules)

| check | result |
|---|---|
| every path in `ROUTING-{A,B,C,D}.txt` exists on disk | **0 missing** of 393 |
| a file appears in more than one lane | **0 duplicates** |
| lane counts sum to the routed total | 108 + 113 + 122 + 50 = **393** ✓ |
| origin split matches `BRIEF.md` | 68 first-look · 33 fix-churn · 24 instrument · **207 neighbour** · 12 off-surface · **49 s0-first-look** ✓ |
| working tree | clean, 0 modified |
| pre-existing worktrees | none besides the main checkout |

## Per-lane origin split (given to each agent; not in `BRIEF.md`)

| lane | first-look | fix-churn | instrument | neighbour | off-surface | s0-first-look | total |
|---|---|---|---|---|---|---|---|
| **A** | 16 | 10 | — | 55 | — | 27 | 108 |
| **B** | 18 | 10 | — | 76 | 6 | 3 | 113 |
| **C** | 34 | 13 | — | 73 | — | 2 | 122 |
| **D** | — | — | 24 | 3 | 6 | 17 | 50 |

## The constraints every agent was given

1. **Do not spawn sub-agents.** Not one, for any reason.
2. **Heap capped at 1536 MB** (`NODE_OPTIONS=--max-old-space-size=1536`). ⛔ **An OOM is a FINDING, never a retry.**
3. **All plants in an isolated detached worktree** at `65566a09`, `node_modules` junctioned in read-only.
   ⛔ **Nothing in `C:\Users\Jason\debt-app-v1` may be edited** except the agent's own findings file.
4. **Write the findings file in the first three tool calls and append as you go.** A round that reports
   at the end reports nothing when it dies.
5. **No whole-monorepo typecheck.** Typecheck the project you touched.
6. **Kill any server you start, in the step that starts it.**
7. **Verify every restore** — diff against a copy taken AFTER the change, never trust `git checkout --`.
8. **Read a command's own `$?`**, never a pipeline's.
9. **Report split by origin.**

Output files: `A-engine.md` · `B-store-storage.md` · `C-screens.md` · `D-instruments.md`.
