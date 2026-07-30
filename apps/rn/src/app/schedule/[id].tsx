import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { AmortizationView } from '@/components/entities/AmortizationView';
import { Screen } from '@/components/screen';
import { announce } from '@/utils/a11y';

/**
 * 3.7.A0 — a single debt's payoff schedule, as a REAL ROUTE.
 *
 * This replaces a sheet launched from inside the debt edit sheet, which never worked on device: a
 * sheet-from-a-sheet is either a nested Modal (iOS never presents it) or an absolute overlay rendered
 * as a SIBLING of the presented Modal (so it renders behind it). Both passed on web, where it's all one
 * DOM tree — which is exactly why the web e2e stayed green through two failed fixes.
 *
 * As a pushed route it gets the native back gesture and a real header for free, is deep-linkable, and
 * cannot be occluded by whatever presented it. The iPad path deliberately does NOT come here — Money's
 * master-detail renders `AmortizationPane` in the detail pane instead, so a push can't cover the split.
 */
export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = typeof id === 'string' && id ? id : null;

  useEffect(() => {
    announce('Payoff schedule');
  }, []);

  return (
    <Screen title="Payoff schedule" onBack={() => router.back()}>
      <AmortizationView debtId={debtId} />
    </Screen>
  );
}
