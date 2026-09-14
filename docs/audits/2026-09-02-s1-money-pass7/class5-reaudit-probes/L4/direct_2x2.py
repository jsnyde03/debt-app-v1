# L4 probe: direct 2x2 measurements of check-finding-guards.ts, outside test:gate-plants.
# Why: a combined gate-plants plant that edits check-finding-guards.ts voids every finding-guards scenario's
# control (the real registry reds on its own proofs' anchors), so R5-2 and the projected parse are measured
# here against fixture registries only. Plants ONLY in C:/Users/Jason/audit-c5r1-L4.
# Fixtures use gitignored `scripts/__gate_plant_L4_*` names; tracked files are restored from byte backups.
import json, os, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')
WT = r'C:/Users/Jason/audit-c5r1-L4'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'direct-runs')
os.makedirs(OUT, exist_ok=True)
ENV = dict(os.environ, NODE_OPTIONS='--max-old-space-size=1536', FORCE_COLOR='0')
FG = os.path.join(WT, 'scripts/check-finding-guards.ts')
TARGET = os.path.join(WT, 'scripts/__fixtures__/authoring-plant-target.md')

R52_FIND = b"const waived = lenders.some((l) => namesIt(note, l) || namesIt(note, l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));"
R52_REPL = b"const waived = lenders.some((l) => note.includes(l) || note.includes(l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));"
PARSE_FIND = b"    const path = line.slice(3).trim();"
PARSE_REPL = b"    const path = line.slice(4).trim();"

def w(rel, text):
    with open(os.path.join(WT, rel), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(text)

def gate(args, tag):
    p = subprocess.run('npx tsx scripts/check-finding-guards.ts ' + args, cwd=WT, shell=True, capture_output=True, env=ENV)
    out = (p.stdout + p.stderr).decode('utf-8', errors='replace')
    open(os.path.join(OUT, tag + '.txt'), 'w', encoding='utf-8').write(f'exit={p.returncode}\n{out}')
    return p.returncode, out

def boundary_fixture(note):
    w('scripts/__gate_plant_L4_boundary__.ts', "export const boundaryLender = 'only the lender may survive';\nexport const boundaryBorrower = 7;\n")
    reg = {
        'S1-CLASS4-A3-1': {'what': 'lender; short form A3-1', 'file': 'scripts/__gate_plant_L4_boundary__.ts',
                           'token': "export const boundaryLender = 'only the lender may survive';"},
        'PLANT-L4-BORROWER': {'what': 'borrower', 'file': 'scripts/__gate_plant_L4_boundary__.ts', 'token': 'export const boundaryBorrower = 7;',
                              'proof': {'unfix': [{'at': 'scripts/__gate_plant_L4_boundary__.ts', 'find': 'export const boundaryBorrower = 7;', 'replace': 'x'}],
                                        'run': 'lint:finding-guards', 'expect': 'only the lender may survive', 'proofNote': note}},
    }
    w('scripts/__gate_plant_L4_boundary_registry__.json', json.dumps(reg, indent=2) + '\n')

def projected_fixture():
    w('scripts/__gate_plant_L4_guard__.ts', ''.join(f'check(plantedL4Projected{i});\n' for i in range(1, 10)))
    reg = {}
    for i in range(1, 10):
        reg[f'PLANT-L4-PROJECTED-{i}'] = {
            'what': 'a proven guard whose proof target has an uncommitted change', 'file': 'scripts/__gate_plant_L4_guard__.ts',
            'token': f'check(plantedL4Projected{i});',
            'proof': {'unfix': [{'at': 'scripts/__fixtures__/authoring-plant-target.md', 'find': '# The tracked file `test:gate-plants` edits', 'replace': '# planted'}],
                      'run': 'lint:finding-guards', 'measured': '2026-09-14', 'sha': 'HEAD'}}
    w('scripts/__gate_plant_L4_projreg__.json', json.dumps(reg, indent=2) + '\n')

fg_backup = open(FG, 'rb').read()
target_backup = open(TARGET, 'rb').read()
fixtures = ['scripts/__gate_plant_L4_boundary__.ts', 'scripts/__gate_plant_L4_boundary_registry__.json',
            'scripts/__gate_plant_L4_guard__.ts', 'scripts/__gate_plant_L4_projreg__.json']
rows = []
try:
    # ---- R5-2: which notes waive a borrow, under the word-boundary matcher and under the substring revert ----
    for code in ('pin', 'reverted'):
        open(FG, 'wb').write(fg_backup if code == 'pin' else fg_backup.replace(R52_FIND, R52_REPL))
        if code == 'reverted':
            assert open(FG, 'rb').read() != fg_backup and fg_backup.count(R52_FIND) == 1, 'R5-2 plant did not apply'
        for label, note in (('longer-sibling A3-14', "shares A3-14's red"), ('the lender A3-1', "shares A3-1's red")):
            boundary_fixture(note)
            rc, out = gate('--registry=scripts/__gate_plant_L4_boundary_registry__.json', f'r52.{code}.{label.split()[0]}')
            rows.append(f'R5-2  code={code:8s} note names {label:22s} exit={rc} NEIGHBOUR-refusal={"PRINTED" if "NEIGHBOUR" in out else "absent"}')
    open(FG, 'wb').write(fg_backup)
    # ---- --projected: does the porcelain parse still see a dirty tracked target? ----
    projected_fixture()
    for code in ('pin', 'slice4'):
        open(FG, 'wb').write(fg_backup if code == 'pin' else fg_backup.replace(PARSE_FIND, PARSE_REPL))
        if code == 'slice4':
            crlf_find = PARSE_FIND + b'\r\n'
            assert fg_backup.count(PARSE_FIND) == 1 and open(FG, 'rb').read() != fg_backup, 'parse plant did not apply'
        for dirty in ('clean', 'dirty'):
            open(TARGET, 'wb').write(target_backup if dirty == 'clean' else target_backup + b'\n[L4 probe: uncommitted change]\n')
            rc, out = gate('--registry=scripts/__gate_plant_L4_projreg__.json --projected', f'proj.{code}.{dirty}')
            rows.append(f'PROJ  code={code:8s} target={dirty:5s} exit={rc} "as if committed"={"PRINTED" if "as if committed" in out else "absent"} projected-lines={out.count("projected: PLANT-L4")}')
            open(TARGET, 'wb').write(target_backup)
finally:
    open(FG, 'wb').write(fg_backup)
    open(TARGET, 'wb').write(target_backup)
    for rel in fixtures:
        try:
            os.remove(os.path.join(WT, rel))
        except FileNotFoundError:
            pass
ok = open(FG, 'rb').read() == fg_backup and open(TARGET, 'rb').read() == target_backup
st = subprocess.run('git status --porcelain --untracked-files=all', cwd=WT, shell=True, capture_output=True).stdout.decode().strip()
for r in rows:
    print(r)
print('restore byte-verified:', ok, '| fixtures left:', [f for f in fixtures if os.path.exists(os.path.join(WT, f))], '| git status:', st or 'clean')
