from plant import *

cases = [
 ('check-amount-collapse.ts', 'scripts/check-amount-collapse.ts',
  r"\([^;{}]*?\)\s*\?\?\s*0/g", r"\([^\n]*?\)\s*\?\?\s*0/g"),
 ('check-rounding.ts', 'scripts/check-rounding.ts',
  r"Math\.round\([^;{}]*?\*", r"Math\.round\([^\n]*?\*"),
 ('check-sandbox-writes.ts', 'scripts/check-sandbox-writes.ts',
  r"/^\s*import\s*(?:\{[^}]*\bappStore\b[^}]*\}|\*\s*as\s+\w+)\s*from\s*['\"][^'\"]*appStore['\"]/gm",
  r"/^[ \t]*import[ \t]*(?:\{[^}\n]*\bappStore\b[^}\n]*\}|\*[ \t]*as[ \t]+\w+)[ \t]*from[ \t]*['\"][^'\"]*appStore['\"]/gm"),
 ('check-fixture-dates.ts', 'scripts/check-fixture-dates.ts',
  r"/([A-Za-z_]*(?:Date|At|AsOf))\s*(?::|(?<![=!<>])=)\s*$/",
  r"/([A-Za-z_]*(?:Date|At|AsOf))[ \t]*(?::|(?<![=!<>])=)[ \t]*$/"),
 ('check-local-dates.ts', 'scripts/check-local-dates.ts',
  r"toISOString\(\)\s*\.\s*(slice|substring|substr)\s*\(",
  r"toISOString\(\)[ \t]*\.[ \t]*(slice|substring|substr)[ \t]*\("),
 ('check-store-id-writes.ts', 'scripts/check-store-id-writes.ts',
  "    const statement = code.slice(start, end);",
  "    const __ls = code.lastIndexOf(" + repr(chr(39)+chr(92)+'n'+chr(39)) [1:-1].join(['',''])  + ", m.index) + 1;"),
]
# fix the last replacement properly
cases[-1] = ('check-store-id-writes.ts', 'scripts/check-store-id-writes.ts',
  "    const statement = code.slice(start, end);",
  "    const __ls = code.lastIndexOf('" + chr(92) + "n', m.index) + 1;\n"
  "    const __le = code.indexOf('" + chr(92) + "n', m.index);\n"
  "    const statement = code.slice(__ls, __le === -1 ? code.length : __le);")

for gate_name, path, old, new in cases:
    with Plant(path) as p:
        p.replace(old, new)
        rc, out = run('npx', 'tsx', 'scripts/test-wrap-escapes.ts')
        print(f'=== UN-FIX {gate_name}  wrap-escapes EXIT={rc}')
        for l in out.splitlines():
            if 'wrapped-plant' in l or 'wrap-escapes:' in l:
                print('   ', l.strip())
