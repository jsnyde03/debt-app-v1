# V2 — SIZE CLASS

> Lens V2 of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Reads `apps/rn/capture-ref/p6.8/<viewport>/<theme>/*.png` across
> phone (402) · phone-small (320) · ipad-portrait (834) · ipad-landscape (1194) · split-view (507).
>
> ⚠️ Per `matrix/README.md` hole 3: **a wide viewport on web is NOT an iPad.** The tab bar becomes a
> left rail on native and the overlay origin is `0` on web at every width. Nothing below claims a
> rail / native-navigation finding from these frames; those are routed to **P6.14**.
>
> Findings only. Nothing fixed.

## Findings

_(appended as found)_

### V2-1
**Severity:** major
**Surface:** Progress — payoff hero (`ringMeta`) · **Frames:** `apps/rn/capture-ref/p6.8/phone-small/light/progress.png` vs `apps/rn/capture-ref/p6.8/phone/light/progress.png` (dark pair identical)
**Finding:** At 320pt the debt-free DATE — the single headline number of the whole app — truncates to `Octob…`.
**Evidence:** The 320 frame renders `DEBT-FREE` / **"Octob…"**; the 402 frame renders **"October 2026"** in full. Source: `apps/rn/src/app/(tabs)/progress.tsx:177` sets `numberOfLines={1}` on `styles.heroDate` (`fontSize: 26, fontWeight: '800'`), inside `ringMeta: { flex: 1 }` which shares `ringRow` with a fixed `ringWrap: { width: 112 }` and `gap: spacing.lg` (20). Arithmetic matches the frames exactly: 320 − 40 (`screenPaddingH`×2) − 44 (`hero` padding `cardPaddingH+2`×2) − 132 (ring+gap) = **104pt** of text box for a ~165pt string; at 402 the same chain leaves **186pt**, which just fits. That is why the defect appears at 320 and only at 320.
**Confidence:** high — the truncation is legible in the frame and the box arithmetic reproduces the exact threshold.

### V2-2
**Severity:** minor
**Surface:** Progress — debt-free resting state (the `paidOff.length > 0` hero) · **Frames:** not captured; source-derived from the same box measured in V2-1
**Finding:** The same 104pt hero box is asked to hold the string **"Every balance paid off"** in the debt-free state, so the app's celebration line will truncate harder at 320 than the date does.
**Evidence:** `apps/rn/src/app/(tabs)/progress.tsx:102` — `<Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.heroDate…]}>Every balance paid off</Text>`. Same `heroDate` style (26/800), same `ringMeta` column, and the string is ~3× the width of `October 2026`. ⚠️ Unlike V2-1 this branch has **no frame in the matrix** — no seed reaches "all debts cleared" — so it is unaudited by every visual lens at once.
**Confidence:** medium — the style and the string are certain; what is not certain is whether this branch renders inside `ringRow` at all (it does **not** — it is a plain column with no ring, so the box is the full 236pt, not 104pt). Re-measured: at 236pt a 26/800 "Every balance paid off" still overflows one line. Settle it by capturing the paid-off seed at 320.

### V2-3
**Severity:** minor
**Surface:** Today — PlanHero suggestion line · **Frames:** `phone-small/light/today.png` vs `phone/light/today.png`
**Finding:** The suggestion strip truncates at 320 (`Suggested · $1,350 · Extra payment to C…`) where it fits whole at 402.
**Evidence:** 320 frame shows the ellipsis mid-word on the debt name; 402 shows `…Extra payment to Card`. Source: `apps/rn/src/components/plan/PlanHero.tsx:170` — `numberOfLines={1}` on `suggestText`. This one is a defensible clamp (it is a secondary caption, and the same information is stated in full by the Guardian card below), so it is filed as minor rather than as the same class as V2-1.
**Confidence:** high
