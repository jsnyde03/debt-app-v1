# Debt Elevation — Motion Spec (Phase 0.2)

> The motion system for the Elevation: the vocabulary, the celebration choreography, the haptics, and the tokens — built on a deliberately-chosen premium stack. Companion to `DEBT_PHASE0_DESIGN_SYNTHESIS` §8 (visual language) and `DEBT_MOTION_TOOLING_2026-07-20.md` (the stack selection). Principle throughout: **95% of the app is calm; the 5% of earned beats are genuinely delightful** — restraint is what makes the beats land.

## 1. The stack (from the tooling investigation)

| Layer | Tool | Role |
|---|---|---|
| Engine | **`react-native-reanimated ~4.3`** (Freedom-parity) + `react-native-worklets` | UI-thread springs/timelines; drives `react-native-svg` for ring fills; native `useReducedMotion()` |
| Gestures | `react-native-gesture-handler ~2.31` *(installed)* | swipe / press / pan |
| Ergonomics | **in-house `<Motion>` / `useSpring`** over Reanimated, bound to `motion.ts` | Moti-style DX, no Moti (stale, Reanimated-3-only) |
| GPU / custom visual | **`@shopify/react-native-skia ~2.7`** | gradient/glow rings · the payoff spectacle · future charts + branded visuals |
| Haptics | **`expo-haptics`** + one bespoke Core Haptics payoff pattern | tactile confirmation, reserved |
| Deferred | Rive (future mascot/onboarding) · Lottie (skip) | — |

**Portfolio call:** align with FinancialFreedom on Reanimated 4.x + expo-haptics (shared `motion.ts` / `haptics.ts` primitives); **lead** by adding Skia here first — if it proves out, it becomes the portfolio's next shared layer.

## 2. Principles

