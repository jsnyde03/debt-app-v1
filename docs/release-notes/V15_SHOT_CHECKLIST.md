# v1.5 Screenshot Capture — One-Session Checklist

_Shoot the whole App Store set in **one simulator session** so every frame is consistent. Pairs with [screenshot-brief.md](screenshot-brief.md) (compositions + headlines) and [V15_ASO_STRATEGY.md](V15_ASO_STRATEGY.md) (why). Reference frames captured for each shot live in [`v15-reference-shots/`](v15-reference-shots/) — those show the **content/composition** (grabbed from the web build, so no device status bar); you shoot the real device version._

---

## One-time setup (do this first, once)

1. **Simulator:** iPhone 16 Pro Max (or 15 Pro Max) — the **6.7"** class, **1290 × 2796**. Build + run: `npm run build && npx cap sync && npx cap open ios`, then run to the simulator.
2. **Normalize the status bar** (this is what makes a set look pro — kills the mismatched time/battery/location-arrow that the current live 1.4 set has):
   ```
   xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 --dataNetwork wifi
   ```
3. **Dark mode:** the seed sets it, but confirm Settings → Appearance → **Dark**.
4. **Premium:** the premium shots (Smart Insights, Forecast, Strategy Comparison, Amortization, Pay Cycle History) need Premium unlocked — use a **Premium sandbox purchase**, or a dev build with the mock-subscription seam.
5. **Load the data:** Settings → **Import Backup** → [`screenshot-seed-backup.json`](screenshot-seed-backup.json). Clean, realistic, snowball-ordered (Store Card → Klarna → Capital One → Auto Loan), with debts showing progress.
6. Shoot with the simulator's screenshot (⌘S) or `xcrun simctl io booted screenshot shot.png`. Frame later in AppScreens/Previewed with the headline overlays from `screenshot-brief.md`.

---

## Capture order (App Store: max 10 slots)

Shoot **A → H first (fresh import)**, then do the rollovers for **I–K** (they mutate state, so they go last).

| # | Shot | How to get there | OCR caption (headline) | Ref |
|---|---|---|---|---|
| **A** | **Plan hero** | Plan tab, top | **Payday? Here's exactly what to pay.** | `01-plan-hero.png` |
| **B** | **Timeline** | Plan tab → tap the **Timeline** header to expand → scroll so the "This cycle · N transactions" header is at top | See your full paycheck, step by step | `02-timeline.png` |
| **C** | **Payoff / Strategy** | **Payoff** tab (focus debt + Snowball/Avalanche + debt-free date + trajectory) | Pick your strategy. See the difference. | `03-payoff.png` |
| **D** | **Amortization** ⭐(Premium) | Payoff tab → **View Schedule** | Watch your balance fall to $0, month by month. | `04-amortization.png` |
| **E** | **Goals** | **Goals** tab | Build savings while you kill debt. | `05-goals.png` |
| **F** | **Smart Insights** (Premium) | Payoff tab → scroll to the purple Smart Insights section | Smart guidance, every pay cycle. | _(use the live 1.4 shot as a comp)_ |
| **G** | **Forecast** (Premium) | the Forecast section | See pressure coming before it hits. | _(comp)_ |
| **H** | **App Lock / Privacy** | Enable App Lock (Settings) → relaunch to the lock screen, **or** shoot the App Lock card | **100% private — no bank login, no account.** | _(new — not in ref set)_ |
| **I** | **Streak** ⭐ | _(after rollovers — see below)_ Plan tab top shows **🔥 N cycles on plan in a row** + "↓ $X paid down since last cycle" | Keep your on-plan streak alive. | `01-plan-hero.png` (shows it) |
| **J** | **Milestone Celebration** ⭐ | _(during a rollover that clears a debt)_ the full-screen 🏆 overlay | **Debt-free journey — every milestone celebrated.** | `07-celebration.png` |
| **K** | **Pay Cycle History** (Premium) | _(after rollovers)_ Settings → **Pay Cycle History** | Look back at every cycle you conquered. | `06-history.png` |

**Recommended final order in App Store** (per `screenshot-brief.md`): A → **J (celebration)** → F → **I (streak)** → B → C/D → H → K. Lead with the hero + the celebration (Apple shows the first 2-3 in search).

