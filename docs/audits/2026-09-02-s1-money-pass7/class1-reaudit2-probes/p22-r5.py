from _boot import *
print('### R5 — a collapse and a rounding copy inside a template-literal interpolation')
with_plant('apps/rn/src/utils/format.ts', """
export function __r5(raw: string, x: number) {
  return `${parseAmountField(raw) ?? 0} and ${Math.round(x * 100) / 100}`;
}
""", [['npx','tsx','scripts/check-amount-collapse.ts'],['npx','tsx','scripts/check-rounding.ts']], tail=400)
