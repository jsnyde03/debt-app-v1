/**
 * 8.4.3 lead probe: what does the app PROMISE a user about each lost plan field, and does a control exist to keep the promise?
 * `answerableByEdit` answers `true` for every plan repair (`C1-2`), so the repairs card and every refusal say "set it again".
 * Read, not yet measured: no user action writes `typicalAmount` (only `defaults.ts` and a restored file) or
 * `expenseReserve.balance` (only rollover). The cushion line is the control — `CushionFloorSheet` sets it.
 * Read-only. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const R = (p: string) => pathToFileURL(`${process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1'}/apps/rn/${p}`).href;

async function main() {
  const { repairBlocks, unreadInputsFix } = await import(R('src/components/plan/dataRepairsCopy.ts'));
  const { answerableByEdit } = await import(R('src/store/trustSelectors.ts'));
  const PLAN_LABELS: Record<string, string> = {
    cushionFloor: 'your cushion line (control: CushionFloorSheet sets it)',
    windfall: 'a windfall (WindfallSheet sets it)',
    leanAmount: 'your lean paycheck (PaycheckSheet sets it)',
    typicalAmount: 'your typical paycheck (no writer found)',
    expenseReserveBalance: 'money set aside for bills (no user writer found; rollover rewrites it)',
  };
  for (const [field, note] of Object.entries(PLAN_LABELS)) {
    const repair = { entity: 'plan', id: '', name: field, field, kind: 'lost' };
    const [block] = repairBlocks([repair]);
    console.log(JSON.stringify({
      field,
      note,
      answerableByEdit: answerableByEdit(repair),
      cardKind: block?.kind,
      cardDetail: block?.detail,
      refusalSays: unreadInputsFix([repair], 'and this comes back'),
    }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
