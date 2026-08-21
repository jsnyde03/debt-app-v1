# M3 — RECOVERY & DEAD ENDS

> **Lens M3** of the P6.8 pre-release audit · repo `debt-app-v1` · branch `v1.7-dev` · commit `dd80f70`.
> **Question:** when something goes wrong, does the user have a way out?
> **External reference:** the set of things that actually go wrong on a real phone — storage refusing to
> open, a write failing, a declined restore, a corrupt backup, a foreign file, no network, a denied
> permission, biometrics unavailable, a lapsed subscription, a migration that half-succeeds, a wipe.
>
> **A finding here is: no surface, no words, or no action — or words that misdescribe what happened.**
> Preference is explicit: *"the user is stuck"* over *"the code is wrong."*

**Status:** in progress — appended incrementally.

---

## Findings

