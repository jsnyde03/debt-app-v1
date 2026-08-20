/**
 * Notification copy, in the one place BOTH platform files can read.
 *
 * ⛔ **[P6.4.4 · audit L1-25] Why this module exists and why it is empty of logic.** `notifications.ts`
 * and `notifications.web.ts` are a platform split: the web file is a **no-op stub** whose whole job is to
 * export the same surface without pulling `expo-notifications` into the web bundle. That made the copy
 * impossible to share — importing the native module would defeat the stub — so the two files each spelled
 * the risk notification out, and they had **drifted into different voices**:
 *
 * - native — *"Before this paycheck lands"* / *"I'd give your plan a quick look before payday."*
 * - web — *"Time to check this paycheck"* / *"Take a quick look at your plan before this one lands."*
 *
 * ⚠️ **The web copy is never delivered** (local notifications are native-only), so this was latent, not
 * live. It is fixed anyway because the stub's entire contract is *"the same surface"*, and a stub that
 * silently disagrees about content is a stub that stops being a stub. A module with no platform imports
 * is the only place both sides can reach.
 *
 * ⛔ **Do NOT import anything platform-specific here.** The moment this file pulls `expo-notifications`,
 * the web bundle grows it back and the split it serves is undone.
 */

/**
 * §2.8 Guardian risk push (2.4.10.2) — a NEUTRAL prompt, never a verdict a reconcile-to-clear would turn
 * into cried-wolf, and never a figure (the hedged number stays in-app). It under-claims by design: a
 * never-opened user gets exactly this, so it must be safe even if the read later reconciles to clear.
 *
 * 3.1.4 house voice: the Guardian's first person, but STILL neutral — no verdict ("tight"), no figure.
 */
export const RISK_NOTIFICATION = {
  title: 'Before this paycheck lands',
  body: "I’d give your plan a quick look before payday.",
} as const;
