from _boot import *
P='apps/rn/src/components/entities/DebtSheet.tsx'
orig = read_bytes(P); s = orig.decode('utf-8')
NL = '\r\n' if s.count('\r\n') else '\n'
anchor = "  const [apr, setApr] = useState(seed?.apr != null ? String(seed.apr) : '');" + NL
repl = ("  const [apr, setApr] = useState(" + NL +
        "    // an editing debt reaches this through `seed`, never through the `editing` prop" + NL +
        "    seed?.apr != null ? String(seed.apr) : ''," + NL +
        "  );" + NL)
try:
    assert anchor in s
    open(P,'wb').write(s.replace(anchor, repl, 1).encode('utf-8'))
    print('### R11 false-positive half: CORRECT code, wrapped, with an explanatory comment inside')
    c,out = run(['npm','run','test:app'])
    print('   EXIT=%d' % c)
    for l in out.splitlines():
        t=l.strip()
        if 'seeds from' in t or 'bill → debt prefill' in t or t.startswith('❌'): print('     ', t[:170])
finally:
    print('RESTORE_OK=', restore(P, orig))