---

## Overlay copy — title + subtitle per shot (paste straight into AppScreens)

_Titles carry the OCR-indexed keywords (payday, debt-free, private, streak). Keep the title 1-2 lines, the subtitle 1-2 lines._

**A · Plan hero**
- **Title:** Payday? Here's exactly what to pay.
- **Subtitle:** Which bills, which debt, how much cushion — the moment you get paid.

**B · Timeline**
- **Title:** See your whole paycheck, step by step.
- **Subtitle:** Every payment mapped out, with your safe-cash balance at each step.

**C · Payoff / Strategy**
- **Title:** Pick your strategy. See the difference.
- **Subtitle:** Snowball vs. avalanche — your real payoff date and interest, side by side.

**D · Amortization** _(Premium)_
- **Title:** Watch your balance fall to $0.
- **Subtitle:** A month-by-month payoff schedule for your focus debt.

**E · Goals**
- **Title:** Build savings while you kill debt.
- **Subtitle:** Emergency funds and goals, funded alongside every payoff plan.

**F · Smart Insights** _(Premium)_
- **Title:** Smart guidance, every pay cycle.
- **Subtitle:** Adaptive insights based on your real cash pressure and momentum.

**G · Forecast** _(Premium)_
- **Title:** See pressure coming before it hits.
- **Subtitle:** A 3-month outlook on your cushion, debt, and risk.

**H · App Lock / Privacy**
- **Title:** 100% private — no bank login.
- **Subtitle:** Face ID or your passcode. Your numbers never leave your device.

**I · Streak**
- **Title:** Keep your on-plan streak alive.
- **Subtitle:** Every cycle on plan grows your streak — and shrinks your debt.

**J · Milestone Celebration** ⭐
- **Title:** Debt-free journey, milestone by milestone.
- **Subtitle:** Cross 25/50/75% or clear a debt — and actually feel the win.

**K · Pay Cycle History** _(Premium)_
- **Title:** Look back at every cycle you conquered.
- **Subtitle:** Your full history of finished pay cycles — see how far you've come.

---

## Getting the streak / history / celebration (I, J, K)

The backup restores your **plan** but not pay-cycle history (that's built by living the app), so after the A–H shots:

1. On the Plan tab, **mark the Required Actions complete** — every bill and debt minimum. In v1.5 the streak tracks whether you completed the **required** actions you could afford (not the recommended extras), so this is what makes the cycle count as "on plan." Marking the recommended snowball/emergency actions too is fine and looks good in the shot, but it's the required ones that keep the streak alive. Then Settings → **Start Next Pay Cycle**.
2. Repeat **3–4 times**. Each rollover appends a history snapshot and grows the streak.
   - When a rollover **clears a debt** (Store Card is small and will pay off quickly), the **🏆 Milestone Celebration overlay fires — capture it (J) right then.**
3. After the rollovers: the Plan hero now shows **🔥 N cycles on plan in a row** + the since-last-cycle delta → capture **I**. Then Settings → **Pay Cycle History** → capture **K**.

_(The reference frames for I/J/K used a seeded shortcut to pre-fill history; on device, the rollovers above reproduce them.)_

_**Note on payoff/amortization numbers (C, D):** the v1.5 accuracy fixes — interest accrued per pay cycle (not a full month per rollover) and a true snowball that rolls a paid-off debt's freed minimum onto the next — make the live debt-free date sooner and total interest lower than the older reference PNGs show. That's expected; capture the **live** numbers (they're the correct, more impressive ones)._

---

## Notes

- **Richer Amortization frame:** the seed's focus debt (Store Card, $180) pays off in ~1 month, so its schedule is a single row. For a more impressive multi-month table, temporarily bump the smallest debt's balance to ~$1,500+ before shooting **D** only.
- **Consistency is the #1 fix** vs. the live 1.4 set: same device, same 9:41 status bar, same session, same dataset — no mixed notch/Dynamic-Island frames.
- Shoot **8–10** total; if you're at the cap, drop F or G (Premium comps) before dropping a v1.5 journey shot.
