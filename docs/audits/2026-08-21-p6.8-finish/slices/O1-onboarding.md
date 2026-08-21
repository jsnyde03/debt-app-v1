# O1 — ONBOARDING & FIRST RUN

> **Lens O1** of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Scope: the first five minutes. Cold start → Welcome → Paycheck → First Debt/Bill → Completion → Today,
> plus the demo door, odd input, abandonment/return, and the handoff.
>
> Written incrementally. Findings only — nothing fixed.

**Surface read:**
- `apps/rn/src/app/onboarding.tsx`
- `apps/rn/src/components/onboarding/{OnboardingLayout,WelcomeStep,PaycheckStep,FirstDebtOrBillStep,CompletionStep}.tsx`
- `apps/rn/src/store/onboardingFinish.ts`
- frames: `apps/rn/capture-ref/p6.8/{phone-small,phone,split-view,ipad-portrait,ipad-landscape}/{light,dark}/onboarding.png`

---

## Findings

