from plant import *
Q = chr(39) + chr(92) + chr(34)   # '\"  -> used inside regex char classes as ['"]
cases = [
 ('check-sandbox-writes.ts', 'scripts/check-sandbox-writes.ts',
  r"/^\s*import\s*(?:\{[^}]*\bappStore\b[^}]*\}|\*\s*as\s+\w+)\s*from\s*['" + chr(34) + r"][^'" + chr(34) + r"]*appStore['" + chr(34) + r"]/gm",
  r"/^[ \t]*import[ \t]*(?:\{[^}\n]*\bappStore\b[^}\n]*\}|\*[ \t]*as[ \t]+\w+)[ \t]*from[ \t]*['" + chr(34) + r"][^'" + chr(34) + r"]*appStore['" + chr(34) + r"]/gm"),
 ('check-fixture-dates.ts', 'scripts/check-fixture-dates.ts',
  r"/([A-Za-z_]*(?:Date|At|AsOf))\s*(?::|(?<![=!<>])=)\s*$/",
  r"/([A-Za-z_]*(?:Date|At|AsOf))[ \t]*(?::|(?<![=!<>])=)[ \t]*$/"),
 ('check-local-dates.ts', 'scripts/check-local-dates.ts',
  r"toISOString\(\)\s*\.\s*(slice|substring|substr)\s*\(",
  r"toISOString\(\)[ \t]*\.[ \t]*(slice|substring|substr)[ \t]*\("),
 ('check-store-id-writes.ts', 'scripts/check-store-id-writes.ts',
  "    const statement = code.slice(start, end);",
  "    const __ls = code.lastIndexOf('" + chr(92) + "n', m.index) + 1;\n"
  "    const __le = code.indexOf('" + chr(92) + "n', m.index);\n"
  "    const statement = code.slice(__ls, __le === -1 ? code.length : __le);"),
]
for gate_name, path, old, new in cases:
    with Plant(path) as p:
        p.replace(old, new)
        rc, out = run('npx', 'tsx', 'scripts/test-wrap-escapes.ts')
        print(f'=== UN-FIX {gate_name}  wrap-escapes EXIT={rc}')
        for l in out.splitlines():
            if 'wrapped-plant' in l or 'wrap-escapes:' in l:
                print('   ', l.strip())
        rc2, out2 = gate(gate_name[:-3])
        print(f'    [un-fixed gate alone EXIT={rc2}] ' + (out2.strip().splitlines() or [''])[-1][:150])
