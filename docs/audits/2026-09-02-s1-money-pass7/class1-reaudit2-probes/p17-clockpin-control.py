from _boot import *
from datetime import date, timedelta
d = (date.today()+timedelta(days=8)).isoformat()
G=[['npx','tsx','scripts/check-fixture-dates.ts']]
P='apps/rn/src/utils/format.test.ts'
print('### CONTROL — identical plant, comment line REMOVED')
with_plant(P, "\nconst __cp = { dueDate: '%s' };\n" % d, G, tail=500)
print('### PLANT — comment line restored')
with_plant(P, "\n// currentDate: '2026-01-01' is the pin the sibling suite uses\nconst __cp = { dueDate: '%s' };\n" % d, G, tail=500)
print('### PLANT B — the same prose inside a BLOCK comment')
with_plant(P, "\n/** the sibling suite pins currentDate: '2026-01-01' */\nconst __cp2 = { dueDate: '%s' };\n" % d, G, tail=500)
