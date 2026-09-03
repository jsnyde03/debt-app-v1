from _boot import *
G=[['npx','tsx','scripts/check-local-dates.ts']]
P='apps/rn/src/utils/format.ts'
print('### control — the banned UTC round-trip on ONE line')
with_plant(P, """
export const __ctl = (d: Date) => d.toISOString().slice(0, 10);
""", G, tail=500)
print('### PLANT — the SAME expression, wrapped as Prettier wraps a method chain')
with_plant(P, """
export const __wrapped = (d: Date) =>
  d
    .toISOString()
    .slice(0, 10);
""", G, tail=500)
print('### PLANT B — argument list wrapped only')
with_plant(P, """
export const __wrappedArgs = (d: Date) =>
  d.toISOString().slice(
    0,
    10,
  );
""", G, tail=500)
