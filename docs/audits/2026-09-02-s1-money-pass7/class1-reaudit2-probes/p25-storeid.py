from _boot import *
G=[['npx','tsx','scripts/check-store-id-writes.ts']]
P='apps/rn/src/store/balanceSelectors.ts'
print('### control — a lookup on ONE line (what the gate is written against)')
with_plant(P, """
export function __ctl(rows: { id: string }[], id: string) {
  return rows.findIndex((r) => r.id === id);
}
""", G, tail=600)
print('### PLANT — the SAME lookup, wrapped the way Prettier wraps it')
with_plant(P, """
export function __wrapped(rows: { id: string }[], id: string) {
  return rows.findIndex(
    (r) => r.id === id,
  );
}
""", G, tail=600)
