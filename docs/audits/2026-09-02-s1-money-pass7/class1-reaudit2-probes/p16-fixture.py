from _boot import *
from datetime import date, timedelta
d = (date.today()+timedelta(days=8)).isoformat()
G=[['npx','tsx','scripts/check-fixture-dates.ts']]
P='apps/rn/src/utils/format.test.ts'
print('### CONTROL — the array with no exemption')
with_plant(P, """
const __ctl = [
  { dueDate: '2026-01-01' },
  { dueDate: '%s' },
];
""" % d, G, tail=400)
print('### R6 — exemption on the FIRST element only; the second is a live 8-day fuse')
with_plant(P, """
const __r6 = [
  { dueDate: '2026-01-01' }, // fixture-date-ok: the launch date is the subject of this test
  { dueDate: '%s' },
];
""" % d, G, tail=400)
print('### R7 — the aging key supplied by a COMMENT two lines above')
with_plant(P, """
const __r7 = [
  // the dueDate:
  '%s',
];
""" % d, G, tail=400)
print('### NEW? — CLOCK_PIN matched inside a COMMENT silences the whole file')
with_plant(P, """
// currentDate: '2026-01-01' — this is prose in a comment, not a pin
const __cp = { dueDate: '%s' };
""" % d, G, tail=400)
