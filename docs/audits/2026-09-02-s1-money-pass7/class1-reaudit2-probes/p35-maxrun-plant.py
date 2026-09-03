from _boot import *
P='apps/rn/src/utils/format.ts'
print('### CONTROL — a 3-line wrapped Math.round + a 3-line wrapped collapse')
with_plant(P, """
export const __r3 = (x: number) =>
  Math.round(
    x * 100,
  ) / 100;
export const __c3 = (raw: string) =>
  parseAmountField(
    raw,
  ) ?? 0;
""", [['npx','tsx','scripts/check-rounding.ts'],['npx','tsx','scripts/check-amount-collapse.ts']], tail=260)
print('### PLANT — the SAME two defects, argument lists wrapped over 10 physical lines')
with_plant(P, """
export const __r10 = (a: number, b: number, c: number, d: number, e: number, f: number, g: number) =>
  Math.round(
    (
      a +
      b +
      c +
      d +
      e +
      f +
      g
    ) * 100,
  ) / 100;
export const __c10 = (raw: string, a: number, b: number, c: number, d: number, e: number, f: number) =>
  parseAmountField(
    raw
      .trim()
      .slice(
        a,
        b,
      )
      .padStart(
        c + d + e + f,
        '0',
      ),
  ) ?? 0;
""", [['npx','tsx','scripts/check-rounding.ts'],['npx','tsx','scripts/check-amount-collapse.ts']], tail=260)
