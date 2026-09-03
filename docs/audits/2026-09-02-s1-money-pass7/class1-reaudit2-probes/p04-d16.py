from _boot import *
with_plant('apps/rn/src/utils/format.ts', """
export function __d16(x: number) {
  return (
    Math.round(
      x * 100,
    ) / 100
  );
}
""", [['npx','tsx','scripts/check-rounding.ts']])
