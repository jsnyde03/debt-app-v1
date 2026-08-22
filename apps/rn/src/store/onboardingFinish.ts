import { formatPaycheckDate } from '@/store/paycheckForm';

/**
 * The onboarding finish line, as a LADDER OF REAL FACTS — never a content-free reassurance.
 *
 * ⛔ T3B (audit L5-11). The good rung already existed: *"You could be debt-free by {date}"* — their own
 * number, at the right beat, genuinely best-in-class. But it fell back to **"You're all set"** whenever
 * `debtFreeDate` is null, which is every user who skipped the paycheck step, skipped the debt step, or
 * chose **Expense** in step 2 — an equally-weighted option the product itself offers. So the one moment
 * that could make this app memorable was dropped for exactly the people carrying the least momentum,
 * and replaced with a line that says nothing about them.
 *
 * Each rung states something true of THIS user; only the last is generic, and by then there is genuinely
 * nothing known because they skipped every question.
 *
 * ⚠️ Lives here rather than in `CompletionStep` so it is PURE — the app-layer test runner transforms
 * only modules free of `react-native` imports, which is why the component cannot host its own copy rule.
 */
export function finishLine(debtFreeDate: string | null, nextPaycheckDate: string): { title: string; body: string } {
  if (debtFreeDate) {
    return {
      title: `You could be debt-free by ${debtFreeDate}`,
      body: "That’s your target — stay the course. Tap below to see exactly what to do with your next paycheck.",
    };
  }
  if (nextPaycheckDate) {
    return {
      title: `Your next paycheck lands ${formatPaycheckDate(nextPaycheckDate)}`,
      body: "Here’s what it has to cover, and what’s left after. Add a debt any time and you’ll get a debt-free date too.",
    };
  }
  return {
    title: 'Your plan is ready',
    body: 'Add your paycheck and what you owe, and this becomes a plan for every payday.',
  };
}
