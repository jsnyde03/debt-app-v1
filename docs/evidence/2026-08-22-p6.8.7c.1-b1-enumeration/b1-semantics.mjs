const cases = ['1,200', 'abc', '', ' ', 'Infinity', '-5', '0', '1e5', '$1200', '1 200', '1.200', '12.5'];
console.log('raw'.padEnd(10), 'Number()'.padEnd(12), 'old-guard-passes'.padEnd(18), 'new-guard-passes');
for (const raw of cases) {
  const n = Number(raw);
  const oldPasses = !(!raw || n <= 0);
  const newPasses = raw.trim() !== '' && Number.isFinite(n) && n > 0;
  console.log(JSON.stringify(raw).padEnd(10), String(n).padEnd(12), String(oldPasses).padEnd(18), String(newPasses));
}
console.log('\nJSON.stringify({b:NaN}) =', JSON.stringify({ b: NaN }));
console.log('JSON.stringify({b:Infinity}) =', JSON.stringify({ b: Infinity }));
console.log('Number.isInteger(NaN) =', Number.isInteger(NaN));
console.log('NaN > NaN =', NaN > NaN);
console.log('normalize("$1,200") =', Number('$1,200'.replace(/[,\s$]/g, '')));
