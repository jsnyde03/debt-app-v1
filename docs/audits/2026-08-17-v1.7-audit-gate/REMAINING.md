# The 62 findings [D37] did not cover — owned by **P6.4**

> ⚠️ **GENERATED — do not hand-edit.** `tsx scripts/check-audit-closure.ts --remaining`
>
> This file exists because the T9–T11 lists were partial enumerations. It is the COMPLETE set,
> derived from the findings files themselves, so the sweep cannot be driven off a list that has
> quietly lost rows. "In a ledger" means the id is written down SOMEWHERE — it is **not** a claim
> that the finding is closed, or still real. Both need the code.

✅ **[D42], 2026-08-20 — the commitment is a BAR, not a COUNT.** All of them get **judged** at **P6.4**;
what gets **fixed** is every defect and every finding on a surface that ships. **P6.4 is where FEATURE
LOCK closes**, which is why this list defines that line ([D39]). ⚠️ T12 — the ~40 polish items — belongs
to **P6.8**, the sweep on the frozen app, and is a different set.

⚡ **Measured, and it should shape the judging:** of the 61 cross-file copy duplicates the strings
instrument finds, **24 are generic chrome** (`Save`, `Cancel`, `Done`, `Add`, `Name`, `Back`) that
repeat BY DESIGN, and **5 more involve `LiveActivityQA.tsx`, which the `QA_TOOLS` flip deletes** — so
they close themselves. **Do not treat this as a list of edits.** Judge each; several are already dead,
and more die with **P6.11.1** (the legacy-tree deletion, formerly numbered 5.5.1).

⭐ **Verified 2026-08-20 (P6.2):** the findings files hold **117** `### Lx-n` headings and **117**
`Severity:` lines, so the parser drops nothing — 55 high+ (gated by [D37]) + this set = 117. And every
low-tier id the retired T9–T11 enumerations named is present below, so nothing is lost by retiring them.

## L0-scripted — 1

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L0-4 | minor | yes | Two dead components confirmed at ZERO references |

## L1-voice — 16

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L1-20 | minor | yes | ALL-CAPS baked into strings rather than applied by style |
| L1-21 | minor | yes | Title Case is applied inconsistently, including to the same screen from two places |
| L1-22 | minor | yes | Straight and curly apostrophes are mixed |
| L1-23 | minor | yes | Three phrasings of the same "this balance is an estimate" caption |
| L1-24 | minor | yes | "Never" and "Unable to estimate" describe the same unpayable case |
| L1-25 | minor | yes | Three labels for one notification action, and web/native copy diverges |
| L1-26 | minor | yes | The discretionary remainder has five names |
| L1-27 | minor | yes | Hype and punctuation outliers |
| L1-28 | minor | yes | "Go to Plan" names a tab that does not exist |
| L1-29 | minor | yes | A "coming soon" settings row ships in v1.7 |
| L1-30 | minor | yes | Allocation labels are grammatically inconsistent with each other |
| L1-31 | minor | yes | Two verbs for destroying data, and two wordings for one confirm |
| L1-32 | polish | yes | "See My Plan  →" has a double space, and the arrow suffix is applied unevenly |
| L1-33 | polish | yes | Developer-register phrasing in a user setting |
| L1-34 | polish | yes | The Guardian is named four ways |
| L1-35 | polish | yes | Stilted, uncontracted phrasing in a screen-reader-only string |

