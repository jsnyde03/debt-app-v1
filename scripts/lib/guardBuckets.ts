/**
 * ⛔ **S1.12.5.1 [pass-5 D5-2] — ONE PRODUCER OF THE BUCKETS, BECAUSE THERE WERE TWO.**
 *
 * ⚡ `prove:guards --list` printed `never tested : 120`; `lint:finding-guards` printed
 * `119 never tested (cap 119)`. Both exit 0, and **the delta is exactly `GAP-14`** — the one entry
 * marked `unguarded`, which `check-finding-guards.ts` skips before bucketing and `prove-guards.ts`
 * counted as untested. One question, two implementations, answers off by one.
 *
 * ⛔ **That is `D4-6`'s shape, and `D4-6` is why `verdict()` lives in one file.** The consequence here
 * is not cosmetic: `MAX_UNPROVEN` is a downward-only ratchet, so **a human who lowers the cap to the
 * number `--list` just showed them reds the gate** — and the obvious repair is to raise the cap back,
 * which is the exact move the ratchet exists to refuse.
 *
 * ⚠️ **`unguarded` is a THIRD state, not a kind of untested.** An entry with a written reason for
 * having no guard has been decided about; an untested one has not. Collapsing them makes the backlog
 * look one larger than it is and hides the fact that a decision was recorded.
 */

/** The shape both consumers agree on. Each declares its own richer `Entry`; this is the common part. */
export interface BucketableEntry {
  file?: string;
  token?: string;
  unguarded?: string;
  proof?: unknown;
  guardOnly?: unknown;
}

export interface GuardBuckets {
  /** a written reason for having no guard at all — decided about, and NOT part of the untested backlog */
  unguarded: string[];
  /** carries a re-runnable `prove:guards` proof */
  withProof: string[];
  /** the token stands and nothing proves it reds — measured, or unplantable; both are the same hole */
  guardOnly: string[];
  /** ⛔ nobody has ever made this guard red */
  untested: string[];
}

/**
 * ⚠️ **The order of the tests is the definition.** `unguarded` is checked FIRST and returns, exactly as
 * `check-finding-guards.ts` did with its `continue` — that file was the correct one and this preserves
 * its answer rather than splitting the difference.
 */
export function bucketGuards(registry: Record<string, BucketableEntry>): GuardBuckets {
  const b: GuardBuckets = { unguarded: [], withProof: [], guardOnly: [], untested: [] };
  for (const [id, e] of Object.entries(registry)) {
    if (e.unguarded) b.unguarded.push(id);
    else if (e.proof) b.withProof.push(id);
    else if (e.guardOnly) b.guardOnly.push(id);
    else b.untested.push(id);
  }
  return b;
}

/**
 * ⛔ **MODULE SCOPE — import alone fires it**, the `S1P3-SELFCHECK-CALL` idiom, so a check inside a
 * function nobody calls cannot be the residual. ⚡ **The load-bearing row is the `unguarded` one**: it is
 * the only assertion that distinguishes this implementation from the one `prove-guards.ts` had, and
 * restoring `!e.proof && !e.guardOnly` makes it — and nothing else here — red.
 */
{
  const die = (detail: string): never => {
    console.error(`\n❌ guardBuckets — its own self-check is broken: ${detail}\n`);
    process.exit(1);
  };
  const got = bucketGuards({
    A: { file: 'f', token: 't', proof: {} },
    B: { file: 'f', token: 't', guardOnly: 'measured not to hold' },
    C: { file: 'f', token: 't' },
    // ⛔ THE ROW D5-2 WAS ABOUT. An unguarded entry is its own bucket and is NOT untested.
    D: { unguarded: 'tracked as GAP-14' },
    // ⚠️ And an unguarded entry that ALSO carries a proof still buckets as unguarded — the first test
    // wins, which is what `check-finding-guards.ts` did. Stated so the precedence is asserted, not
    // inferred from the order two readers might each re-derive differently.
    E: { unguarded: 'tracked', proof: {} },
  });
  const want = { unguarded: 'D,E', withProof: 'A', guardOnly: 'B', untested: 'C' };
  for (const [k, v] of Object.entries(want)) {
    const actual = (got[k as keyof GuardBuckets] as string[]).join(',');
    if (actual !== v) die(`${k}: expected [${v}] · got [${actual}]`);
  }
}
