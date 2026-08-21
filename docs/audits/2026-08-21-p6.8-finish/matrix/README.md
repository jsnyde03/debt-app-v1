# The P6.8 matrix — what the visual lenses are reading

> ⚠️ **RE-SHOT 2026-08-21 after TWO instrument defects were found by the lenses reading it. 226 frames +
> 9 accessibility trees.** The counts below are the corrected run; the section *"The instrument was wrong
> twice"* at the bottom is the part worth reading, because four visual lenses filed against the first one.
>
> **226 frames + 9 accessibility trees**, shot at `dd80f70`.
> ⛔ **The frames are NOT committed** — `apps/rn/capture-ref/` is gitignored by design (regenerated on
> demand, compared against, never diffed). This file is the record of what exists and, more importantly,
> **what does not**.

```bash
npx playwright test --config apps/rn/playwright.shots.config.ts p6.8-matrix   # 186 frames
npx playwright test --config apps/rn/playwright.shots.config.ts p6.8-a11y     # 9 trees
```

→ `apps/rn/capture-ref/p6.8/<viewport>/<theme>/` and `apps/rn/capture-ref/p6.8-a11y/<surface>.txt`

---

## Coverage

| set | count | detail |
|---|---:|---|
| **Routes × theme × viewport** | **100** | 10 routes × {phone · phone-small 320 · ipad-portrait · ipad-landscape · split-view} × {light · dark} |
| **Sheets × theme** | **14** | 7 of 9 recipes × 2 themes, phone. ⛔ **First frames these have ever had in either theme** |
| **States × theme** | **32** | empty · single · many(12 debts/14 bills) · huge($847k, 6 figures + cents) · long-names, on Today/Money/Progress/History/Living |
| **Text-scale approximation** | **40** | 1.35× and 2.0×, both themes, all routes — ⚠️ **not Dynamic Type**, see below |
| **Accessibility trees** | **9** | ordered YAML per surface, with unnamed-control and Guardian-band-word counts |

---

## ⛔ The holes — read these before trusting any lens that reads this matrix

