/** Preload: pin `new Date()` / `Date.now()` to $FAKE_TODAY. Nothing else changes. */
const t = process.env.FAKE_TODAY;
if (t) {
  const [y, m, d] = t.split("-").map(Number);
  const Real = Date;
  const FIXED = new Real(y, m - 1, d, 12, 0, 0).getTime();
  class Faked extends Real {
    constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
    static now() { return FIXED; }
  }
  globalThis.Date = Faked;
}
