import { router } from 'expo-router';

import { Placeholder } from '@/components/placeholder';
import { Screen, Section } from '@/components/screen';

/**
 * The "More" hub (ratified IA EVOLVE) — replaces the old Settings gear, organized by purpose:
 * Data (actions/utilities), Preferences (real settings), About. Real rows land at B.7; iCloud
 * backup + export/import wire in at Phase C / B.8.
 */
export default function MoreScreen() {
  return (
    <Screen title="More" onBack={() => router.back()}>
      <Section title="Data">
        <Placeholder label="Data" note="Export · Import · iCloud backup · Reset — B.7 / Phase C." />
      </Section>
      <Section title="Preferences">
        <Placeholder label="Preferences" note="Appearance · reminders · plan settings — B.7." />
      </Section>
      <Section title="About">
        <Placeholder label="About" note="About · privacy · version — B.7." />
      </Section>
    </Screen>
  );
}
