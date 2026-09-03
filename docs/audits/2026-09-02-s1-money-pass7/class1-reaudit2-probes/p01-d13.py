from _boot import *
with_plant('apps/rn/src/utils/format.ts', """
export const __d13 = (raw: string) =>
  parseAmountField(
    raw,
  ) ?? 0;
""", [['npx','tsx','scripts/check-amount-collapse.ts']])
