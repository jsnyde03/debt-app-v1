import { QA_TOOLS } from '@/config/qa';

import { personaScenario, SANDBOX_STATES, type SandboxState } from './sandboxScenarios';
import type { SandboxScenario, SandboxStoreInstance } from './sandboxStore';

/**
 * 3.5.0.7 — the E2E/QA harness seam for the Phase-3.5 sandbox.
 *
 * The sandbox is in-memory and built at runtime, so the existing e2e trick — seed `localStorage` and let
 * the real store hydrate — cannot reach it. A tutorial test therefore needs two things the app doesn't
 * otherwise offer: a way to say WHICH scripted state to open in, and a way to read back what the sandbox
 * actually holds in order to assert on it.
 *
 * Deliberately narrow: this exposes a scenario *selection* and a read-only *snapshot*, never the store's
 * action API. A test can pick the state and inspect the result; it cannot reach in and mutate the plan,
 * which would let a test pass while the real interaction was broken.
 *
 * Gated behind `__DEV__ || QA_TOOLS`, the same switch the Live-Activity QA controls already use — so it
 * disappears with the Phase-6 `QA_TOOLS` flip (`git grep QA_TOOLS`). Nothing attaches in a store build.
 *
 * ⚠️ SCOPE (corrected in this leaf's before-scan): 3.5.0.7 ships the SEAM, not the tutorial e2e itself —
 * there is no tutorial UI to drive until 3.5.1/3.5.3 land. The test that consumes this is part of
 * 3.5.2's VoiceOver + e2e exit-gate.
 */

/** The scenario ids a harness may name. Kept as strings so a test never imports app internals. */
export const HARNESS_SCENARIO_IDS: string[] = SANDBOX_STATES.map((s) => `persona-${s}`);

interface SandboxHarnessGlobal {
  /** Set by the test BEFORE the tutorial mounts, to force the opening state. */
  scenarioId?: string;
  /** Read by the test AFTER the tutorial mounts — a snapshot, never the live store. */
  snapshot?: () => {
    scenarioId: string;
    cycle: number;
    date: string;
    cushionFloor: number;
    reserveHeld: boolean;
  } | null;
}

/** Is the harness allowed to exist in this build at all? */
function harnessEnabled(): boolean {
  const dev = typeof __DEV__ !== 'undefined' && __DEV__;
  return dev || QA_TOOLS;
}

function harnessGlobal(): SandboxHarnessGlobal | null {
  if (!harnessEnabled()) return null;
  const g = globalThis as typeof globalThis & { __debtSandboxHarness?: SandboxHarnessGlobal };
  if (!g.__debtSandboxHarness) g.__debtSandboxHarness = {};
  return g.__debtSandboxHarness;
}

/** Map a harness id back to a real scenario. Unknown ids return null — the caller keeps its default. */
export function resolveScenario(id: string | undefined, opts: { maxGenuineCycles?: number } = {}): SandboxScenario | null {
  if (!id) return null;
  const state = SANDBOX_STATES.find((s) => id === `persona-${s}`) as SandboxState | undefined;
  return state ? personaScenario(state, opts) : null;
}

/**
 * The scenario a test asked for, if any. The tutorial calls this when choosing what to open in, and
 * falls back to its own choice when nothing was requested (i.e. always, in a real user's build).
 */
export function harnessScenario(opts: { maxGenuineCycles?: number } = {}): SandboxScenario | null {
  return resolveScenario(harnessGlobal()?.scenarioId, opts);
}

/**
 * Publish a read-only view of the live sandbox for assertions. The tutorial calls this once it has built
 * its sandbox. No-op outside the gate, so a store build publishes nothing.
 */
export function publishSandbox(store: SandboxStoreInstance, scenarioId: string): void {
  const g = harnessGlobal();
  if (!g) return;
  g.snapshot = () => {
    const s = store.getState().store;
    return {
      scenarioId,
      cycle: s.genuineCycleCount,
      date: s.paycheck.currentDate,
      cushionFloor: s.cushionFloor,
      reserveHeld: s.priorReserveHeld ?? true,
    };
  };
}

/** Clear the published view when the tutorial unmounts, so a stale snapshot can't outlive its sandbox. */
export function unpublishSandbox(): void {
  const g = harnessGlobal();
  if (g) g.snapshot = undefined;
}
