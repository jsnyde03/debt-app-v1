# L1 — voice & tone

Covered every file group in `slices/L1-every-string.md` — 118 file sections, ~1,050 user-facing
strings (route paths, SF Symbol names, storage keys, style tokens and regexes excluded as
non-copy). Nine source files were opened to confirm specific suspicions; everything else is
judged from the inventory. Findings are ranked most-severe first across the whole app.

---

### L1-1 · The tightest paycheck state opens with "You're covered"
- **Severity:** blocker
- **Where:** `packages/core/guardian/buildGuardianBrief.ts:282` — `` detail: `You're covered this paycheck — ${amt(discretionary)} after everything required, ${state === "at-risk" ? "under" : "a little under"} your ${amt(floor)} line, so I'm holding all of it as your cushion.` `` (title on the same object is "Very tight this paycheck")
- **What:** The card whose headline is "Very tight this paycheck" leads its body with a flat assertion of a completed result — the exact "you're covered" pattern the house rules name as a defect — and then immediately says the user is *under* their line.
- **Why it matters:** A user in the worst cash state the app models reads "You're covered" first; if they then miss a bill, the app told them they were fine, which is the single most trust-destroying thing a money app can do.
- **Confidence:** high (string read in source; the inventory only exposed its fragments)
- **Suggested fix:** "Your required bills and minimums are all funded this paycheck — but that leaves $X, under your $Y line, so I'm holding all of it as your cushion."

### L1-2 · The paywall sells "autopilot", the product promises the opposite
- **Severity:** blocker
- **Where:** `apps/rn/src/app/paywall.tsx:211` "Debt payoff on autopilot" and `:213` "The app does the manual parts — you just confirm." Contradicted by `apps/rn/src/store/tutorialPath.ts:155` "Your Guardian suggests — it never moves your money." and `apps/rn/src/components/plan/PaydayGuardianCard.tsx:316` "Your call".
- **What:** The purchase screen claims automation that the product explicitly and repeatedly disclaims everywhere else.
- **Why it matters:** A buyer expecting "autopilot" finds a suggestion engine that moves nothing — a refund and one-star driver, and it undercuts the one differentiator (being trustworthy about money) at the exact moment money changes hands.
- **Confidence:** high
- **Suggested fix:** "Every payday, worked out for you" / "The app does the arithmetic — the money moves stay yours."

