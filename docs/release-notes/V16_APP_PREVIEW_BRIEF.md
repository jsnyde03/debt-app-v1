# App Store App Preview (Video) Brief — Paycheck Debt Planner v1.6

_Authored 2026-07-06 for the v1.6 "Differentiation Strike" launch. An **app preview** is a 15–30s video that **autoplays muted in App Store search results** and on the product page — it wins attention in the exact spot static screenshots can't. v1.6 is the ideal moment because the two features that differentiate it are **motion**: Payday Autopilot's one-tap capture and the milestone confetti. This brief is the storyboard + the exact capture → edit → upload how-to (per the executable-how-to rule). Jason produces + uploads; specs verified against Apple's ASC Help (2026). Complements [screenshot-brief.md](screenshot-brief.md) and [V16_ASO_STRATEGY.md](V16_ASO_STRATEGY.md)._

> **The one-sentence concept:** _"It's payday → one tap → progress you can feel + proof it's working."_ The whole v1.6 wedge in ~24 seconds — the loop no calculator or budgeter can film.

---

## 0. Specs (exact — Apple ASC, 2026)

| Spec | Value |
|---|---|
| **Length** | **15–30 s** (target **~24 s**) |
| **Previews per localization** | up to **3** (we make **1** to start; more per-CPP later) |
| **Resolution — 6.7"/6.9" iPhone (portrait)** | **886 × 1920 px** _(NOT the 1290×2796 screenshot size — app previews are their own smaller size)_ |
| **Video codec** | **H.264**, progressive, ≤ High Profile Level 4.0, **max 30 fps**, target 10–12 Mbps (.mov/.m4v/.mp4). _(ProRes 422 HQ .mov also accepted, ~220 Mbps.)_ |
| **Audio** | Stereo, 256 kbps AAC, 44.1/48 kHz, **all tracks enabled** (required even if it's just background music) |
| **Max file size** | 500 MB |
| **Poster frame** | the still shown before play — **defaults to 5 s in**; we'll set it deliberately (§5) |
| **Content rule** | must be **primarily actual on-device app footage** (screen capture). Text/caption overlays and light music are fine; a fully-animated marketing spot is **rejected**. |

**Theme:** capture in **DARK mode** (the premium look, consistent with the screenshot set — Jason's standing preference).

---

## 1. Setup before capturing

- **Best fidelity: record a REAL device via QuickTime** (Mac) — the payday-sheet slide-up and the confetti render truest on-device. Simulator recording also works if no device is handy.
- Seed with the in-app **"Try with Sample Data"** (same persona as the screenshots), **dark theme**, a **Premium** sandbox state (so the Interest-Saved figure + polished surfaces show). The sample data yields a meaty Interest-Saved number (~$2,000+ / several years) — good for Shot 4.
- **To make the payday sheet appear on cue:** in Plan Settings set the paycheck's **Next Paycheck Date to today**, Calculate, then relaunch — the Payday Autopilot sheet auto-opens. (Same trigger as the reviewer note.)
- **To make a milestone fire on cue:** trim the sample debts so one debt is nearly paid off, then "Start Next Pay Cycle" clears it → the paid-off confetti celebration triggers live. Rehearse once before recording.

---

## 2. Storyboard — the ~24s cut (shot-by-shot)

Record each beat as a clean take, then assemble in order. **The first ~3 seconds matter most** (that's what plays in a search result before a tap), so the payday sheet + "one tap" promise lead. Times are targets.

| # | Time | On screen (screen capture) | Caption overlay | Note |
|---|---|---|---|---|
| **1** | 0–4 s | Plan tab visible, then the **Payday Autopilot sheet slides up** — "It's payday," 2–3 plan rows with amounts, the big **"I followed the plan"** button. | **"Payday? Confirm your plan in one tap."** | The hook. Hold the sheet fully open ~1s so it reads in autoplay. |
| **2** | 4–8 s | A finger **taps "I followed the plan"** → rows check off → sheet closes → actions land under "Completed This Cycle." | **"One tap. Logged. No bookkeeping."** | The uncopyable moment — let the tap + capture animation breathe. |
| **3** | 8–14 s | Tap **"Start Next Pay Cycle"** → rollover → a debt clears → **full-screen milestone confetti** (🏆 / debt-free). | **"Feel every milestone."** | The emotional scroll-stopper. Let the confetti play ~2s. |
| **4** | 14–20 s | Cut to the **Payoff tab → Interest-Saved card**, big number in view: "**$2,128** in interest · **6 years** sooner." | **"See what your extra payments save."** | The proof. Push in slightly / hold the number. |
| **5** | 20–24 s | Brief pan of the plan / the debt-free date, settle on the app icon or a clean end frame. | **"Your payday, on autopilot. 100% private. Free to start."** | End card. Keep it an app frame + text (not a full graphic) to stay compliant. |

**Pacing:** keep cuts tight (no dead air); the whole thing should feel like one continuous "did it → done → progress → proof."

---

## 3. Captions & music

- **Captions:** large, high-contrast, safe-area-inset (keep text clear of the very top/bottom and the device notch). Same voice as the screenshot headlines. Muted-autoplay means **the captions carry the story** — don't rely on audio.
- **Music:** upbeat but restrained, royalty-free/licensed (e.g., Apple's built-in iMovie/Final Cut tracks, or Artlist/Epidemic). Audio track must be present + enabled (spec), even if quiet. No copyrighted music.
- **No voiceover needed** (search autoplays muted).

---

## 4. Capture → edit → export → upload (step-by-step)

**A. Record (per beat):**
1. Real device: connect to Mac → **QuickTime Player → File → New Movie Recording → (camera dropdown) select your iPhone** → record each beat. _(Simulator alternative: **Simulator → File → Record Screen**, or `xcrun simctl io booted recordVideo preview.mov`.)_
2. Get clean takes of beats 1–5 above; a couple of extra seconds head/tail each for trimming.

**B. Edit (iMovie / Final Cut / CapCut / Screen Studio):**
3. Assemble beats 1→5 to ~24 s; tighten cuts.
4. Add the caption overlays (§2) and a music bed (§3).
5. Confirm the **first frame is strong** and the moment at **~5 s** is a clean poster candidate (§5).

**C. Export:**
6. Export **H.264, portrait 886 × 1920, 30 fps, ~10–12 Mbps, .mov/.mp4**, audio 256 kbps AAC stereo, ≤ 500 MB, 15–30 s. _(If your editor can't hit 886×1920 exactly, export at the device's native portrait res then scale to 886×1920 — ASC needs the exact accepted resolution for the 6.7"/6.9" slot.)_

**D. Upload in App Store Connect:**
7. **ASC → Apps → Paycheck Debt Planner → App Store → the v1.6 version → App Previews and Screenshots → 6.7"/6.9" Display.**
8. Drag the video into the **App Preview** slot (it sits to the left of the screenshots; the preview always shows first). Wait for processing.
9. **Set the poster frame:** click the preview → scrub to the frame you want shown before play (§5) → set it. _(Default is 5 s in.)_
10. Save. The preview is reviewed with the version (or, on the live version, submit the media change).

---

## 5. Poster frame

Pick the frame that reads best as a **still in search** (before autoplay): the **Payday Autopilot sheet fully open with "I followed the plan" visible** (beat 1, ~2–3 s in) — it states the value even frozen. Avoid a mid-transition blur or the confetti frame (reads as noise when static).

---

## 6. Reuse & next

- **Per-CPP previews:** each Custom Product Page can carry its **own** app preview (up to 3). Once this master cut exists, a re-ordered/re-captioned variant can lead each CPP (e.g., a **debt-payoff** cut leading with the milestone→interest beats). See [V16_ASO_STRATEGY.md §5A](V16_ASO_STRATEGY.md).
- **Non-blocking:** the preview can be added to the live listing anytime — it does NOT gate the v1.6 submit. Recommended timing: with the v1.6 launch or a fast-follow, alongside the 2 new screenshots.
- **Localization:** US-only today, so one English preview. Add locale variants if/when territories expand.

**Sources:** [App preview specifications — ASC Help](https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications/) · [App Previews — Apple Developer](https://developer.apple.com/app-store/app-previews/) · [Upload app previews and screenshots — ASC Help](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/)
