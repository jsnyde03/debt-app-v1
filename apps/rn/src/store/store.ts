import { createStore } from 'zustand/vanilla';

import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import {
  CURRENT_STORE_VERSION,
  type Debt,
  type DebtStore,
  type Goal,
  type PaycheckConfig,
  type PayoffStrategy,
  type Preferences,
  type RequiredExpense,
  type SubscriptionPlan,
} from '@/data/models';
import type { StorageAdapter } from '@/storage/adapter';

/**
 * The app-wide state: the persisted `store` blob + hydration lifecycle + the mutating actions.
 * Every action swaps in a new `store` object (immutable update) so the persistence subscription and
 * React selectors fire. Mirrors Freedom's store shape; entities come from the shared `@core` schema.
 */
export interface DebtAppState {
  store: DebtStore;
  isHydrated: boolean;
  isSaving: boolean;

  // Lifecycle
  hydrate(adapter: StorageAdapter): Promise<void>;
  save(adapter: StorageAdapter): Promise<void>;
  reset(): void;

  // Paycheck / strategy
  updatePaycheck(updates: Partial<PaycheckConfig>): void;
  setPayoffStrategy(strategy: PayoffStrategy): void;

  // Debts
  addDebt(debt: Debt): void;
  updateDebt(id: string, updates: Partial<Debt>): void;
  removeDebt(id: string): void;

  // Required expenses (bills)
  addExpense(expense: RequiredExpense): void;
  updateExpense(id: string, updates: Partial<RequiredExpense>): void;
  removeExpense(id: string): void;

  // Goals
  addGoal(goal: Goal): void;
  updateGoal(id: string, updates: Partial<Goal>): void;
  removeGoal(id: string): void;

  // Prefs / subscription / onboarding
  updatePrefs(updates: Partial<Preferences>): void;
  setSubscriptionPlan(plan: SubscriptionPlan): void;
  completeOnboarding(): void;

  // Import (shared by JSON import + iCloud restore + the Phase-D data bridge)
  importStore(store: DebtStore): void;
}

export function createDebtStore() {
  return createStore<DebtAppState>((set, get) => ({
    store: createDefaultStore(),
    isHydrated: false,
    isSaving: false,

    async hydrate(adapter) {
      const raw = await adapter.read();
      if (raw === null) {
        // First launch — keep defaults, seed the blob.
        set({ isHydrated: true });
        await adapter.write(get().store);
        return;
      }
      try {
        const migrated = runMigrations(raw);
        const upgraded = (raw as Partial<DebtStore>).storeVersion !== CURRENT_STORE_VERSION;
        set({ store: migrated, isHydrated: true });
        if (upgraded) await adapter.write(get().store);
      } catch {
        // Corrupt / unmigratable: quarantine the bytes, start fresh, overwrite (never write bad data back).
        await adapter.quarantine?.(JSON.stringify(raw), 'migration-failed');
        set({ isHydrated: true });
        await adapter.write(get().store);
      }
    },

    async save(adapter) {
      set({ isSaving: true });
      try {
        await adapter.write(get().store);
      } finally {
        set({ isSaving: false });
      }
    },

    reset() {
      // "Reset all data": fresh defaults, stay hydrated (onboardingComplete=false → the gate returns
      // to onboarding). Autosave persists it.
      set({ store: createDefaultStore(), isHydrated: true });
    },

    updatePaycheck(updates) {
      set((s) => ({ store: { ...s.store, paycheck: { ...s.store.paycheck, ...updates } } }));
    },
    setPayoffStrategy(strategy) {
      set((s) => ({ store: { ...s.store, payoffStrategy: strategy } }));
    },

    addDebt(debt) {
      set((s) => ({ store: { ...s.store, debts: [...s.store.debts, debt] } }));
    },
    updateDebt(id, updates) {
      set((s) => ({
        store: { ...s.store, debts: s.store.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)) },
      }));
    },
    removeDebt(id) {
      set((s) => ({ store: { ...s.store, debts: s.store.debts.filter((d) => d.id !== id) } }));
    },

    addExpense(expense) {
      set((s) => ({ store: { ...s.store, requiredExpenses: [...s.store.requiredExpenses, expense] } }));
    },
    updateExpense(id, updates) {
      set((s) => ({
        store: {
          ...s.store,
          requiredExpenses: s.store.requiredExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        },
      }));
    },
    removeExpense(id) {
      set((s) => ({
        store: { ...s.store, requiredExpenses: s.store.requiredExpenses.filter((e) => e.id !== id) },
      }));
    },

    addGoal(goal) {
      set((s) => ({ store: { ...s.store, goals: [...s.store.goals, goal] } }));
    },
    updateGoal(id, updates) {
      set((s) => ({
        store: { ...s.store, goals: s.store.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) },
      }));
    },
    removeGoal(id) {
      set((s) => ({ store: { ...s.store, goals: s.store.goals.filter((g) => g.id !== id) } }));
    },

    updatePrefs(updates) {
      set((s) => ({ store: { ...s.store, prefs: { ...s.store.prefs, ...updates } } }));
    },
    setSubscriptionPlan(plan) {
      set((s) => ({ store: { ...s.store, subscriptionPlan: plan } }));
    },
    completeOnboarding() {
      set((s) => ({ store: { ...s.store, prefs: { ...s.store.prefs, onboardingComplete: true } } }));
    },

    importStore(store) {
      set({ store });
    },
  }));
}

export type DebtStoreInstance = ReturnType<typeof createDebtStore>;
