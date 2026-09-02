/**
 * The ONE owner of "when was this backup made", as a person reads it.
 *
 * ⚠️ **`@core/utils/localDate` deliberately does NOT own this.** Its job is `YYYY-MM-DD` wall-calendar
 * dates, and routing an instant through it would throw away the time — which is the informative half of
 * *"last backed up"*: a backup from this morning and one from three weeks ago are the same calendar
 * question only if you never look at the clock.
 *
 * ⛔ It lives here rather than beside one sheet because **two doors ask the same question and only one of
 * them was answering it.** [P6.8.9.7.11.12 · B-J2-2] The iCloud sheet formatted and showed its timestamp;
 * the file importer dropped the value before it could reach a renderer, so the screen standing in front of
 * an irreversible overwrite showed entity counts alone.
 */
/**
 * ⛔ **S1.13.7.11 [pass-6 blocker `B3-2`] — RETURNS `null` FOR AN INSTANT IT CANNOT READ, AND EVERY
 * CALLER OMITS ITS CLAUSE.** This used to return `'recently'`, which reads naturally inside *"Last backed
 * up ___"* and is safe for the iCloud sheet's own timestamp — a value this app wrote, which cannot be
 * arbitrary. ⚡ **It became unsafe the moment `readBackup` reused it for a value that arrives from a file
 * the user found somewhere:** an unparseable `exportedAt` rendered as *"Saved recently."* one line above
 * *Replace my data · It can't be undone*, so a backup from 2019 and one from an hour ago produced the
 * same sentence — the exact thing plumbing `exportedAt` through existed to prevent. `readBackup.ts`
 * already states the rule for the ABSENT case: *"inventing one would be a claim about a file nothing
 * knows anything about, on the screen where being wrong is least recoverable."* Unreadable is that case.
 *
 * ⛔ **THE CHECK IS ON THE SHAPE OF THE STRING, NOT ON WHETHER `Date` ACCEPTED IT** — and that is the
 * half a NaN guard could never cover. `new Date("0")` is a **valid** Date (1 Jan 2000), so the old guard
 * did not fire at all and the screen printed a specific, confident date the file never carried. A leading
 * `YYYY-MM-DD` is required before the value is parsed, which is what every writer of this field emits
 * (`new Date().toISOString()`) and what a v1.6 file carries.
 */
const ISO_DATE_HEAD = /^\d{4}-\d{2}-\d{2}(?:[T ]|$)/;

export function formatBackupTime(iso: string): string | null {
  if (!ISO_DATE_HEAD.test(iso)) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return `${at.toLocaleDateString()} at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}
