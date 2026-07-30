import { createAudioPlayer } from 'expo-audio';

/**
 * VIS-6 — the opt-in debt-free chime (native). Played from the finale ONLY when the user has enabled it
 * (`prefs.debtFreeSoundEnabled`, default off). Best-effort + fully guarded: a playback failure must never
 * affect the celebration. The bundled `debt-free-chime.wav` is a synthesized PLACEHOLDER (a soft C-major
 * arpeggio) — swap for a mastered asset at Phase 6. Web is a no-op (`debtFreeSound.web.ts`) so neither
 * expo-audio nor the wav enters the web bundle.
 */
export function playDebtFreeSound(): void {
  try {
    const player = createAudioPlayer(require('../../assets/sounds/debt-free-chime.wav'));
    player.volume = 0.7;
    player.play();
    // Free the player after it finishes (~1.35s + headroom).
    setTimeout(() => {
      try {
        player.release();
      } catch {
        /* already released */
      }
    }, 3000);
  } catch {
    /* best-effort — never let a sound error surface into the celebration */
  }
}