**1 · `log-payment` and `living-expense-sheet` were NOT reached.** Both time out on their open recipe.
`LogPaymentSheet` has a cross-platform door (`DebtSheet`'s `debt-log-payment` row) and its other entry —
the row long-press menu — is **iOS-only** (`RowContextMenu` is a passthrough elsewhere). Whether the
timeout is a bad recipe or a genuinely unreachable control **is itself a question for the lenses**, and
either answer matters: one is a test bug, the other is a primary action with no working path on two of
three platforms.

**2 · DYNAMIC TYPE IS NOT IN THIS MATRIX AND CANNOT BE.** Measured, not assumed
(`DEBT_3.5_DEVICE_QA_CHECKLIST.md:213`): react-native-web has **no OS text scaling** —
`PixelRatio.getFontScale()` is always `1`. The `textscale-*` frames scale text via **CSS**, which
reproduces the failure *mode* (containers hold still while contents grow) at the wrong *fidelity*: web
ignores `maxFontSizeMultiplier`, which the app sets in ~10 places. So those frames **over-report where a
clamp exists and report accurately where none does.** ⚠️ Every finding from them is a hypothesis for the
refutation wave, and the real answer is a **P6.14 device row**.

**3 · A WIDE VIEWPORT IS NOT AN iPad.** `phase35-themes.shot.ts` measured this: the tab bar becomes a
left **rail** on native, and the overlay origin is `0` on web at every width. Layout findings from
`ipad-*` frames are about *width*, not about iPad. The rail, Split-View drag re-layout, and anything
touching native navigation chrome are device-owed.

**4 · NO VOICEOVER.** The `p6.8-a11y` dumps are the **web accessibility tree** — roles, names, states and
**order**, all real and all worth auditing. What they cannot show: spoken rendering of numbers, rotor
navigation, focus behaviour under a live screen reader, haptics. **P6.14.**

⚠️ **And one caveat on tree SIZE.** `ariaSnapshot()` emits only nodes that reach the accessibility tree.
A small tree therefore has two possible causes — *little is exposed to assistive tech* (a finding) or
*this seed rendered little* (an artifact). **A1 must distinguish them per surface, not assume either.**

---

## ⭐ Two things visible in the instrument before a single lens ran

- **`progress`: 14 nodes, ZERO Guardian-band words.** **`money`: 19 nodes, zero.** The band —
  clear/tight/at-risk — is the app's central signal. If it reaches the accessibility tree on neither
  screen, it is conveyed by **colour alone** to anyone using a screen reader. ⚠️ Compare `cushion-forecast`
  (7 band words) and `today` (2): the vocabulary clearly *can* reach the tree, which makes its absence on
  Progress a choice nobody made rather than a platform limit. **A1's first question, already pointed at
  its answer.**
- **`history`: 3 nodes · `living-expenses`: 4.** Either near-empty under the default seed, or barely
  exposed. See the caveat above — this is exactly the pair A1 must tell apart.

---

## How the matrix was built, and the one correction that shaped it

⛔ **`npm run audit:surfaces` is the WRONG inventory for this, and reaching for it would have repeated the
last gate's defect.** It answers *"which money formatter does each route reach"*, counts `_layout.tsx` and
`+not-found` as surfaces, and **contains no sheets at all** — while P6.8's charter is *"every screen ·
sheet · card · state"*. The 14 sheets were enumerated by hand from the tree.

⚠️ **Recipes fail FAST (8 s), and that was learned the expensive way.** The first run used the default
180 s test timeout; one bad locator (`"Log payment"` — the real string is `"Log a payment"`) did not just
waste three minutes, it **killed the whole test and took `living-expense-sheet` and `backup-sheets` down
with it**, with nothing in the log naming them. A slow failure is a silent one.

---

## ⛔ THE INSTRUMENT WAS WRONG TWICE, AND FOUR LENSES FILED AGAINST IT

This is the most transferable thing in the audit, so it is written out rather than summarised.

### Defect 1 — every `onboarding` frame was a photograph of Today

Ten route frames, four text-scale frames, and the a11y tree. The shot **succeeded**, so the `⛔ UNREACHED`
guard — built precisely so the matrix would report its own holes — was structurally blind to it. Caught by
**three independent lenses reading the pictures** (V3, V2, M2), and later by A1 and O1 as well.

**Two wrong mechanisms were proposed before the right one, and the second was re-shot on:**

| # | mechanism | verdict |
|---|---|---|
| 1 | *"`seedStore`/`addInitScript` accumulates across loop iterations"* | **false** — it does accumulate, and the last-registered script still wins |
| 2 | *"the previous surface's app is still alive and its 500 ms autosave races the seed"* — **mine**, implemented, re-shot | **false** — O1 measured it in a brand-new context with nothing navigated before it, and the frame was still Today |
| 3 | `runMigrations` → **`inferOnboarding`** (`migrations.ts:112`) returns `hasIncome && hasObligation`, so a blob carrying a paycheck AND a debt is promoted to `onboardingComplete: true` **whatever the blob says** — and `scenario()` always seeds both | ✅ **the cause** |

⚡ **O1 stated the danger before it happened:** *"a re-shot matrix will produce Today again, this time
carrying a fix's authority."* That is the sharpest lesson here — **a re-shoot on a wrong fix is worse than
the original bug**, because the output looks corrected. The rule it produces: *measure the mechanism,
THEN re-shoot.*

**Fixed** by emptying the plan in the seed (not merely setting the flag false) **and** by giving every
surface a `ready` assertion — a field that already existed on the interface and was used by nothing. A
frame that cannot find its subject now fails instead of lying.

### Defect 2 — `today.png` was shot mid entrance-animation, in both themes, at different points

V1 measured it rather than noticing it: **0.0 % card-token pixels** against 40–44 % on the settled
`state-today-*` frames; the light hero sampling halfway to the ground colour; dark's Progress bars
*physically shorter* on identical data. P1 found the same class in the count-ups — light `today.png`
mid-count at **$577** against dark's settled **$1,032**, same seed.

**A theme-parity lens reading those frames was comparing two moments, not two themes.** Settle raised
**700 ms → 1800 ms** and re-shot.

### What it cost, and the rule

Four visual lenses, O1 and P1 all read a wrong instrument; several findings had to be re-checked against
the corrected frames by refuter R4, and V1 pre-emptively marked its own `V1-0` as *"against the matrix,
not the app"*. ⚡ **An instrument that fails LOUDLY is safer than one that fails accurately most of the
time.** The two sheet timeouts announced themselves and cost two frames; these two said nothing and cost
fourteen, plus whatever six lenses concluded from them.
