from _boot import *
P='apps/rn/src/components/plan/RequiredActionsCard.tsx'
orig = read_bytes(P)
s = orig.decode('utf-8')
tgt = "                ? `An amount this paycheck has to cover could not be read, so this list is incomplete — ${unreadFix}.`\n"
assert tgt in s, 'anchor'
cases = {
 'CONTROL wrapped (C1-9, the fixed case)':
   "                ? `An amount this paycheck has to cover could not be read, so set it again\n                  above. ${unreadFix}.`\n",
 "PLANT  {' '} JSX separator (R12 named it)":
   "                ? <>{`An amount this paycheck has to cover could not be read, so set it again`}{' '}{`above. ${unreadFix}.`}</>\n",
}
for label, repl in cases.items():
    try:
        open(P,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
        print('###', label)
        c,o = run(['npm','run','test:app'])
        hit = [l.strip()[:150] for l in o.splitlines() if 'again' in l or 'unread-inputs copy' in l or 'ALL PASSED' in l or 'FAIL' in l]
        for l in hit[:6]: print('   ', l)
        print('    EXIT=', c)
    finally:
        print('    RESTORE_OK=', restore(P, orig))
