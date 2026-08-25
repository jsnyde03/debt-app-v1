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
export function formatBackupTime(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return 'recently';
  return `${at.toLocaleDateString()} at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}
