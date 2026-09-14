# L4 probe: diff scripts/finding-guards.json between class-5 base and pin. Read-only (git show).
import json, subprocess, sys, csv, io
sys.stdout.reconfigure(encoding='utf-8')
REPO = r'C:/Users/Jason/debt-app-v1'
BASE, PIN = 'c7df99c2', 'ea3f5e0e'
def load(sha):
    b = subprocess.run(['git','-C',REPO,'show',f'{sha}:scripts/finding-guards.json'],capture_output=True).stdout
    return json.loads(b.decode('utf-8'))
a, b = load(BASE), load(PIN)
added = [k for k in b if k not in a]
removed = [k for k in a if k not in b]
changed = [k for k in b if k in a and a[k] != b[k]]
print('base', len(a), 'pin', len(b), 'added', len(added), 'removed', len(removed), 'changed', len(changed))
lanes = {}
for row in csv.reader(io.open(REPO+'/docs/audits/2026-09-02-s1-money-pass7/CLASS5-REAUDIT-LANES.tsv',encoding='utf-8'), delimiter='\t'):
    if row[0]=='lane': continue
    lanes[row[3]] = row[0]
def summ(k, e):
    p = e.get('proof') or {}
    ats = sorted({u.get('at') for u in p.get('unfix',[])})
    return f"{k} | file={e.get('file')} | run={p.get('run')} cmd={p.get('cmd')} | expect={p.get('expect')!r} | sha={p.get('sha')} measured={p.get('measured')} | at={ats} | atLanes={[lanes.get(x,'-') for x in ats]}"
print('\n== ADDED'); [print(summ(k,b[k])) for k in added]
print('\n== REMOVED'); [print(k) for k in removed]
print('\n== CHANGED (fields)')
for k in changed:
    diffs = [f for f in set(a[k])|set(b[k]) if a[k].get(f)!=b[k].get(f)]
    pa, pb = a[k].get('proof') or {}, b[k].get('proof') or {}
    pd = [f for f in set(pa)|set(pb) if pa.get(f)!=pb.get(f)] if 'proof' in diffs else []
    print(k, diffs, pd)
print('\n== pin entries whose unfix.at is in the lane manifest (any lane)')
for k,e in b.items():
    p = e.get('proof') or {}
    ats = sorted({u.get('at') for u in p.get('unfix',[])})
    hit = [(x,lanes[x]) for x in ats if x in lanes]
    if hit: print(k, hit, 'run=',p.get('run'), 'cmd=', p.get('cmd'))
