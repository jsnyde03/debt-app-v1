from _boot import *
P='apps/rn/src/components/plan/RequiredActionsCard.tsx'
orig = read_bytes(P)
s = orig.decode('utf-8')
tgt = "                ? `An amount this paycheck has to cover could not be read, so this list is incomplete — ${unreadFix}.`\n"
cases = {
 'CONTROL wrapped (C1-9)': "                ? `An amount this paycheck has to cover could not be read, so set it again\n                  above. ${unreadFix}.`\n",
 "PLANT {' '} JSX separator": "                ? <>{`An amount this paycheck has to cover could not be read, so set it again`}{' '}{`above. ${unreadFix}.`}</>\n",
}
for label, repl in cases.items():
    try:
        open(P,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
        print('###', label)
        c,o = run(['npm','run','test:app'])
        for l in o.splitlines():
            t=l.strip()
            if 'unread-inputs' in t or t.startswith('❌') or 'App-layer regression' in t or 'no refusal points' in t:
                print('   ', t[:170])
        print('    EXIT=', c)
    finally:
        print('    RESTORE_OK=', restore(P, orig))
