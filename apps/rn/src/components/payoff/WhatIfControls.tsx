import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Slider } from '@/components/ui/Slider';
import { useAppColors } from '@/hooks/use-app-colors';
import type { WhatIfResult } from '@/store/analysisSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const STEP = 25;

/** Round up past a value to a nice increment with a little headroom (so the thumb never pins at the end). */
function niceCeil(v: number): number {
  const inc = v <= 1000 ? 100 : v <= 5000 ? 500 : 1000;
  return Math.ceil((v * 1.12) / inc) * inc;
}

/** The mechanism, in one plain-language line: where the extra dollars actually go. */
function whereText(result: WhatIfResult): string | null {
  const paid = result.allocation.filter((a) => a.amount > 0);
  if (paid.length === 0) return null;
  const [first, second] = paid;
  if (first.isPaidOff && second) return `Pays off your ${first.debtName}, then hits ${second.debtName}`;
  return `Goes straight to your ${first.debtName}`;
}

/**
 * What-If controls — the extra-payment simulator folded INTO the projection card (no Card of its
 * own). The "+$X/mo" amount is directly EDITABLE (tap to type any amount — nobody can know what a
 * given person can afford, so the range is never artificially capped) and the slider below is a
 * quick-adjust whose max ADAPTS to what's typed. Dragging/typing bends the dashed green "with extra"
 * curve on the chart above; the outcome (date · $ saved · months sooner) lands in the chart's legend
 * row for that line — this tool just carries the control + where the money goes.
 * A free tool (the pull readout); the premium Guardian is the proactive push layer.
 */
export function WhatIfControls({
  result,
  extra,
  onExtraChange,
}: {
  result: WhatIfResult;
  extra: string;
  onExtraChange: (value: string) => void;
}) {
  const c = useAppColors();
  const value = Number(extra) || 0;
  const simulating = value > 0;
  const where = whereText(result);

  // The slider max adapts: floored at the plan-scaled suggestion, grown when a typed value exceeds it,
  // and held stable during a drag (drag never grows it, so the thumb→value mapping stays predictable).
  const [sliderMax, setSliderMax] = useState(result.sliderMax);
  useEffect(() => {
    setSliderMax((m) => Math.max(result.sliderMax, m));
  }, [result.sliderMax]);

  const onType = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    onExtraChange(clean);
    const v = Number(clean) || 0;
    if (v > sliderMax) setSliderMax(niceCeil(v));
    else if (v === 0) setSliderMax(result.sliderMax);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.readoutRow}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.readout, { color: simulating ? c.text.primary : c.text.tertiary }]}>+$</Text>
        <TextInput
          value={value ? String(value) : ''}
          onChangeText={onType}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={c.text.tertiary}
          selectTextOnFocus
          maxFontSizeMultiplier={1.3}
          accessibilityLabel="Extra monthly payment amount"
          style={[
            styles.readout,
            styles.readoutInput,
            { color: simulating ? c.text.primary : c.text.tertiary, borderBottomColor: c.border.control },
          ]}
        />
        <Text style={[textStyles.subhead, styles.per, { color: c.text.tertiary }]}>/mo</Text>
      </View>

      <Slider
        value={value}
        onChange={(v) => onExtraChange(String(v))}
        min={0}
        max={sliderMax}
        step={STEP}
        accessibilityLabel="Extra monthly payment"
      />

      <View style={styles.results}>
        {!simulating ? (
          <Text style={[textStyles.subhead, styles.center, { color: c.text.tertiary }]}>
            Drag or type an amount to see how much faster you’d be debt-free.
          </Text>
        ) : !result.canEstimate ? (
          <Text style={[textStyles.subhead, styles.center, { color: c.text.tertiary }]}>
            Can’t estimate a payoff date with the current plan.
          </Text>
        ) : where ? (
          <Text style={[textStyles.subhead, styles.center, { color: c.text.secondary }]}>{where}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs, gap: spacing.sm },
  readoutRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginTop: spacing.xs },
  readout: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  readoutInput: {
    minWidth: 70,
    maxWidth: 180,
    paddingVertical: 2,
    textAlign: 'center',
    borderBottomWidth: 2, // the subtle "tap to edit" affordance
  },
  per: { marginLeft: 2 },
  results: { marginTop: spacing.xs, gap: 3, minHeight: 24, justifyContent: 'center' },
  center: { textAlign: 'center' },
});
