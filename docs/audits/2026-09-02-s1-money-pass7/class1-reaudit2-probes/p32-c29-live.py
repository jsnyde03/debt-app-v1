from _boot import *
P='apps/rn/src/components/entities/DebtSheet.tsx'
orig = read_bytes(P)
s = orig.decode('utf-8')
NL = '\r\n' if s.count('\r\n') else '\n'
anchor = "  const [apr, setApr] = useState(seed?.apr != null ? String(seed.apr) : '');" + NL
assert anchor in s, 'anchor'
cases = {
 'CONTROL (C2-9 ternary)': "  const [apr, setApr] = useState(editing ? String(editing.apr) : '');" + NL,
 'CONTROL (R11 hoisted const)': "  const __init = editing ? String(editing.apr) : '';" + NL + "  const [apr, setApr] = useState(__init);" + NL,
 'PLANT destructured from editing': "  const { apr: __edApr } = editing ?? ({} as { apr?: number });" + NL + "  const [apr, setApr] = useState(__edApr != null ? String(__edApr) : '');" + NL,
}
for label, repl in cases.items():
    try:
        open(P,'wb').write(s.replace(anchor, repl, 1).encode('utf-8'))
        print('###', label)
        c,o = run(['npm','run','test:app'])
        for l in o.splitlines():
            t=l.strip()
            if 'seeds from' in t or 'bill → debt prefill' in t or t.startswith('❌') or 'ALL PASSED' in t:
                print('   ', t[:160])
        print('    EXIT=', c)
    finally:
        print('    RESTORE_OK=', restore(P, orig))
