/**
 * ROUND-2 PROBE — walk the clock across N consecutive days, re-evaluating a clock-relative test module
 * on each one.
 *
 * The module is COPIED to a fresh filename per day (in its own directory, so its relative imports still
 * resolve). Its dependencies stay cached, which is what we want — only the fixture consts re-run.
 *
 *   npx tsx src/testing/__clockwalk.ts <store|testing> <basename-without-.ts> <days> [startISO]
 */
import { copyFileSync, unlinkSync } from 'node:fs';

const dirName = process.argv[2];
const base = process.argv[3];
const days = Number(process.argv[4] ?? 365);
const startISO = process.argv[5] ?? new Date().toISOString().slice(0, 10);

const RealDate = Date;
function pin(iso: string) {
  const fixed = new RealDate(`${iso}T09:00:00`).getTime();
  class FakeDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(fixed as never);
      else super(...(args as []));
    }
    static now() { return fixed; }
  }
  (globalThis as unknown as { Date: unknown }).Date = FakeDate;
}
function unpin() { (globalThis as unknown as { Date: unknown }).Date = RealDate; }

const addDays = (iso: string, n: number) => {
  const d = new RealDate(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

async function main() {
  const reds: { date: string; msg: string }[] = [];
  const origLog = console.log;
  const origErr = console.error;
  let evaluated = 0;
  for (let i = 0; i < days; i++) {
    const iso = addDays(startISO, i);
    const copyBase = `__cw${i}_${base}`;
    const src = `src/${dirName}/${base}.ts`;
    const copy = `src/${dirName}/${copyBase}.ts`;
    copyFileSync(src, copy);
    pin(iso);
    console.log = () => {};
    console.error = () => {};
    try {
      await import(`../${dirName}/${copyBase}`);
      evaluated++;
    } catch (err) {
      evaluated++;
      reds.push({ date: iso, msg: String((err as Error).message ?? err).slice(0, 240) });
    } finally {
      console.log = origLog;
      console.error = origErr;
      unpin();
      unlinkSync(copy);
    }
  }
  console.log(`\nclockwalk src/${dirName}/${base}.ts: ${evaluated}/${days} days from ${startISO}, ${reds.length} RED`);
  const byMsg = new Map<string, string[]>();
  for (const r of reds) {
    if (!byMsg.has(r.msg)) byMsg.set(r.msg, []);
    byMsg.get(r.msg)!.push(r.date);
  }
  for (const [msg, dates] of byMsg) {
    console.log(`\n  [${dates.length} days] ${msg}`);
    console.log(`    first ${dates[0]} · last ${dates[dates.length - 1]}`);
    console.log(`    sample: ${dates.slice(0, 10).join(' ')}`);
  }
  if (reds.length === 0) console.log('  (green on every sampled day)');
}
main();