### L1-3 · Premium is sold on an unconditional promise to hold the cushion
- **Severity:** blocker
- **Where:** `apps/rn/src/app/paywall.tsx:21` "The Payday Guardian — holds your cushion at your line every payday and reshapes the plan, so you don't decide it each cycle." and `apps/rn/src/components/plan/PaydayGuardianCard.tsx:172` "Premium keeps your cushion at your line automatically, all on your device — no deciding each paycheck."
- **What:** "holds ... every payday" and "keeps ... automatically" assert an outcome the app cannot always deliver — the same paywall (`:23`) sells "Recovery Plan — a guided catch-up when a cycle comes up short", i.e. the line demonstrably does not always hold.
- **Why it matters:** The two bullets on one screen contradict each other, and the stronger one is the promise the user pays for.
- **Confidence:** high (contradiction is internal to the paywall's own bullet list)
- **Suggested fix:** "The Payday Guardian — works out how much to keep back each payday to protect your cushion, and reshapes the plan around it."

### L1-4 · Onboarding promises core features are free; the marquee feature is gated
- **Severity:** blocker
- **Where:** `apps/rn/src/components/onboarding/CompletionStep.tsx:19` "Free to use — core features never require a subscription." Against `apps/rn/src/components/onboarding/WelcomeStep.tsx:13` "A guardian for every payday", `apps/rn/src/components/plan/DemoCaption.tsx:63` "Cushion planning and Recovery require Premium.", and the `isPremium` gates on `PaydayGuardianCard.tsx:154-155,191-192,309,325`.
- **What:** The feature onboarding leads with as reason #1 to install is Premium-only, while the last onboarding screen states core features never require a subscription.
- **Why it matters:** The user is told, in one sitting, that the thing they installed for is core and free — then hits a paywall for it; that is a bait complaint, not a copy nit.
- **Confidence:** high on the copy conflict; **hypothesis (unverified in full)** that no free-tier Guardian output survives the gates — I confirmed the gates exist but did not trace every branch.
- **Suggested fix:** "Free to use — your plan, your debt-free date, and your payday walkthrough never require a subscription."

---

### L1-5 · One protected-cash concept, six user-facing names — and one of them is a different bucket
- **Severity:** major
- **Where:** across the app — "cushion" (`apps/rn/src/components/plan/CushionFloorSheet.tsx:46` "Your cushion line"), "your line" (`apps/rn/src/components/plan/PaydayGuardianCard.tsx:289` "· Your line", `:431` "Adjust your line →"), "safety net" (`PaydayGuardianCard.tsx:272` "Safety net"), "cash buffer" (`packages/core/engine/allocatePaycheck.ts:506` "Keep cash buffer", `packages/core/timeline/buildTimelineItems.ts:111` "Cash Buffer", `packages/core/insights/buildSmartInsights.ts:62` "Buffer looks stable"), "breathing room" (`apps/rn/src/components/plan/CashRunwayChart.tsx:130` "BREATHING ROOM"), "floor" (`apps/rn/src/components/plan/GuardianScorecard.tsx:39` "Your floor's been protected", `apps/rn/src/components/payoff/TrajectoryChart.tsx:440` "Safe-floor").
- **What:** Five of these name the same engine bucket (`allocatePaycheck.ts:506` labels it "Keep cash buffer" under `category: "cushion_buffer"`), while "Safety net" is a genuinely separate bucket (`:579`, `category: "discovery_holdback"`) — so the app both uses many words for one concept and uses near-synonyms for two different things.
- **Why it matters:** The user cannot tell whether "your safety net", "your cushion" and "your buffer" are three pots or one, which makes every allocation screen unauditable — fatal in the one app category where the user must be able to check the arithmetic.
- **Confidence:** high (bucket categories read in source)
- **Suggested fix:** Pick "cushion" as the single name for `cushion_buffer` everywhere (retire "cash buffer", "buffer", "breathing room", "safe-floor"), keep "safety net" solely for `discovery_holdback`, and say once, in the cushion sheet, how the two differ.

### L1-6 · "Expenses" and "bills" are the same thing; "expenses" is also a different thing
- **Severity:** major
- **Where:** `apps/rn/src/app/(tabs)/money.tsx` — tab label `:118` "Expenses", search placeholder `:782` "Search expenses", empty result `:739` "No bills match ...", concept blurb key `bills` `:84`, reserve row `:678` "reserved for upcoming bills". Separately `apps/rn/src/app/living-expenses.tsx:34` "Living Expenses" for everyday spending, surfaced in `money.tsx:855` as "Everyday spending reserve" and in `apps/rn/src/app/more.tsx:278` as "Living Expenses".
- **What:** One concept has two words ("expense"/"bill") used within a single screen, and one word ("expenses") names two different concepts (recurring obligations vs. everyday spending).
- **Why it matters:** On the Expenses tab, searching returns "No bills match" — the user cannot tell whether bills are a subset of expenses, and "Living Expenses" in Settings reads as a link back to the tab they already saw.
- **Confidence:** high
- **Suggested fix:** Use "bills" for recurring obligations app-wide (rename the tab and sheets), and "everyday spending" for the living-expenses reserve — retire "Living Expenses" as a screen title.

### L1-7 · The tightest cash state has four different names
- **Severity:** major
- **Where:** `apps/rn/src/components/plan/CashRunwayChart.tsx:42` "Crunch"; `apps/rn/src/components/plan/PlanHero.tsx:106` "Short this paycheck"; `packages/core/guardian/buildGuardianBrief.ts:278` "Very tight this paycheck"; `apps/rn/src/store/sandboxScenarios.ts:77` "A short payday"; `apps/rn/src/components/more/LiveActivityQA.tsx:38` "At-risk · today".
- **What:** The same underlying `at-risk` state is presented as Crunch, Short, Very tight, and At-risk depending on the surface; the middle state likewise splits between "Tight" and "A little tight this paycheck".
- **Why it matters:** The chart legend and the Guardian card sit on the same screen and disagree, so the user cannot map the coloured band to the sentence explaining it.
- **Confidence:** high on the copy divergence; **hypothesis (unverified)** that all five strings render the identical `at-risk` state — I did not trace every call site.
- **Suggested fix:** One vocabulary everywhere — Clear / Tight / Very tight — and drop "Crunch", "Short" and the raw "at-risk" from anything a user reads.

### L1-8 · The Guardian speaks in third person to screen-reader users
- **Severity:** major
- **Where:** `apps/rn/src/app/(tabs)/index.tsx:533` visible card "A surprise bill came up — I've restored your safety net for now." vs `:838` the announcement for the same event "A surprise bill came up — your Guardian has restored your safety net for now." Same split at `apps/rn/src/components/plan/PaydayGuardianCard.tsx:165` label "All your regular bills entered? I'll hold a smaller safety net." vs `:400` hint "Tells your Guardian your bills are all entered, so it holds less back".
- **What:** The accessibility layer consistently demotes the Guardian from "I" to "it" / "your Guardian" for strings whose visible twin is first person.
- **Why it matters:** VoiceOver users meet a different, colder persona than sighted users — the persona is the product's differentiator, so this is a feature gap rather than a label nit.
- **Confidence:** high (both string pairs read in source)
- **Suggested fix:** Mirror the visible voice — "A surprise bill came up — I've restored your safety net for now." and "Tells me your bills are all entered, so I hold less back."

### L1-9 · The Guardian is third person throughout the tutorial and several cards
- **Severity:** major
- **Where:** `apps/rn/src/store/tutorialPath.ts:108` "your Guardian keeps a cushion back", `:139` "While your Guardian is learning your bills it holds a bit more back. Tell it your bills are all in", `:155` "Your Guardian suggests — it never moves your money.", `:161` "your Guardian is already watching it". Also `apps/rn/src/components/plan/CushionFloorSheet.tsx:47` "The cash the Guardian keeps each paycheck", `apps/rn/src/components/plan/CashRunwayChart.tsx:185` "Guardian's setting aside".
- **What:** The walkthrough that introduces the Guardian never lets it speak; it is narrated about in third person, while every live card it later shows is first person.
- **Why it matters:** The user is introduced to a described mechanism and then met by a talking one — the persona arrives unannounced, after the tour that was meant to establish it.
- **Confidence:** high
- **Suggested fix:** Rewrite `tutorialPath` bodies in the Guardian's own voice ("Every payday I keep a cushion back before anything extra goes to your debt"), keeping third person only for the menu label "How the Guardian works".

### L1-10 · A third persona: buttons and toggles that speak as the user
- **Severity:** major
- **Where:** `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:424` "Confirm what I paid" / "I followed the plan"; `apps/rn/src/app/more.tsx:257` "I have savings elsewhere"; `apps/rn/src/notifications/notifications.ts:31-33` "Run my plan" / "Review my plan" / "Check my plan"; `apps/rn/src/app/(tabs)/index.tsx:574` "I cancelled it"; `apps/rn/src/components/entities/LivingExpenseSheet.tsx:63` "Count toward my reserve"; `apps/rn/src/store/paycheckForm.ts:40` "My income varies"; `apps/rn/src/components/onboarding/CompletionStep.tsx:39` "See My Plan  →"; `apps/rn/src/components/plan/DemoDock.tsx:113` "Start my real plan".
- **What:** A user-voiced "I/my" register runs alongside the Guardian's "I", so the app's first person and the user's first person appear within a few taps of each other on the payday sheet.
- **Why it matters:** With one persona already owning "I", a button reading "I followed the plan" is momentarily ambiguous about who is asserting what — on the screen where that assertion changes balances.
- **Confidence:** high on the rule violation; the visual-adjacency claim is a **hypothesis** (not screen-verified).
- **Suggested fix:** Second person or neutral throughout — "Confirm what you paid", "You followed the plan", "Review your plan", "Savings elsewhere", "Income varies", "See your plan". (`apps/rn/src/components/plan/ShareCard.tsx:38` "I'm debt-free" is a legitimate exception: on a share graphic the user is the speaker.)

### L1-11 · Non-Guardian copy says "we"
- **Severity:** major
- **Where:** `apps/rn/src/components/entities/AddObligationSheet.tsx:69` "We'll put it in the right place."; `apps/rn/src/components/plan/PayoffInvitationCard.tsx:40` "Confirm it's paid off and we'll make it official."; `apps/rn/src/app/more.tsx:345` "And we'll never sell you more debt."; `apps/rn/src/components/onboarding/CompletionStep.tsx:63` "What should we call you? (optional)".
- **What:** Four strings introduce an unnamed corporate "we" into copy that is not the Guardian's.
- **Why it matters:** The strongest trust line in the app is the one that invokes a company the user has otherwise never met — and `apps/rn/src/app/paywall.tsx:230` states the same pledge without it ("you'll never be sold more debt"), so the two versions disagree.
- **Confidence:** high
- **Suggested fix:** "It'll go in the right place." / "Confirm it's paid off and it's official." / "You'll never be sold more debt." / "What should the app call you? (optional)".

### L1-12 · "Reserved", "covered", "held" asserted as completed facts
- **Severity:** major
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:84` "Reserved from every paycheck before anything goes to debt.", `:678` "reserved for upcoming bills", `:864` "Reserved each paycheck · tap to manage"; `packages/core/engine/allocatePaycheck.ts:526` "Reserved for upcoming bills"; `apps/rn/src/app/living-expenses.tsx:36` "Everyday spending reserved each paycheck, before debt and goals."; `apps/rn/src/components/plan/WindfallSheet.tsx:21` "Covers your bills & essentials first"; `packages/core/guardian/buildGuardianBrief.ts:297` title "Your line's held"; `apps/rn/src/widget/snapshot.ts:54` "Your cushion is safe."; `apps/rn/src/liveActivity/paydayActivityContent.ts:82` "Cushion safe".
- **What:** Money the plan only intends to set aside is described in the perfect tense, as though it had already been moved — and the app never moves money (`apps/rn/src/store/tutorialPath.ts:155`).
- **Why it matters:** "Reserved" reads as a completed transfer; a user who believes the app reserved their rent has been misinformed by a single word, which is precisely the failure this app exists to prevent.
- **Confidence:** high on the tense; **hypothesis (unverified)** that no bucket corresponds to a real transfer — consistent with `allocatePaycheck` being a pure calculation, but not traced further.
- **Suggested fix:** Intent tense app-wide — "Set aside from each paycheck before anything goes to debt", "to set aside for upcoming bills", "Your line holds", "Your cushion looks safe".

### L1-13 · Zero-data state claims a perfect protection record
- **Severity:** major
- **Where:** `apps/rn/src/components/plan/GuardianScorecard.tsx:36` "Protected since day one" and `:39` "Your floor's been protected from the start. I'm still learning your patterns — I'll show my track record once I've seen a few more paychecks."
- **What:** The branch shown when `!score.proven || score.matchRate === null` — no track record at all — asserts protection has held, under a heading reading "GUARDIAN ACCURACY", while the same component's proven state defines an error type as "Under-warned — said you'd hold, you dipped below" (`:69`).
- **Why it matters:** The app claims accuracy from an absence of measurements, and its own error taxonomy concedes the floor can be breached.
- **Confidence:** high on the contradiction. The code comment argues floor auto-protect is confidence-independent value, so **the underlying mechanism claim is unverified** — but the copy still asserts a record it does not have.
- **Suggested fix:** "No track record yet" / "I've been protecting your floor from day one, but I haven't seen enough paychecks to show you how well. Check back after a few."

### L1-14 · "Floor" names two unrelated things
- **Severity:** major
- **Where:** income sense — `apps/rn/src/components/plan/LeanSuggestionCard.tsx:32,35` "Income floor" / "INCOME FLOOR", `apps/rn/src/store/paycheckForm.ts:52` "Your plan runs on this floor". Cushion sense — `apps/rn/src/components/plan/GuardianScorecard.tsx:39` "Your floor's been protected", `apps/rn/src/components/payoff/TrajectoryChart.tsx:440` "Safe-floor".
- **What:** One word carries two concepts, and the cushion sense is yet another synonym for the concept already carrying five names (L1-5).
- **Why it matters:** "Your floor's been protected" is unreadable — the user cannot tell whether the app protected their income assumption or their cash cushion.
- **Confidence:** high
- **Suggested fix:** Keep "floor" for the lean-income figure only; say "your cushion line" wherever the cushion is meant.

### L1-15 · "SAFE TO DEFER" claims safety the footnote withdraws
- **Severity:** major
- **Where:** `apps/rn/src/components/plan/RecoveryPlanSection.tsx:72` "SAFE TO DEFER", against `:126` "This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or cancel it)."
- **What:** The section header calls deferral safe; the footnote concedes the user must arrange a late payment with the biller, carrying fees and credit consequences the app cannot see.
- **Why it matters:** A user in a short cycle — the most vulnerable state the app models — is told a late payment is safe by a heading they read before the footnote.
- **Confidence:** high
- **Suggested fix:** "CAN WAIT IN YOUR PLAN", with the biller caveat promoted from footnote to section subhead.

### L1-16 · The insights and forecast packages speak a different, clinical voice
- **Severity:** major
- **Where:** `packages/core/insights/buildSmartInsights.ts` — Title Case headings `:46` "Recovery Needed", `:55` "Tight Cycle Warning", `:75` "Safe Extra Payment", `:91` "Near Payoff Opportunity", `:108` "Interest Reduction Insight", `:115` "Payoff Timing Difference", `:124` "Stability First", `:133` "Progress Still Continues"; jargon `:64` "without needing a stabilization adjustment", `:110` "Prioritize the highest APR debt first to reduce long-term interest cost", `:135` "help stabilize long-term payoff momentum". Same register in `packages/core/forecast/projectForecast.ts:63` "Recovery is not currently projected within the visible forecast window.", `:81` "Available cushion stays under the recommended safety threshold", `:93` "Debt minimum obligations remain elevated", `:101` "Pause aggressive payoff and protect required payments first."
- **What:** Two core packages emit analyst-register copy — Title Case headings, passive voice, no second person, and terms ("stabilization adjustment", "cash pressure", "forecast window", "elevated obligations") that appear nowhere else in the app.
- **Why it matters:** These land in the same scroll as the Guardian's plain first-person sentences, so the app reads as two products stitched together; "Recovery Needed" as a Title Case alarm is closer to a collections notice than to a calm coach.
- **Confidence:** high on the register mismatch; **hypothesis (unverified)** that all of these render in v1.7 UI — the inventory lists them as user-facing, but I did not confirm each render path.
- **Suggested fix:** Rewrite both files in sentence case and second person — "You'll need a catch-up plan", "Next cycle looks tight", "Your cushion is below where I'd want it", "Hold off on extra payoff until your cushion recovers."

### L1-17 · "Always-current balances" is contradicted by the balance UI
- **Severity:** major
- **Where:** `apps/rn/src/app/paywall.tsx:24` "Always-current balances — projected forward or re-scanned in seconds, no monthly retyping." Against `apps/rn/src/app/(tabs)/money.tsx:453` "estimated · tap to verify", `apps/rn/src/store/balanceSelectors.ts:82` "estimated · verify soon", `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:354` "1 balance hasn't been checked in a while", and `packages/core/guardian/buildGuardianBrief.ts:137` "These figures are from a little while ago — a quick refresh keeps this exact."
- **What:** The paywall promises balances are always current; the app's own balance surfaces exist specifically to tell the user they are estimates that go stale.
- **Why it matters:** The user pays for currency and immediately gets asked to verify — the feature bullet oversells a projection as a fact.
- **Confidence:** high
- **Suggested fix:** "Balances that keep themselves roughly right — projected forward between statements, or re-scanned in seconds. No monthly retyping."

### L1-18 · Absolute "never" and "always" promises the app cannot keep
- **Severity:** major
- **Where:** `apps/rn/src/store/paycheckForm.ts:52` "Your plan runs on this floor, so a lighter paycheck never breaks it."; `apps/rn/src/components/money/BillBreakdownSheet.tsx:64` "Every bill spread evenly across your paychecks — so the lumpy ones never land as a surprise."; `apps/rn/src/components/onboarding/WelcomeStep.tsx:48` "Debt Planner watches your cushion every paycheck — so you always know what's safe to spend"; `:13` "your cushion, protected."
- **What:** Four onboarding/explainer strings state guarantees with no conditions — a paycheck lighter than the stated floor does break the plan, and the app itself models variable bills (`money.tsx:726` "· Variable", `apps/rn/src/components/entities/ExpenseSheet.tsx:97` "Variable amount (estimate)") that can still surprise.
- **Why it matters:** These are the first sentences a new user reads, so they set the expectation every later hedge has to walk back.
- **Confidence:** high
- **Suggested fix:** "Your plan runs on this floor, so a lighter-than-usual paycheck won't throw it off." / "so the lumpy ones are far less likely to land as a surprise" / "so you know what's safe to spend".

### L1-19 · A cleared debt has four names, one of them from a different genre
- **Severity:** major
- **Where:** "Vanquished" (`apps/rn/src/components/plan/VanquishedBeat.tsx:116`, `apps/rn/src/components/progress/VanquishedArchive.tsx:47` "DEBTS VANQUISHED ·", `apps/rn/src/components/plan/ShareCard.tsx:50`), "Paid off" (`VanquishedBeat.tsx:126`, `ShareCard.tsx:51`), "PAID OFF" (`apps/rn/src/app/(tabs)/money.tsx:335`), "Cleared" (`VanquishedArchive.tsx:60,65`, `apps/rn/src/app/(tabs)/progress.tsx:102` "Every balance cleared").
- **What:** One event carries four labels, and "Vanquished" is a fantasy/combat register that appears nowhere else in a deliberately calm money app.
- **Why it matters:** The archive header, the card, and the list badge describe the same fact with different words, so the user cannot tell whether "Cleared" and "Vanquished" are the same status.
- **Confidence:** high
- **Suggested fix:** "Paid off" everywhere, including the archive header ("DEBTS PAID OFF") and the share card.

---

### L1-20 · ALL-CAPS baked into strings rather than applied by style
- **Severity:** minor
- **Where:** ~20 eyebrow/section strings, e.g. `apps/rn/src/components/plan/PaydayGuardianCard.tsx:209` "PAYDAY GUARDIAN", `apps/rn/src/components/plan/AffordabilityCard.tsx:115` "CAN I AFFORD IT?", `apps/rn/src/components/plan/CashRunwayChart.tsx:130` "BREATHING ROOM", `apps/rn/src/components/plan/GuardianScorecard.tsx:33` "GUARDIAN ACCURACY", `apps/rn/src/components/plan/RecoveryPlanSection.tsx:63,72` "COVER NOW" / "SAFE TO DEFER", `apps/rn/src/components/plan/WindfallSheet.tsx:100` "HERE'S HOW THE APP WILL ROUTE".
- **What:** Most eyebrow styles already apply `textTransform: 'uppercase'` (confirmed at `TrajectoryChart.tsx:483`, `PlanHero.tsx:231`, `CashRunwayChart.tsx:224`, and 17 more), yet the strings are *also* written in caps; `GuardianScorecard.tsx:92` has no `textTransform` and relies solely on the literal caps.
- **Why it matters:** VoiceOver can spell out or alter intonation on literal all-caps text, so screen-reader users hear these differently from a styled equivalent — and the two mechanisms mean a future style change will only reach half the headers.
- **Confidence:** high (styles read in source)
- **Suggested fix:** Write every eyebrow in sentence case and let `textTransform` do the work; add the missing `textTransform` to `GuardianScorecard`.

### L1-21 · Title Case is applied inconsistently, including to the same screen from two places
- **Severity:** minor
- **Where:** `apps/rn/src/app/more.tsx:144` "Pay cycle history" navigates to `apps/rn/src/app/history.tsx:39` titled "Pay Cycle History"; `apps/rn/src/app/(tabs)/index.tsx:601` "Start Next Pay Cycle"; `apps/rn/src/app/living-expenses.tsx:34` "Living Expenses"; `apps/rn/src/components/plan/RequiredActionsCard.tsx:96` "Required Actions" vs `apps/rn/src/components/plan/RecommendedActionsCard.tsx:46` "Recommended"; `apps/rn/src/components/entities/DebtSheet.tsx:340` "Apply Estimate to Plan"; `apps/rn/src/app/more.tsx:364` "Delete Everything"; `apps/rn/src/components/onboarding/WelcomeStep.tsx:26` "Get Started".
- **What:** Sentence case is the app's dominant convention, but a set of titles and buttons is Title Case — and one screen is labelled both ways depending on where you arrive from.
- **Why it matters:** The nav label and the destination title disagree, which reads as a wrong link.
- **Confidence:** high
- **Suggested fix:** Sentence case throughout — "Pay cycle history", "Start next pay cycle", "Living expenses", "Required actions", "Apply estimate to plan", "Delete everything", "Get started".

### L1-22 · Straight and curly apostrophes are mixed
- **Severity:** minor
- **Where:** straight — `apps/rn/src/components/entities/AddObligationSheet.tsx:34` "Something with a balance you're paying down.", `:41` "An ongoing cost that doesn't end.", `:69` "We'll put it in the right place."; `apps/rn/src/components/entities/ExpenseSheet.tsx:85`; `apps/rn/src/components/more/BackupSheets.tsx:64` "That doesn't look like a valid backup."; `apps/rn/src/components/plan/GuardianScorecard.tsx:50-52`. Curly — `apps/rn/src/app/(tabs)/money.tsx:83-85`, `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:120-121`, most of `paywall.tsx`.
- **What:** The same contraction is typeset two ways across the app, sometimes for identical sentences ("An ongoing cost that doesn't end." appears straight in `AddObligationSheet` and `ExpenseSheet`, curly-adjacent elsewhere).
- **Why it matters:** Straight apostrophes look like unpolished developer output next to curly ones on the same scroll — visible in App Store screenshots.
- **Confidence:** high
- **Suggested fix:** Normalise to typographic apostrophes app-wide and add a lint rule for `'` inside JSX text and copy constants.

### L1-23 · Three phrasings of the same "this balance is an estimate" caption
- **Severity:** minor
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:453` "estimated · tap to verify"; `apps/rn/src/store/balanceSelectors.ts:82` "estimated · verify soon"; `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:302` "estimated ~" / "· verified"; `apps/rn/src/components/entities/DebtSheet.tsx:337` "Estimated".
- **What:** One state has four captions, two of which imply different urgency ("tap to verify" vs "verify soon").
- **Why it matters:** The user sees the same debt described differently on the list, the sheet, and the payday flow, and cannot tell whether "verify soon" is a stronger warning than "tap to verify".
- **Confidence:** high
- **Suggested fix:** One caption — "estimated · tap to verify" — used everywhere, with staleness carried by a separate explicit line.

### L1-24 · "Never" and "Unable to estimate" describe the same unpayable case
- **Severity:** minor
- **Where:** `apps/rn/src/components/payoff/TrajectoryChart.tsx:229` `minimumsDateLabel = 'Never'`; `packages/core/debt/projectDebtPayoff.ts:122,214` and `packages/core/debt/computeInterestSaved.ts:47-48` and `apps/rn/src/store/analysisSelectors.ts:110-111` "Unable to estimate"; `apps/rn/src/components/payoff/WhatIfControls.tsx:102` "Can't estimate a payoff date with the current plan."
- **What:** The chart baseline says a bleak, absolute "Never" where the rest of the app says "Unable to estimate" or "Can't estimate a payoff date".
- **Why it matters:** "Never" is the harshest word in the app and it appears without the explanation `AmortizationView.tsx:54` gives elsewhere; two labels for one condition also make the chart and the numbers look like they disagree.
- **Confidence:** medium — **hypothesis (unverified)** that the `'Never'` branch and the "Unable to estimate" branches cover the same underlying condition; `TrajectoryChart.tsx:224-229` gates on `interestSaved.kind === 'saving'`, which I did not trace back.
- **Suggested fix:** "Not with minimums" on the chart, and one shared string for the unpayable case elsewhere.

### L1-25 · Three labels for one notification action, and web/native copy diverges
- **Severity:** minor
- **Where:** `apps/rn/src/notifications/notifications.ts:31-33` "Run my plan" / "Review my plan" / "Check my plan"; `:68-69` "Before this paycheck lands" / "I'd give your plan a quick look before payday." vs `:113,120` "Your paycheck arrives tomorrow — open Debt Planner to run your plan." / "Open Debt Planner to confirm your plan for this paycheck."; `apps/rn/src/notifications/notifications.web.ts:10-11` "Time to check this paycheck" / "Take a quick look at your plan before this one lands."
- **What:** One action button has three labels, and only one of the four notification bodies is in the Guardian's voice — the others are impersonal instructions naming the app in third person.
- **Why it matters:** Notifications are often the only copy a lapsed user sees, so the persona is inconsistent at exactly the re-engagement moment.
- **Confidence:** high
- **Suggested fix:** One label ("Review your plan") and one voice: "Payday tomorrow — I'd give your plan a quick look before it lands."

### L1-26 · The discretionary remainder has five names
- **Severity:** minor
- **Where:** `packages/core/engine/allocatePaycheck.ts:709` "Leftover cash"; `apps/rn/src/components/plan/WindfallSheet.tsx:26` "Left as spare cash"; `apps/rn/src/components/plan/CashRunwayChart.tsx:202` "Left after essentials"; `apps/rn/src/components/plan/PlanHero.tsx:91` "Flexible"; `apps/rn/src/components/plan/AffordabilityCard.tsx:172` "spare this paycheck".
- **What:** The money left after obligations is named five ways across five surfaces.
- **Why it matters:** The affordability card's "spare" and the hero's "Flexible" are the same figure, and the user has to work that out.
- **Confidence:** medium — **hypothesis (unverified)** that all five refer to the same computed value.
- **Suggested fix:** "Spare" everywhere, with "Flexible" retired from the hero legend.

### L1-27 · Hype and punctuation outliers
- **Severity:** minor
- **Where:** `apps/rn/src/widget/snapshot.ts:76` "Debt-free!"; `apps/rn/src/app/paywall.tsx:160` "You're Premium 🎉"; `apps/rn/src/components/plan/PayoffInvitationCard.tsx:37` "Looks like you crushed"; `apps/rn/src/app/paywall.tsx:58` "Billed yearly · just $2.50/mo"; `apps/rn/src/components/plan/GraduationCards.tsx:49` "Ready to build wealth?"; `apps/rn/src/components/onboarding/WelcomeStep.tsx:15` "Spend without the guilt".
- **What:** The only exclamation mark, the only emoji, a slang verb, and a price-minimising "just" — all in copy that is otherwise consistently calm.
- **Why it matters:** "just $2.50/mo" is a sales tic on a purchase screen whose credibility is the reason the user is there; the emoji and exclamation read as a different app.
- **Confidence:** high
- **Suggested fix:** "Debt-free", "You're on Premium", "Looks like you paid off", "Billed yearly · $2.50/mo".

### L1-28 · "Go to Plan" names a tab that does not exist
- **Severity:** minor
- **Where:** `apps/rn/src/app/+not-found.tsx:16` "Go to Plan"; tabs are `Today`, `Progress`, `Money` (`apps/rn/src/app/(tabs)/_layout.tsx:82,87,92`).
- **What:** The not-found screen offers to send the user to a destination that has no name in the UI.
- **Why it matters:** The one screen a lost user reaches points at a place they cannot find afterwards.
- **Confidence:** high
- **Suggested fix:** "Go to Today".

### L1-29 · A "coming soon" settings row ships in v1.7
- **Severity:** minor
- **Where:** `apps/rn/src/app/more.tsx:183-185` "iCloud backup" / "Automatic cloud backup — coming soon." / badge "Soon".
- **What:** A non-functional row advertises unshipped functionality in a release billed as acquisition-ready.
- **Why it matters:** It reads as an unfinished build and, on a data-safety row, invites a user to defer their own backup while waiting for something that is not there.
- **Confidence:** high
- **Suggested fix:** Remove the row for v1.7; if it stays, say what to do now — "Not yet available. Use Export backup to keep a copy."

### L1-30 · Allocation labels are grammatically inconsistent with each other
- **Severity:** minor
- **Where:** `packages/core/engine/allocatePaycheck.ts:506` "Keep cash buffer" (imperative) among `:526` "Reserved for upcoming bills", `:572` "Held for an upcoming tight cycle", `:579` "Safety net", `:709` "Leftover cash" (all noun/participle phrases).
- **What:** One row in a list of allocation labels is phrased as a command to the user.
- **Why it matters:** In a breakdown the user reads as a ledger, an imperative row looks like an unactioned to-do rather than an amount already accounted for.
- **Confidence:** high
- **Suggested fix:** "Your cushion" (aligning with the L1-5 vocabulary).

### L1-31 · Two verbs for destroying data, and two wordings for one confirm
- **Severity:** minor
- **Where:** `apps/rn/src/components/ui/FormSheet.tsx:108,174` "Remove" vs `apps/rn/src/components/ui/ListRow.tsx:144,154` "Delete" and `apps/rn/src/utils/confirm.ts:16-18` "Delete?" / "Delete"; `apps/rn/src/app/more.tsx:190,364` "Delete all data" / "Delete Everything". Also `confirm.ts:25` "Discard your changes?" vs `:30` "Discard changes?" in the same file.
- **What:** The same destructive action is "Remove" in the sheet and "Delete" in the row menu, and the discard confirmation exists in two wordings a few lines apart.
- **Why it matters:** On destructive actions the user is reading the verb carefully; two verbs suggests two different outcomes (one recoverable, one not).
- **Confidence:** high
- **Suggested fix:** "Delete" everywhere for permanent removal, and a single "Discard changes?" string.

---

### L1-32 · "See My Plan  →" has a double space, and the arrow suffix is applied unevenly
- **Severity:** polish
- **Where:** `apps/rn/src/components/onboarding/CompletionStep.tsx:39` "See My Plan  →" (two spaces before the arrow). Arrow present on `apps/rn/src/components/plan/AffordabilityCard.tsx:185` "Save for it →", `apps/rn/src/components/plan/PaydayGuardianCard.tsx:431,471` "Adjust your line →" / "See your forecast →", `apps/rn/src/components/entities/DebtSheet.tsx:324` "Re-scan to update →", `apps/rn/src/components/plan/GraduationCards.tsx:55` "Explore Financial Freedom →"; absent on comparable navigational CTAs such as `apps/rn/src/components/plan/DemoDock.tsx:113` "Start my real plan".
- **What:** A stray double space in the highest-visibility onboarding button, plus no rule for when a CTA carries "→".
- **Why it matters:** The double space is visible on the last onboarding screen; the inconsistent arrow makes some navigations look weightier than others for no reason.
- **Confidence:** high
- **Suggested fix:** "See your plan →", and reserve "→" for CTAs that open a different screen.

### L1-33 · Developer-register phrasing in a user setting
- **Severity:** polish
- **Where:** `apps/rn/src/app/more.tsx:168` "Re-offer the one-line hints on hidden features." (alternate subtitle for the same row is "Tips will appear again as you go.")
- **What:** One of the two subtitles describes the app's internal behaviour in implementation language ("re-offer", "one-line hints", "hidden features").
- **Why it matters:** It tells the user their features are hidden, and reads as a changelog entry rather than a setting.
- **Confidence:** high
- **Suggested fix:** "Show the short tips again as you go."

### L1-34 · The Guardian is named four ways
- **Severity:** polish
- **Where:** `apps/rn/src/app/paywall.tsx:21` "The Payday Guardian"; `apps/rn/src/components/plan/PaydayGuardianCard.tsx:209` "PAYDAY GUARDIAN"; `apps/rn/src/app/more.tsx:153` "How the Guardian works"; `apps/rn/src/components/plan/TutorialInviteCard.tsx:35` "See how your Guardian works".
- **What:** "The Payday Guardian", "Payday Guardian", "the Guardian", and "your Guardian" all name the same persona, with the definite/possessive article shifting between adjacent surfaces.
- **Why it matters:** "your Guardian" implies something personal to the user; "The Payday Guardian" implies a product feature — the paywall and the card disagree on which it is.
- **Confidence:** high
- **Suggested fix:** "your Guardian" in all user-facing prose; "Payday Guardian" only as the card's proper-name eyebrow.

### L1-35 · Stilted, uncontracted phrasing in a screen-reader-only string
- **Severity:** polish
- **Where:** `apps/rn/src/app/(tabs)/index.tsx:838` "Your safety net covered about $X while your Guardian learned your bills. It is now going to work on Y." and "Your safety net is free — it is now going to work on Y."
- **What:** "It is now going to work on" drops the contraction the rest of the app uses and reads as an idiom ("put to work") the user has not been taught.
- **Why it matters:** These are the announcement strings, so they are read aloud — where the missing contraction is most audible.
- **Confidence:** high
- **Suggested fix:** "That's now going toward Y." (and see L1-8 for the voice fix in the same string).

---

## Checked and clean

- **Developer/QA copy is gated.** "Developer / QA", "Simulate Premium", the coach-mark and reduce-motion probe readouts, and the Live Activity QA screen are all behind `qaEnabled()` (`apps/rn/src/app/more.tsx:300`, `apps/rn/src/config/qa.ts:23`) and, for the More section, `Platform.OS !== 'web'`. No store-build leak found.
- **Pluralisation is handled** where the inventory made it look hardcoded — `PaydayCaptureSheet.tsx:353-355` branches on `staleBalances.length === 1`.
- **Oxford commas are consistent** wherever a list carries a conjunction ("All debts, bills, goals, and settings"; "a loan, credit card, or BNPL balance"; "your balances, debts, or amounts").
- **The scan issuer list, SF Symbol names, storage keys, route paths, theme tokens and regexes** flagged with ⚠️ in the inventory are not user-facing copy and were excluded rather than audited.

## Summary

**35 findings — 4 blocker, 15 major, 12 minor, 4 polish.**

The three to look at first:

1. **L1-1 — `buildGuardianBrief.ts:282` opens the "Very tight this paycheck" state with "You're covered this paycheck".** It is the exact defect pattern the house rules name, it fires in the state where being wrong costs the user real money, and it is a one-line fix.
2. **L1-2/L1-3/L1-4 — the paywall and onboarding sell promises the product disclaims.** "Debt payoff on autopilot" against "your Guardian never moves your money"; "holds your cushion at your line every payday" against the Recovery Plan bullet two lines below it; "core features never require a subscription" against a Premium-gated Guardian. These are purchase-inducement claims, so they carry refund and store-review exposure, not just tone risk.
3. **L1-5/L1-6/L1-14 — the core vocabulary is unsettled.** The cushion has six names (one of which, "safety net", is a genuinely different engine bucket), "expenses" and "bills" are used interchangeably on one screen while "expenses" also names a second concept, and "floor" means both the lean-income figure and the cushion. Nothing else on this list can be fixed cleanly until these three glossaries are decided, so it is the first editing pass, not the last.
