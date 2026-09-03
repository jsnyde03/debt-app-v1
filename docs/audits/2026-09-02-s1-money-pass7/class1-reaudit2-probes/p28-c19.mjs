// Replica of unreadInputsCopy.test.ts's codeLinesOnly (verbatim), tested on spellings a reader
// cannot tell apart on screen.
const NEWLINE = String.fromCharCode(10);
function codeLinesOnly(source) {
  return source
    .split(NEWLINE)
    .filter((line) => { const t = line.trimStart(); return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')); })
    .map((line) => line.trim())
    .join(' ')
    .replace(/['"`]\s*\+\s*['"`]/g, '');
}
const cases = {
  'PLAIN (the fixture)':            'const a = `... incomplete — set it again above.`;',
  'WRAPPED (C1-9 fixture)':         ['const a = `... incomplete — set it again', '      above.`;'].join('\n'),
  'CONCAT (R12 fixture)':           'const a = `... incomplete — set it again ` + `above.`;',
  "JSX {' '} separator":            "<Text>... incomplete — set it again{' '}above.</Text>",
  "template ${' '} separator":      "const a = `... incomplete — set it again${' '}above.`;",
  'concat via a SPACE const':       "const a = `... incomplete — set it again` + SP + `above.`;",
  'concat, + at line start':        ['const a = `... incomplete — set it again`', '  + `above.`;'].join('\n'),
  'wrapped INSIDE the two words':   ['const a = `... incomplete — set it aga', 'in above.`;'].join('\n'),
  'JSX children on two elements':   "<Text>... set it again</Text>\n<Text> above.</Text>",
};
for (const [k, v] of Object.entries(cases)) {
  const seen = codeLinesOnly(v).includes('again above');
  console.log(`${seen ? 'SEEN   ' : 'MISSED '} ${k}`);
}
