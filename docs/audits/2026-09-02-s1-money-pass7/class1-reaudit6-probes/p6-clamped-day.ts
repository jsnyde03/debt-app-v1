/** Probe: CLAMPING_CALLEE (check-month-arithmetic.ts:186, V8's fix), both directions. */
const CLAMPING_CALLEE = /(?:^|[^\w$.])(?:Math\.min|[\w$]*clamp[\w$]*)$/i;

function clampedDay(day: string): boolean {
  const opens: number[] = [];
  for (let i = 0; i < day.length; i++) {
    if (day[i] === '(') opens.push(i);
    else if (day[i] === ')') opens.pop();
    else if (day.startsWith('getDate', i) && opens.length > 0) {
      if (CLAMPING_CALLEE.test(day.slice(0, opens[opens.length - 1]))) return true;
    }
  }
  return false;
}

const cases: [string, boolean][] = [
  // V8's own measured table — the regression control
  ['Math.min(d.getDate(), 28)', true],
  ['clampDay(d.getDate(), 28)', true],
  ['Math.max(1, d.getDate())', false],
  ['Number(d.getDate())', false],
  ['__id(d.getDate())', false],
  ['d.getDate()', false],
  ['(d.getDate())', false],
  // member / namespaced clamp helpers — REAL clamps
  ['dateUtils.clampDay(d.getDate(), 28)', true],
  ['this.clampDay(d.getDate(), 28)', true],
  ['DateMath.clampDay(d.getDate(), 28)', true],
  ['helpers.clamp(d.getDate(), 1, 28)', true],
  // whitespace between callee and paren — legal TS, a real clamp
  ['Math.min (d.getDate(), 28)', true],
  // nested-but-still-clamped
  ['Math.min(Number(d.getDate()), 28)', true],
  // /clamp/i looseness — NOT clamps
  ['unclampedDay(d.getDate())', false],
  ['isClamped(d.getDate())', false],
  ['assertNotClamped(d.getDate())', false],
];

for (const [day, wantClamped] of cases) {
  const got = clampedDay(day);
  const tag = got === wantClamped ? 'ok   ' : got ? 'FALSE-EXEMPT (blind)' : 'FALSE-ACCUSE (noisy)';
  console.log(`${tag.padEnd(22)} clamped=${String(got).padEnd(5)} want=${String(wantClamped).padEnd(5)} ${day}`);
}
