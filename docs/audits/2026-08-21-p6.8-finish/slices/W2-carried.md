# W2 — THE THREE CARRIED FINDINGS

> Lens **W2** of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Scope is **exactly three** ids — `L1-20`, `L1-22`, `L4-13b` — the only ones P6.4 deferred out of
> the 62 it judged. ⛔ Not a re-run of "T12, ~40 polish items"; that row is stale and stays stale.
>
> Method, in this order: **ledger first, code second.** This project measured that a triage which
> greps the tree first was wrong 9 times in 62 — a fix that adds a *branch* leaves the finding's
> quoted string in place, so grep finds the healthy half of a fix and calls it unfixed.
>
> _Status: IN PROGRESS — written incrementally._

