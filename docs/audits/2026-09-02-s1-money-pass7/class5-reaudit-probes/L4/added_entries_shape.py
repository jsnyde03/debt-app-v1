# L4 probe: shape checks on the 28 registry entries c7df99c2..ea3f5e0e added, plus R5-2 matcher fire-counts.
# Reads the PIN worktree (C:/Users/Jason/audit-c5r1-L4). Read-only.
import json, re, subprocess, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
WT = r'C:/Users/Jason/audit-c5r1-L4'
REPO = r'C:/Users/Jason/debt-app-v1'
base = json.loads(subprocess.run(['git','-C',REPO,'show','c7df99c2:scripts/finding-guards.json'],capture_output=True).stdout.decode('utf-8'))
reg = json.load(open(WT+'/scripts/finding-guards.json',encoding='utf-8'))
scripts = json.load(open(WT+'/package.json',encoding='utf-8'))['scripts']
added = [k for k in reg if k not in base]
print('ids', len(reg), 'added', len(added))
for k in added:
    e = reg[k]; p = e.get('proof') or {}
    tok = e.get('token',''); f = e.get('file')
    txt = open(WT+'/'+f, encoding='utf-8').read() if f else ''
    issues = []
    if '${' in tok: issues.append('token contains ${')
    idx = txt.find(tok)
    if idx < 0:
        # try whitespace-normalised
        issues.append('token not found verbatim')
    else:
        after = txt[idx+len(tok):idx+len(tok)+2]
        if after == '${': issues.append('token stops immediately before ${')
        if txt.count(tok) > 1: issues.append(f'token occurs {txt.count(tok)}x')
    if p.get('run') is not None and p['run'] not in scripts: issues.append(f'run {p["run"]!r} not an npm script')
    if p.get('cmd') is not None and not (isinstance(p['cmd'], list) and all(isinstance(x,str) for x in p['cmd'])): issues.append('cmd not argv list')
    if p.get('run') and p.get('cmd'): issues.append('both run and cmd')
    exp = p.get('expect')
    if exp is not None and exp not in tok:
        lenders = [o for o,oe in reg.items() if o!=k and exp in (oe.get('token') or '')]
        if lenders: issues.append(f'BORROW expect in {lenders} note={p.get("proofNote")!r}')
        # does the expect string occur in the file (test label) at all?
        if exp not in txt: issues.append('expect not present verbatim in guard file')
    for u in p.get('unfix',[]):
        t = open(WT+'/'+u['at'],encoding='utf-8',newline='').read()
        c = t.replace('\r\n','\n').count(u['find'].replace('\r\n','\n'))
        if c != 1: issues.append(f'anchor {c}x in {u["at"]}')
    print(f'{k}: {"OK" if not issues else issues} | token={tok[:90]!r} | expect={str(exp)[:90]!r}')

print('\n== R5-2 matcher over the pin registry')
bad = [k for k in reg if not re.fullmatch(r'[A-Za-z0-9-]+', k)]
short = lambda l: re.sub(r'^CLASS4-','',re.sub(r'^S1[A-Z0-9]*-','',l))
print('ids outside alphabet:', bad, '| empty short forms:', [k for k in reg if short(k)==''])
def namesIt(n, needle): return re.search(r'(^|[^A-Za-z0-9-])'+needle+r'([^A-Za-z0-9-]|$)', n) is not None
branch=0; newly=[]; subst_waived=[]; bound_waived=[]
for k,e in reg.items():
    p=e.get('proof'); tok=e.get('token')
    if not p or e.get('unguarded') or not tok: continue
    exp=p.get('expect')
    if exp is None or exp in tok: continue
    lenders=[o for o,oe in reg.items() if o!=k and exp in (oe.get('token') or '')]
    if not lenders: continue
    branch+=1; note=p.get('proofNote') or ''
    ws = any((l in note) or (short(l) in note) for l in lenders)
    wb = any(namesIt(note,l) or namesIt(note,short(l)) for l in lenders)
    print(f'  branch: {k} lenders={lenders} substrWaive={ws} boundaryWaive={wb}')
    if ws and not wb: newly.append(k)
print('entered branch', branch, 'newly refused by boundary', newly)
groups = collections.defaultdict(list)
for k in reg: groups[short(k)].append(k)
coll = {s:v for s,v in groups.items() if len(v)>1}
print('short forms shared by >1 full id (a note naming one waives the other):', len(coll))
for s,v in list(coll.items())[:40]: print('  ', s, v)
# prefix collisions (substring) count at pin
shorts = sorted(set(short(k) for k in reg))
pref = [s for s in shorts if any(o!=s and o.startswith(s) for o in shorts)]
print('short ids that are a prefix of another short id:', len(pref), 'of', len(shorts))
