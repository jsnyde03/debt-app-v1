/**
 * [S1.10.6.5.8.4 · GAP-8] — **A GATE THAT READ NOTHING MUST NOT REPORT A PASS.**
 *
 * ⛔ **MEASURED, NOT ARGUED.** Blanking both exports of `stripCode.ts` and running all eleven consumers:
 * `check-destructive-writes`, `check-sandbox-writes`, `check-trust-claims` and `check-copy-owners` RED —
 * they carry a declared-count ledger, so reading nothing contradicts a number. The other **seven report
 * ✅ and exit 0 while reading nothing at all**: glossary · money-format · local-dates · press-opacity ·
 * native-a11y-props · apostrophes · month-arithmetic. Three of them print a figure that is *false as
 * printed* — `press opacity: 383 files, every control state on a token` is asserted over zero tokens.
 *
 * ⚡ **WHY ONE UNIFORM QUANTITY RATHER THAN SEVEN BESPOKE HIT COUNTS.** GAP-8 proposed a per-gate hit
 * floor modelled on `check-destructive-writes`. A semantic count per gate is richer, but it is **seven
 * separate designs with seven chances to be subtly vacuous** — and a vacuous assertion that counts as
 * guarded is this cluster's single most repeated defect (pass 2 measured seven green registry entries
 * that survived their own un-fix). The quantity here is the one GAP-8's own sentence names: **how much
 * did this gate actually read.** It collapses to zero under exactly the failure being guarded, it cannot
 * be vacuous, and it is the same line of code in every gate.
 *
 * ⚠️ **PARTIAL blinding is caught too, not just total.** The floor is the measured count, so a stripper
 * that blanks *some* files drops the total below it. A floor of 1 would only ever catch total blindness.
 *
 * ⛔ **DOWNWARD-ONLY, and slack is REPORTED rather than failed.** Lowering a floor is deliberate and needs
 * a reason, exactly like `HOSTILE_FLOOR`. Failing when the count RISES was considered and rejected: unlike
 * `MAX_UNGUARDED` this is not a backlog draining, it is a codebase growing, so a ratchet upward would red
 * on ordinary work and train people to raise the number without reading it — the failure mode
 * `web-e2e.yml`'s header already documents killing a lane. Slack is printed so it stays visible.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LEDGER = join(import.meta.dirname, '..', 'gate-scan-floors.json');

interface Floor {
  floor: number;
  measured: string;
  why: string;
}

const accumulated = new Map<string, number>();

/**
 * Wraps a strip call: counts the non-blank lines that survived, and returns the text unchanged so the
 * call site reads exactly as it did before.
 */
export function scanned(gate: string, stripped: string): string {
  let n = 0;
  for (const line of stripped.split('\n')) if (line.trim().length > 0) n++;
  accumulated.set(gate, (accumulated.get(gate) ?? 0) + n);
  return stripped;
}

/**
 * Call once, immediately before the gate's success line. Exits 1 if the gate read less than it is
 * recorded as reading — i.e. if it has gone blind — and returns the observed count so the gate can print it.
 */
export function assertScanFloor(gate: string): number {
  const ledger: Record<string, Floor> = JSON.parse(readFileSync(LEDGER, 'utf8'));
  const entry = ledger[gate];
  const observed = accumulated.get(gate) ?? 0;

  if (!entry) {
    console.error(
      `\n❌ ${gate}: no scan floor recorded. A gate that strips its input needs a floor in\n` +
        `  scripts/gate-scan-floors.json, or it can report a pass while reading nothing (GAP-8).\n` +
        `  Observed this run: ${observed} non-blank lines.\n`,
    );
    process.exit(1);
  }

  if (observed < entry.floor) {
    console.error(
      `\n❌ ${gate}: READ LESS THAN IT IS RECORDED AS READING — ${observed} non-blank lines against a\n` +
        `  floor of ${entry.floor} (measured ${entry.measured}).\n\n` +
        `  A gate that finds nothing has either fixed the class or gone blind, and only the gate can tell\n` +
        `  you which. Something upstream — the stripper, the file glob, the extension list, a root — is\n` +
        `  handing this gate less source than it had. ⛔ Do NOT lower the floor to get green unless you\n` +
        `  have established the drop is real, and then say why in scripts/gate-scan-floors.json.\n`,
    );
    process.exit(1);
  }

  return observed;
}

/** The slack suffix a gate appends to its success line, so a drifting floor stays visible. */
export function scanNote(gate: string, observed: number): string {
  const ledger: Record<string, Floor> = JSON.parse(readFileSync(LEDGER, 'utf8'));
  const floor = ledger[gate]?.floor ?? 0;
  return ` [read ${observed} lines, floor ${floor}]`;
}