## L2-drift — 15

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L2-8 | minor | yes | "your emergency fund" is a pot identity, written twice |
| L2-10 | minor | yes | The demo's exit CTA is retyped on both exits |
| L2-11 | minor | yes | The premium entitlement is named in three files |
| L2-12 | minor | yes | One action, two names: "Log a payment" vs "Log payment" |
| L2-13 | minor | yes | Debt-entry field copy and its example numbers are duplicated between onboarding and the sheet |
| L2-14 | polish | yes | "Autopay" appears on six surfaces |
| L2-15 | polish | yes | "Payoff schedule" — a named feature written in three files |
| L2-16 | minor | yes | The paycheck taxonomy ("Required", "Spoken for") is retyped away from the hero |
| L2-17 | minor | yes | "Overdue" is both a bucket title and a pill |
| L2-18 | minor | yes | The payoff-celebration vocabulary is mirrored by hand |
| L2-19 | polish | yes | Settings rows and the sheets they open are labelled twice |
| L2-20 | minor | yes | "Privacy Policy" link label written twice |
| L2-21 | polish | yes | "See it in action" — the demo entry point, twice |
| L2-22 | polish | yes | "BNPL" fallback label vs the domain term |
| L2-23 | minor | yes | "to your goals" — the debt-free destination phrase, in the selector and the brief |

## L3-proxy-capped — 3

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L3-5 | minor | yes | `buildSmartInsights` "Hold back $X to restore a safer $200 cushion" — the classic capped promise, unfixed |
| L3-6 | minor | yes | "Reserved each paycheck" over a total the paycheck may not contain |
| L3-7 | minor | yes | "Autopay · ran" is a presumption stated as an event, on the reconcile screen |

## L4-numbers-visual — 11

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L4-5 | minor | yes | The one-time bill total is whole on Money and to the cent in the sheet |
| L4-7 | minor | yes | One card, one toggle: Cushion shows whole dollars, Timeline shows cents |
| L4-8 | minor | yes | `tabular-nums` is defeated by `minimumFractionDigits: 0` |
| L4-9 | minor | yes | "Reserved each paycheck" is whole on Bills and to the cent on Living Expenses |
| L4-10 | polish | yes | History's anchor rounds a difference the rows state to the cent |
| L4-11 | polish | yes | `formatDisplayAmount` is dead — a third of the audited formatter surface is unreachable |
| L4-12 | minor | yes | `AddRow` replaced the chunky end-of-list button — on Money only |
| L4-13 | minor | yes | Two press-feedback vocabularies and six pressed-opacity constants, none of them tokens |
| L4-14 | polish | yes | `TwoColumn`'s docstring names Progress; Progress does not use it |
| L4-15 | minor | yes | `livingTotal` is derived twice from the same rule |
| L4-16 | polish | yes | `CheckCircle`, `MasterDetail`, `PressableScale` as single-use — three verdicts |

## L5-states-firstrun — 9

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L5-13 | minor | yes | Money → Debts with every debt paid off reads as a broken plan, not a finished one |
| L5-14 | minor | yes | A cleared semimonthly/monthly payday field silently produces a biweekly date |
| L5-15 | minor | yes | All money is hard-coded to en-US/USD, but the paywall shows the store's real currency |
| L5-16 | minor | yes | `ListRow`'s amount column doesn't shrink, so a long name plus a large amount collapses the name |
| L5-17 | polish | yes | Today's greeting — the app's one personalized touch — is clipped to one line by the shared header |
| L5-18 | polish | yes | The "not found" screen names a tab that doesn't exist |
| L5-19 | polish | yes | There is no free trial and no trial framing anywhere on the paywall |
| L5-20 | polish | yes | The paywall price column can wrap on a long localized price |
| L5-21 | polish | yes | There is no loading state on native, and that is correct — recorded so it isn't re-opened |

## L6-unclassified — 7

| id | severity | in a ledger? | finding |
|---|---|---|---|
| L6-4 | minor | yes | `projectForecast` is dead code and contributes 8 copy strings to the gate's input |
| L6-5 | minor | yes | The forecast copy is in a different voice from the rest of the app |
| L6-6 | minor | yes | `"Unable to estimate"` is written in five non-test files with no single authority |
| L6-7 | polish | yes | The RevenueCat iOS key is a source literal |
| L6-8 | polish | yes | "Funded" is printed twice on the same goal row |
| L6-9 | polish | yes | An informational message is delivered through the `error` prop |
| L6-10 | minor | yes | Four origin labels contain raw source text and cannot be used as list keys |
