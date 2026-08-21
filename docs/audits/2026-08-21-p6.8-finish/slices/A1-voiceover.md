# A1 — VoiceOver depth

> Lens A1 of the P6.8 pre-release sweep. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Written incrementally; findings are appended as they are established.

## Instrument, and what it can and cannot say

**Primary:** `apps/rn/capture-ref/p6.8-a11y/<surface>.txt` — nine web accessibility trees emitted as
ordered YAML by Playwright's `locator.ariaSnapshot()`. **Roles, accessible names, states and traversal
ORDER are real.** Spoken rendering, rotor navigation, focus under a live screen reader, and haptics are
**not in this instrument** and are routed to P6.14 rows at the end of this file.

**Cross-check:** the rendered frames at `apps/rn/capture-ref/p6.8/phone/light/<surface>.png`, used to tell
*"little is exposed"* apart from *"this seed rendered little"*.

**Source:** `apps/rn/src/**`, plus the three existing gates I calibrated against so findings are additive —
`scripts/check-native-a11y-props.ts`, `scripts/check-a11y-collapse.ts`, `apps/rn/tests/e2e/a11y-axe.spec.ts`.

### ⚠️ One artifact of the instrument that must be understood before reading any finding below

Playwright's `ariaSnapshot()` **merges contiguous un-grouped text into a single `- text:` node.** A long
run-on `- text:` line in these dumps therefore means the opposite of what it looks like: it means that
region has **no** `accessible`/`accessibilityLabel` grouping at all, so the snapshotter concatenated it.
It does **not** mean the app built one giant label. Deliberate groups from `groupLabel()` appear instead
as the **quoted accessible name** of a `button`/`heading` (e.g. `button "Card, $5,000 · 20% APR, verified,
$100/mo"`). Both patterns appear in these dumps and they are different defects, so each finding below
states which one it is.

_(findings follow)_
