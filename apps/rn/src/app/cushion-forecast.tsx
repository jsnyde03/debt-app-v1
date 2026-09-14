import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CashRunwayChart } from '@/components/plan/CashRunwayChart';
import { unreadInputsFix } from '@/components/plan/dataRepairsCopy';
import { GuardianScorecard } from '@/components/plan/GuardianScorecard';
import { Screen } from '@/components/screen';
import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppColors } from '@/hooks/use-app-colors';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectCalibrationScore } from '@/store/guardianSelectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { effectivePaycheckBuffer, selectPrefundedHeld } from '@/store/selectors';
import { mayClaim, repairsPoisoning } from '@/store/trustSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { announce, groupLabel } from '@/utils/a11y';

/** How many pay cycles the runway plots (the water-fill looks further, but the chart stays legible). */
const RUNWAY_CYCLES = 6;

/** ⛔ [pass-7 `C3-11`] The headline the runway wears in place of a forecast it cannot draw. */
const UNREAD_FORECAST_TITLE = 'Your forecast is on hold';

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
  // ⛔ [.5.7.4b.2] What this paycheck HOLDS for a crunch ahead — the allocation row, not the water-fill's request.
  const holdNow = selectPrefundedHeld(engineStore);
  const floor = effectivePaycheckBuffer(engineStore);
  /**
   * ⛔ **[pass-7 `C3-11` · `.5.4b`] THE RUNWAY IS A PLAN SOLVED FORWARD, AND THIS SCREEN ASKED NOTHING.**
   *
   * Measured: an unread minimum payment turned three at-risk cycles into six clear ones and moved the plotted
   * cushion $1,100 in the safe direction — on the one screen whose purpose is showing the dips — while Today
   * refused the same plan on the same store.
   *
   * ⚠️ **`'solved-projection'`, measured exact against THIS screen's own figures**, not only against the payoff
   * family it belongs to: a lost APR or saved amount reaches the runway only when a debt clears or a goal
   * fills inside its six cycles, and the per-surface assertion in `trustSelectors.test.ts` carries both shapes.
   *
   * ⭐ **The scorecard stays.** It grades stored past reads against what happened; withholding it over a lost
   * minimum would hide a true record.
   */
  const mayStateForecast = mayClaim(store, 'solved-projection');

  useEffect(() => {
    announce('Cushion forecast');
  }, []);

  return (
    <Screen title="Your cushion forecast" onBack={() => router.back()}>
      {isPremium ? (
        <>
          {mayStateForecast ? (
            <CashRunwayChart cycles={cycles} holdNow={holdNow} floor={floor} />
          ) : (
            <ForecastUnread fix={unreadInputsFix(repairsPoisoning(store, 'solved-projection'), 'and your forecast comes back')} />
          )}
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

/**
 * The runway's honest state when an amount it is solved from could not be read. ⚠️ It names the STATE and the
 * figure to set rather than going blank — a withheld chart with nothing in its place reads as a broken screen,
 * and a broken screen is the one this route was already fixed for once (T3B, above).
 */
function ForecastUnread({ fix }: { fix: string }) {
  const c = useAppColors();
  const body = `An amount your plan runs on could not be read, so I can’t chart where your cushion is heading — ${fix}.`;
  return (
    <Card testID="cushion-forecast-unread">
      <View {...groupLabel(undefined, 'Cushion forecast', UNREAD_FORECAST_TITLE, body)}>
        <View style={styles.head}>
          <AppIcon name="update" size={22} color={c.text.tertiary} />
          <Text style={[textStyles.title3, styles.title, { color: c.text.tertiary }]}>{UNREAD_FORECAST_TITLE}</Text>
        </View>
        <Text style={[textStyles.subhead, styles.detail, { color: c.accent.warning }]}>{body}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
  detail: { marginTop: spacing.sm },
});
