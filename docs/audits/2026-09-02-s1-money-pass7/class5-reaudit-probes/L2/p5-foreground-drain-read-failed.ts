/**
 * L2 probe P5. Run: copy to apps/rn/src/__probe_L2_p5.ts in a worktree, `tsx`. Works at the pin and at c7df99c2
 * (it touches no class-5 API).
 *
 * `_layout.tsx:115-128` skips the launch drain while `storageError === 'read-failed'`, and its comment names a queued
 * intent as something that must not reach DEFAULTS. The return-to-foreground drain (`_layout.tsx:189`) asks neither
 * `storageError` nor `isHydrated`. Store-level half: a read that throws leaves default data in the store; the foreground
 * drain then runs against it and clears the queue; the retry reads the real store back. Where did the queued payment go?
 */
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';

const base = createDefaultStore();
const real: DebtStore = {
  ...base,
  prefs: { ...base.prefs, onboardingComplete: true },
  debts: [{ id: 'd0', name: 'Visa', balance: 5000, minimumPayment: 100, apr: 20, dueDate: base.paycheck.currentDate, type: 'debt', recurrence: 'monthly' }] as DebtStore['debts'],
};

async function scenario(label: string, readFailsFirst: boolean) {
  const s = createDebtStore();
  let fail = readFailsFirst;
  const adapter = {
    read: async () => {
      if (fail) { fail = false; throw new Error('keychain locked'); }
      return JSON.parse(JSON.stringify(real));
    },
    write: async () => {},
  };
  await s.getState().hydrate(adapter as never);
  const stateAtDrain = { storageError: s.getState().storageError, isHydrated: s.getState().isHydrated, debts: s.getState().store.debts.length };

  let queue: string | null = JSON.stringify([{ kind: 'log-payment', id: 'siri-1', debtId: 'd0', amount: 250 }]);
  let cleared = false;
  // Foreground path: `_layout.tsx:189` calls this with no storageError/isHydrated check.
  const applied = drainPendingActions({ read: () => queue, clear: () => { queue = null; cleared = true; } }, s.getState());

  if (readFailsFirst) {
    // The retry surface: `_layout.tsx:270-271` resets the flags and re-runs persistence.
    s.setState({ storageError: null, isHydrated: false });
    await s.getState().hydrate(adapter as never);
  }
  // And the launch drain after a successful hydrate (what would have applied the payment).
  drainPendingActions({ read: () => queue, clear: () => { queue = null; } }, s.getState());

  console.log(JSON.stringify({
    label,
    stateAtDrain,
    appliedAtForeground: applied.length,
    queueClearedAtForeground: cleared,
    queueAfter: queue,
    finalBalance: s.getState().store.debts.find((d) => d.id === 'd0')?.balance ?? null,
    expectedBalance: 4750,
  }));
}

(async () => {
  await scenario('control-read-ok', false);
  await scenario('subject-read-failed-then-retry', true);
})().catch((e) => { console.error(e); process.exit(1); });
