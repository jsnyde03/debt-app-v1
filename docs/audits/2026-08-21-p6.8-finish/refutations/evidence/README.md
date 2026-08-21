# R5 evidence — what Chromium actually does with the markup react-native-web emits

Backing `../R5-a11y.md`. Two static-HTML probes, dumped twice each: through **Playwright's
`ariaSnapshot()`** (the instrument the `p6.8-a11y` trees were captured with) and through **Chromium's
own accessibility tree** via CDP `Accessibility.getFullAXTree` (what a web screen reader consumes).

The two disagree, and that disagreement is the whole of R5-A1-6.

| file | what it shows |
|---|---|
| `ax-probe.html` | the four shapes RNW emits for `<View accessible accessibilityLabel>`, a labelled `role="button"`, a labelled `tabindex`-only div, and an `aria-live` alert |
| `ax-probe-output.txt` | ⚡ Playwright drops the name on every role-less div; **Chromium exposes it** as `generic name="…"`. `aria-live` maps and works. |
| `ax-probe2.html` | `aria-selected` on the three roles the app puts it on: `button`, `radio`, and (as the control) `radiogroup`+`radio`+`aria-checked` |
| `ax-probe2-output.txt` | ⛔ `role="button"` + `aria-selected` → no state at all. `role="radio"` + `aria-selected` → **`checked="false"`**, the chosen option announced as unchosen. |
| `ax-probe.mjs` | the runner, used for both AX dumps |
| `axe-rule-probe.mjs` · `axe-rule-probe-output.txt` | which axe rule catches the `aria-selected` misuse — see below |

Regenerate (from the repo root, `playwright-core` 1.60.0 / `chromium-1228` already installed):

```bash
node docs/audits/2026-08-21-p6.8-finish/refutations/evidence/ax-probe.mjs \
     docs/audits/2026-08-21-p6.8-finish/refutations/evidence/ax-probe.html
node docs/audits/2026-08-21-p6.8-finish/refutations/evidence/ax-probe.mjs \
     docs/audits/2026-08-21-p6.8-finish/refutations/evidence/ax-probe2.html
```

⚠️ **What these cannot say.** They are the markup RNW's `createDOMProps` produces, hand-written, not a
DOM dump from the running web bundle — they prove what the browser does with the shape, not that the
app emits exactly the shape. And a name being present in Chromium's AX tree is not the same as a
screen reader voicing it: a named `generic` may be present-but-never-visited in browse mode. Neither
question is answerable from any tree.

## `axe-rule-probe.mjs` — which axe rule would have caught A1-11

Runs the installed `axe-core` over `ax-probe2.html` with `runOnly:
['aria-allowed-attr','aria-valid-attr-value']`. Result (`axe-rule-probe-output.txt`):
`aria-allowed-attr` flags **both** the `role="button"` and the `role="radio"` shapes;
`aria-valid-attr-value` — which IS in `a11y-axe.spec.ts`'s rule list — flags **neither**. That is the
evidence for the one-string gate recommendation.
