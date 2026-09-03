from _boot import *
G=[['npx','tsx','scripts/check-press-opacity.ts']]
P='apps/rn/src/components/SaveFailedBanner.tsx'
print('### control — the banned ternary on ONE line')
with_plant(P, """
const __ctl = ({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.7 : 1 });
""", G, tail=350)
print('### PLANT — the SAME ternary, wrapped by the formatter')
with_plant(P, """
const __wrapped = ({ pressed }: { pressed: boolean }) => ({
  opacity: pressed
    ? 0.7
    : 1,
});
""", G, tail=350)
