import { router } from 'expo-router';
import { useEffect } from 'react';

import { CashRunwayChart } from '@/components/plan/CashRunwayChart';
import { GuardianScorecard } from '@/components/plan/GuardianScorecard';
import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectCalibrationScore } from '@/store/guardianSelectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { effectivePaycheckBuffer, selectWaterFillPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { announce } from '@/utils/a11y';

/** How many pay cycles the runway plots (the water-fill looks further, but the chart stays legible). */
const RUNWAY_CYCLES = 6;

/**
 * §2.6 drill-down (reworked 2.4.9.6R). The premium Guardian detail — NOT a re-show of Progress's free
 * cash-flow bars. It leads with the Cash Runway: a real chart of the un-clamped projected cushion vs the
 * user's floor line, with below-floor crunches the free bars can't show and a tap-to-expand per-cycle
 * plan — then the Guardian's honest accuracy record. Nothing borrowed from the free tier.
 */
export default function CushionForecastScreen() {
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  const engineStore = withProjectedBalances(store, isPremium);
  const cycles = selectCashTimeline(engineStore, RUNWAY_CYCLES);
  const plan = selectWaterFillPlan(engineStore);
  const floor = effectivePaycheckBuffer(engineStore);

  useEffect(() => {
    announce('Cushion forecast');
  }, []);

  return (
    <Screen title="Your cushion forecast" onBack={() => router.back()}>
      {isPremium ? (
        <>
          <CashRunwayChart cycles={cycles} plan={plan} floor={floor} />
          <GuardianScorecard score={selectCalibrationScore(store)} />
        </>
      ) : (
        // T3B (audit L5-8) — the body was two `isPremium ? … : null` lines and nothing else, so a free
        // read produced a title, a back chevron and empty space: the app's only screen that could render
        // completely DEAD, against its own rule that nothing renders dead. Today's entry point is
        // premium-gated, so an ordinary free user cannot arrive — but a lapsed or unresolved entitlement
        // while the route is open, the QA toggle, and a deep link all can, and "cannot normally be
        // reached" is not a reason to render nothing when reached.
        <EmptyState
          icon="insights"
          title="Your cushion forecast is part of Premium"
          body="See your cushion projected across the next six paydays, where it dips below your line, and how accurate your Guardian has been."
          cta="See Premium"
          onCta={() => router.push('/paywall?from=cushion-forecast')}
          ctaTestID="cushion-forecast-premium-cta"
        />
      )}
    </Screen>
  );
}
