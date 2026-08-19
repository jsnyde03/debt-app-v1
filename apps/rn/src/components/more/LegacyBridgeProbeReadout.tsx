import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { readLegacyStores } from '@/data/legacyBridge/readLegacyStores';
import { summariseLegacyRead } from '@/data/legacyBridge/report';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 5.1b.3 — the legacy-read probe, rendered where a Maestro run can read it.
 *
 * Same shape and the same reasoning as `CoachMarkProbeReadout` (4.1.4c): a rendered node is in the view
 * hierarchy Maestro already dumps on every flow, it can be asserted on, and it shows up in a screenshot
 * a human can read without downloading anything — whereas a `console.log` in a Release build survives
 * only *probably*, and "probably" is what cost that defect five cycles.
 *
 * ⛔ **This probe answers the one question 5.1 exists to ask:** after an in-place upgrade from v1.6, can
 * this binary find and read the WKWebView `localStorage` it inherited? Everything else in the bridge was
 * settled off-device (5.1a's decode, 5.1b.2's walk); this is the part no amount of local testing can
 * establish, because it depends on where iOS actually put the files.
 *
 * ⚠️ **Read `truncated=` before believing `keys=0`.** `keys=0 truncated=no` means the container genuinely
 * held no v1.6 data — a clean install. `keys=0 truncated=yes` means the search gave up and the result is
 * a floor, not an answer. Those two are the same number and opposite findings, which is exactly why the
 * report carries the flag.
 *
 * Removed with `QA_TOOLS` at Phase 6 along with the rest of this section (`git grep QA_TOOLS`).
 */
export function LegacyBridgeProbeReadout() {
  const c = useAppColors();
  const [line, setLine] = useState('RUNNING');

  useEffect(() => {
    let cancelled = false;
    void readLegacyStores()
      .then((report) => {
        if (!cancelled) setLine(summariseLegacyRead(report));
      })
      // `readLegacyStores` is written not to throw, so this is the belt to that braces: a probe that
      // renders "RUNNING" forever would read as a hung app rather than as a failed read.
      .catch((error: unknown) => {
        if (!cancelled) setLine(`legacy-read: THREW ${String(error)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card style={styles.card}>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Legacy bridge probe (5.1b)</Text>
      <Text
        // The flow asserts on THIS id. It always renders something — "RUNNING" before the read resolves —
        // because an element that appears only on success makes a failed read indistinguishable from a
        // screen that never loaded.
        testID="legacy-bridge-probe"
        style={[textStyles.caption, styles.trace, { color: c.text.secondary }]}>
        {line}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xxs, marginTop: spacing.sm },
  // Monospace and unbounded, for the same reason the coach-mark trace is: a truncated readout can hide
  // the field that decides the verdict.
  trace: { fontFamily: 'Menlo', fontSize: 10, lineHeight: 14 },
});
