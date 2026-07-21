# Today tab — elevation audit (2026-07-21)

Companion to [DEBT_PROGRESS_ELEVATION_AUDIT_2026-07-21.md]. Same 7 criteria (tooling fit · visually impressive · can-we-do-better · liveness · semantic color · redundancy/hierarchy · content/model freshness). _All findings verified against current code._

---

## The one-line verdict
**Today is clean and calm — but completely inert, and its signature moment is wasted.** Unlike Progress, **the gap here is NOT tooling** — a payday checklist is exactly what RN Views are for; it should *not* be Skia-ified. The gap is **motion + emotional beats**: nothing animates, no number counts, and the **"mark a payment paid" tap — the single most important daily win in a debt app — is a plain instant toggle with no haptic and no animation.** That's the miss.

## Verified findings (were claimed / assumed — now checked)
- **`<CountUp>` is used NOWHERE in the app.** The `index.tsx` comment "elevated to the navy hero + count-ups in 1.3" is **stale** — every number on Today is static text. (Content-freshness fail on our own doc.)
- **`CheckCircle` has zero animation and zero haptic** — a `Pressable` with opacity-on-press + instant fill swap. The daily payday win is dead.
- **Cross-screen headline duplication:** the Today hero leads with **"Debt-free by September 2026"** — the *exact same* headline as the Progress ring hero. Two heroes, one line.

## Per-element decisions

| Element | Tooling now | Impressive? | Decision |
|---|---|---|---|
| **PlanHero** | expo-linear-gradient navy panel, text-only, static | ➖ clean but plain + redundant | **T3 — differentiate + craft:** kill the debt-free-date dup (that's Progress's headline) → Today's hero should anchor the **cycle/payday outcome**, not the long-horizon date. Add a restrained signature to the empty navy space (subtle Skia sheen/glow or a tiny cycle indicator). |
| **CheckCircle** (the mark-paid control, used everywhere) | RN Pressable, **no anim, no haptic** | ❌ wasted beat | **T1 (highest) — celebrate the win:** spring check-in + success haptic on mark-paid; ripple/scale; optionally the "Remaining" figure recounts live. RN + Reanimated + expo-haptics (already installed). Highest emotional ROI on the screen. |
| **RequiredActionsCard** | RN Views, checklist, static | ➖ appropriate | Keep the structure (a calm checklist is right). Inherits T1 (row check anim) + T2 (amount count-up, mount stagger). |
| **RemainingAfterRequired** | RN Views, static `$` | ➖ fine, static | **T2:** `<CountUp>` on the amount; it changes as you check items off → make that change *animate* (ties to T1). |
| **RecommendedActionsCard** | RN Views, accent card, focus-first | ➖ fine | Inherits T1/T2. **Nit:** focus row uses a **hardcoded** `rgba(37,99,235,0.06)` → move to a token. |
| **PaydayCaptureSheet** (the Autopilot beat) | not audited visually here | ⚠️ marquee moment | **T4 — its own pass:** logging your payday is the app's signature interaction. It deserves haptics + a satisfying capture animation / mini-celebration. Audit + elevate separately. |
| **PromptCards / empty states** | RN Views, icon+CTA | ➖ fine | Keep; light polish only. |

## Cross-cutting
- **Liveness = the whole story here.** Target: numbers count up on mount/change, cards enter with a subtle stagger, and *every* mark-paid is a felt micro-win (haptic + anim). Reduce-Motion respected. `<CountUp>` + the motion primitives already exist — they're just unused on Today.
- **Tooling ruling:** Today stays **RN + Reanimated**, not Skia. Being comprehensive means matching the tool to the surface — Skia is for viz/glow (Progress, celebrations), not for a checklist. The one exception worth testing: a *restrained* Skia sheen on the hero panel (T3), only if it earns it.
- **Cross-screen cohesion:** resolve the twin debt-free-date headlines (Today = cycle/payday; Progress = the journey/date).

## Recommended sequence
1. **T1 — mark-paid celebration** (CheckCircle: haptic + spring + live recount). The daily beat; touches every row.
2. **T2 — screen-wide motion + CountUp** (mount stagger, counting numbers).
3. **T3 — hero differentiate + craft** (kill the dup headline; restrained signature).
4. **T4 — Payday capture beat** (separate deep pass on the marquee moment).
5. **Nit:** recommended focus tint → token.

Design-first per element; RN/Reanimated build; both-theme web-verify; native motion = Phase-E device gate.