1. **Springs for state, timing for entrances.** Interactive/state changes use springs (interruptible, velocity-aware); entrances use short asymmetric timing — **fast in (~300ms), faster out (~150ms)** per the existing `duration` tokens. Only color fades use plain easing.
2. **Motion does spatial work.** A paid debt animates *out* and the plan re-flows; the freed payment visibly *travels* to the next debt. Motion explains a state change; it never decorates a static one.
3. **Restraint is the premium signal.** Daily surfaces (Today lists, Money) get near-zero motion beyond press feedback + count-ups. Depth/glow/particles appear only on heroes and beats. If a motion doesn't teach or reward, cut it.
4. **Every animation degrades.** `useReducedMotion()` gates each effect to a crossfade or instant state; **haptics are retained** under Reduce Motion (they're an accessibility channel, not decoration). All entrances have a static fallback.
5. **Never animate the tab navigator.** No `animation` prop on the Expo-Router `Tabs` (`'shift'`/`'fade'`/`FadeTransition`) — it races `react-native-screens` under New Arch → intermittent black screens (the exact bug Freedom shipped and had to strip). Motion lives *inside* screens; tab switches are instant.

## 3. Tokens (extend `apps/rn/src/theme/motion.ts`, don't replace)

The existing `spring` (default · snappy · gentle · bouncy) and `duration` (instant 100 · fast 200 · default 300 · slow 500 · chart 800 · counter 600) tokens are the contract. Mapping:

| Token | Used by |
|---|---|
| `spring.default` (damping 22 / stiff 280) | screen/card entrances, sheet present, what-if strip |
| `spring.snappy` (18 / 350) | button/press feedback, toggles, mark-paid — **haptic-paired** |
| `spring.gentle` (28 / 200) | number count-ups, ring fills, chart draws |
| `spring.bouncy` (12 / 300) | **milestone/achievement only** — the payoff check-pop; never on daily UI |
| `duration.counter` 600 | number roll-ups |
| `duration.chart` 800 | ring sweep, trajectory draw |
| `duration.fast` 200 / `instant` 100 | exits, micro-feedback |

Additions to author: a `stagger` constant (list item delay ~40ms) and a `celebration` timeline group (see §5).

## 4. Per-surface motion inventory

| Surface | Motion | Token · tool | Reduce-Motion |
|---|---|---|---|
| **Today** hero | payday number **counts up** on load/change; debt-free date **re-rolls** when the plan changes (the linchpin recalc) | `gentle` · Reanimated | show final value instantly |
| Today list | rows **stagger-enter** (40ms) on first paint only; mark-paid check **springs** + haptic | `default`/`snappy` · Reanimated | fade in together |
| Today what-if | apply/reset **strip** slides + stat values re-count | `default`+`gentle` | crossfade values |
| **Progress** ring | fills from current→target on enter; **gradient/glow** ring | `gentle`/`chart` · **Skia** | draw at final value |
| Progress milestones | band hit = inline **ring-pulse** + light haptic | `bouncy` (contained) | static "hit" state |
| Progress momentum | sparkline **draws** left→right; interest-saved counts up | `chart`/`counter` | final frame |
| **Money** | press feedback + segment switch crossfade only — **deliberately calm** | `snappy` | unchanged |
| Sheets / modals | present via spring from bottom; content **not** animated separately | `default` | fade present |
| Buttons / toggles | scale-down on press + `snappy` release, haptic on commit | `snappy` · Reanimated + haptics | scale only (no fade) |
| **Tabs** | **instant** (no navigator animation — §2.5) | — | — |

## 5. The celebration tiers (the emotional core)

Intensity scales to rarity. Three tiers, escalating:

### Tier 1 — Payday (frequent → quiet)
The payday number counts up (`gentle`, 600ms) + **one light haptic** (`impactLight`) on the "captured ✓" confirm. Nothing more — a frequent event must not over-animate.

### Tier 2 — Band milestone 25 / 50 / 75% (occasional → a beat)
The Progress ring **pulses** at the crossed band (a contained `bouncy` scale + a Skia glow bloom that fades in ~500ms) + **light haptic**. Surfaces the milestone math that currently computes but renders nothing. No full-screen takeover.

### Tier 3 — A debt paid off (rare → the one licensed spectacle)
The composed moment, authored in **Skia** for the ring/glow and Reanimated for the sequencing. Choreography:

| t (ms) | Beat | Tool | Haptic |
|---|---|---|---|
| 0 | Navy beat panel composes in (scale 0.96→1 + fade) | Reanimated `default` | — |
| 100–900 | Gold ring **sweeps** current%→100% with a soft glow bloom | **Skia** `chart` | — |
| ~900 | Checkmark **pops** in the ring center | Reanimated `bouncy` | **success** notification + **bespoke Core Haptics pattern** |
| 1000–1600 | Balance **rolls** $4,210 → $0 | Reanimated `counter` | — |
| ~1500 | Freed-payment card enters; the **$600 token visibly travels** from the ring to the next-debt line (the *cascade* — spatial) | Reanimated shared-transition / Skia | `impactLight` on arrival |
| ~1700 | "Interest saved $740" fades in | Reanimated fade | — |
| ~1900 | "Keep going →" CTA enters last | Reanimated `default` | — |

**Never confetti.** The reward is the composition + the cascade (money doing spatial work), anchored to the user's real win, never an upsell. **Reduce-Motion:** the whole sequence collapses to a crossfade into the final composed state; the success haptic + bespoke pattern are **retained**.

## 6. Haptics map (`expo-haptics` + one bespoke pattern)

| Event | Haptic |
|---|---|
| Button commit / mark-paid / toggle | `impactLight` |
| Payday captured | `impactLight` |
| Band milestone crossed | `impactMedium` |
| Debt paid off | `notificationSuccess` + **bespoke Core Haptics pattern** (a rising two-tap "resolve") |
| Destructive confirm | `notificationWarning` |
| Error / validation | `notificationError` |

Reserved for **commit / success / snap** only — never on scroll, never on passive state. The bespoke payoff pattern is the single custom haptic (a small native module, batched with the other native additions).

## 7. Number & ring mechanics

- **Count-ups:** a `useCountUp(value, token)` hook (Reanimated shared value → `runOnJS` formatted string) on the payday number, debt-free date, balances, interest-saved. Pairs with the existing `tabular-nums` type styles so widths don't jitter. Web falls back to the final value.
- **Calm rings** (Progress at rest): Reanimated-animated `svg` `stroke-dashoffset`.
- **Hero/celebration rings** (glow, gradient sweep, particle bloom): **Skia** canvas — the visual ceiling the WebView couldn't reach, and the seed of the future shared chart/visual library.

## 8. Reduced-motion & platform

- Gate every effect behind `useReducedMotion()`; provide the static/crossfade fallback listed per row. Retain haptics.
- iOS/Android parity via the shared primitives; platform-native haptics resolve through `expo-haptics`. The bespoke payoff pattern gets an Android `VibrationEffect` equivalent (Android's own treatment, per first-class-per-platform) at the v1.8 Android pass.

## 9. Rollout & risks

- **Build the ergonomic layer first:** a `<Motion>` component + `useSpring`/`useCountUp`/`useReduceMotion` hooks over Reanimated, bound to `motion.ts`. Screens animate against *that*, never raw Reanimated — keeps the vocabulary consistent and swappable.
- **Native modules (Reanimated + worklets + Skia + haptics) batch into ONE native build** at the native-glue step, verified on device/TestFlight (the JS-only web preview can't confirm native motion — Freedom's lesson).
- **Risks:** (1) the tab-navigator black-screen trap → §2.5 guard, hard rule; (2) Reanimated's ~25–30% memory bump on RN 0.85 import → worklets bundle mode; (3) Skia adds native surface → keep its use scoped to heroes/beats/charts, not daily lists.

## 10. Future expansion (the reason the stack is chosen, not just this version)

- **Skia = the portfolio's next shared layer.** Once proven here on the payoff spectacle + rings, it unlocks: custom payoff-curve / interest-saved / momentum charts, generative branded visuals, particle/celebration systems, and eventually a **mascot/character** — reusable across Debt, Freedom, and Gig (shared like `packages/core` is for logic).
- **Rive** is teed up (not adopted) for the moment a designer/`.riv` pipeline exists — a future interactive-onboarding or mascot initiative, where state-machine-driven authored animation beats hand-coded.
- The in-house `<Motion>` layer means every future feature inherits the vocabulary for free — the app gets *more* motion-capable over time without re-litigating the foundation.
