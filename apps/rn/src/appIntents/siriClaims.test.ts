import { readFileSync } from 'node:fs';

/**
 * `S1.13.7.11` [pass-6 blocker **`C3-7`**] — what Siri says about the user's money, and what the queue
 * write does to what is already in it.
 *
 * ⛔ **Siri said "Logged $200.00 toward Chase" — past tense, as a completed fact — for a payment that has
 * only been QUEUED**, and said it even when the queue write did not happen. The `if let` had no `else` and
 * the `return` sat below it, so after the two guards there was exactly one exit from `perform()` and it
 * asserted success unconditionally. Two ways the body can fail to record were both silent and both kept
 * the sentence: the suite failing to open, and the `as? [[String: Any]]` cast failing.
 *
 * ⛔ **The quieter half DESTROYS DATA rather than merely lying about it.** `?? []` replaced an unreadable
 * queue with an empty array and wrote it straight back, so an already-queued `payday-landed` was deleted
 * by a later log-payment — the exact failure `PaydayLandedIntent`'s own comment says the `[String: Any]`
 * element type was chosen to prevent. The type was widened on both sides; the `?? []` that does the wiping
 * was left in place on both sides too.
 *
 * ⚠️ **THIS IS A SOURCE SCAN, AND THAT IS A LIMIT WORTH STATING.** Nothing in this repo builds the Swift
 * target — the finding's own author said the same and ran neither half. So this pins the STRUCTURE that
 * makes the false claim impossible; whether Siri speaks the new sentence is a device row, filed with the
 * rest of `P6.14`. A green run here is not a green run on hardware.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

console.log('\n▶ C3-7 — Siri claims only what has happened, and never wipes the queue');

const logPayment = read('../../plugins/app-intents-swift/LogPaymentIntent.swift');
assert(logPayment.includes('struct LogPaymentIntent'), 'the intent source was actually read');

// ── the tense: nothing is logged at the moment the sentence is spoken ────────────
assert(
  !/dialog: "Logged /.test(logPayment),
  '⛔ the past-tense claim is gone — nothing is logged when this is spoken',
);
assert(
  logPayment.includes('Got it —') && logPayment.includes('Open Debt Planner to record it.'),
  '…replaced by what is true at that instant, and what the user must still do',
);

// ── the failure path: an exit that says so, which did not exist ──────────────────
assert(
  logPayment.includes('guard let defaults = UserDefaults(suiteName: SnapshotStore.appGroup) else'),
  'a suite that will not open RETURNS, rather than falling through to the success sentence',
);
assert(
  (logPayment.match(/I couldn’t save that\. Open Debt Planner and log it there\./g) ?? []).length === 2,
  '…and BOTH failure paths say so — the suite and the unreadable queue',
);

// ── the wipe: every writer of this queue, not just the one that was reported ─────
// ⚠️ THREE files, and the finding named one. `PaydayLandedIntent` is duplicated byte-for-byte because
// AppIntents route by type name, so a fix to one copy that misses the other ships the defect in the
// target that actually runs.
const QUEUE_WRITERS = [
  '../../plugins/app-intents-swift/LogPaymentIntent.swift',
  '../../modules/live-activity/ios/PaydayLandedIntent.swift',
  '../../targets/widget/PaydayLandedIntent.swift',
] as const;
for (const rel of QUEUE_WRITERS) {
  const src = read(rel);
  assert(src.includes('pendingActions'), `${rel} writes the queue (or this list is stale)`);
  // ⛔ `defaults.array(forKey:)` is the shape that CANNOT tell the two apart: it returns nil for "absent"
  // and for "present but not an array", so `?? []` then overwrites a queue it simply failed to read.
  // The property is the READ, not the `?? []` — after an explicit refusal above it, the coalesce is fine.
  assert(
    !src.includes('defaults.array(forKey:'),
    `${rel}: ⛔ the read that cannot tell "absent" from "unreadable" is gone`,
  );
  assert(
    src.includes('defaults.object(forKey: key)'),
    `${rel}: …it reads the raw value first, so those two are told apart`,
  );
}

// ── the control: the two duplicated copies still agree ───────────────────────────
// ⛔ Their own header says AppIntents route by TYPE NAME, so a drift between them is not a style problem —
// it is two different behaviours under one name, and the one that runs is decided by the build.
const a = read('../../modules/live-activity/ios/PaydayLandedIntent.swift');
const b = read('../../targets/widget/PaydayLandedIntent.swift');
const body = (s: string) => s.slice(s.indexOf('struct PaydayLandedIntent'));
assert(body(a) === body(b), 'the two PaydayLandedIntent copies are still byte-identical from the struct down');

console.log(`\n✅ C3-7 — ${passed} assertion(s) passed (source only; the spoken half is a device row)\n`);
