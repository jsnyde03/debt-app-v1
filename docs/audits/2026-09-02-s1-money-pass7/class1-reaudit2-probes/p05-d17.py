from _boot import *
from datetime import date, timedelta
d = (date.today()+timedelta(days=8)).isoformat()
print('imminent date', d)
# A: wrapped dueDate
with_plant('apps/rn/src/utils/format.test.ts', """
export const __d17a = {
  dueDate:
    '%s',
};
""" % d, [['npx','tsx','scripts/check-fixture-dates.ts']])
# B: variable-assigned fuse
with_plant('apps/rn/src/utils/format.test.ts', """
const __d17b = '%s';
export const __d17bObj = { dueDate: __d17b };
""" % d, [['npx','tsx','scripts/check-fixture-dates.ts']])
# C: on a CRLF file
with_plant('apps/rn/src/data/cloudBackupMessages.test.ts', """
export const __d17c = {
  dueDate:
    '%s',
};
""" % d, [['npx','tsx','scripts/check-fixture-dates.ts']])
