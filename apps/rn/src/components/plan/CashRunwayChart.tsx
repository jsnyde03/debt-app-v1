import { useRef, useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import type { WaterFillResult } from '@core/cashflow/waterFill';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { haptics } from '@/motion';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { GuardianState } from '@/store/guardianSelectors';
import type { TimelineCycle } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

import { CashRunwayCanvas } from './CashRunwayCanvas';

const H = 176;
const PAD = { l: 8, r: 14, t: 18, b: 24 };

type Pt = { x: number; y: number };

/** Catmull-Rom → cubic-bezier smooth path (same curve the trajectory chart uses). */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const STATE_LABEL: Record<GuardianState, string> = { clear: 'Clear', tight: 'Tight', 'at-risk': 'Crunch' };

/**
 * The Cash Runway (2.4.9.6R) — the premium cushion forecast, a real data-viz (not prose). Plots each of
 * the next paychecks' BREATHING ROOM (`net` = income − essentials, the same floor-relative headroom the
 * Guardian's band is computed from) against the user's floor line — so a paycheck that falls BELOW the
 * line (a crunch the free clamped-at-$0 bars can't show) is visible. Tap any cycle for its plan. Numbers
 * are per-cycle (Income − Essentials = the value) — never the cumulative no-deploy balance that inflates.
 */
export function CashRunwayChart({ cycles, plan, floor }: { cycles: TimelineCycle[]; plan: WaterFillResult | null; floor: number }) {
  const c = useAppColors();
  const dark = useColorScheme() === 'dark';
  const [w, setW] = useState(0);
  const lastSweep = useRef<number | null>(null); // 3.4.2.3 drag-select detent tracker (hook — above any early return)

  // Default the selection to the nearest under-the-line cycle (the thing worth looking at), else cycle 0.
  const firstTight = cycles.findIndex((cy) => cy.net < floor - 1);
  const [selected, setSelected] = useState<number>(firstTight >= 0 ? firstTight : 0);
  const sel = Math.min(selected, cycles.length - 1);

  if (cycles.length < 2) return null;

  const values = cycles.map((cy) => cy.net);
  const rawMin = Math.min(0, floor, ...values);
  const rawMax = Math.max(floor, ...values);
  const pad = Math.max(50, (rawMax - rawMin) * 0.14);
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const plotL = PAD.l;
  const plotR = w - PAD.r;
  const plotBottom = H - PAD.b;
  const mapX = (i: number) => plotL + (cycles.length === 1 ? 0.5 : i / (cycles.length - 1)) * (plotR - plotL);
  const mapY = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const points = cycles.map((cy, i) => ({ x: mapX(i), y: mapY(cy.net), crunch: cy.net < floor - 1 }));
  const runwayPath = w > 0 ? smoothPath(points) : '';
  const areaPath =
    points.length >= 2 && w > 0
      ? `${runwayPath} L${points[points.length - 1].x.toFixed(1)},${plotBottom.toFixed(1)} L${points[0].x.toFixed(1)},${plotBottom.toFixed(1)} Z`
      : '';
  const floorY = mapY(floor);

  const palette = {
    lineFrom: c.accent.primary,
    lineTo: c.accent.primary,
    areaTop: dark ? 'rgba(91,157,255,0.24)' : 'rgba(47,102,234,0.16)',
    areaBottom: dark ? 'rgba(91,157,255,0)' : 'rgba(47,102,234,0)',
    floor: c.text.tertiary,
    crunch: c.accent.danger,
    dot: c.accent.primary,
    ring: c.accent.primary,
    ringCore: '#ffffff',
  };

  const cy = cycles[sel];
  const income = cy.paycheckAmount;
  const essentials = Math.max(0, cy.paycheckAmount - cy.net);
  const room = cy.net;
  const under = room < floor - 1 ? floor - room : 0;
  const stateColor = cy.guardianState === 'at-risk' ? c.accent.danger : cy.guardianState === 'tight' ? c.accent.warning : c.text.secondary;

  // The one honest, actionable hold: cycle-0's pre-funded reserve (what to keep from THIS paycheck for a
  // looming crunch). Per-cycle reserves aren't a user-facing figure (the water-fill's `reserveByCycle` is
  // a cumulative deploy-cap), so this is the only "set aside" number shown — and only when it's real.
  const holdNow = Math.max(0, plan?.prefundedReserve ?? 0);

  // 3.4.2.3 — drag-select: sweeping a finger across the chart moves the selection continuously (the
  // detail receipt below is the readout, so no floating overlay is needed). The per-cycle Pressables
  // still handle discrete taps + a11y; the container claims the gesture only on MOVE, so a plain tap
  // falls through to them and a drag sweeps. A light detent haptic ticks on each cycle change.
  const handleSweep = (e: GestureResponderEvent) => {
    if (!(w > 0) || cycles.length < 2) return;
    const frac = (e.nativeEvent.locationX - plotL) / Math.max(1, plotR - plotL);
    const i = Math.max(0, Math.min(cycles.length - 1, Math.round(frac * (cycles.length - 1))));
    if (i !== lastSweep.current) {
      lastSweep.current = i;
      setSelected(i);
      haptics.light();
    }
  };
  const endSweep = () => {
    lastSweep.current = null;
  };

  return (
    <Card>
      <View style={styles.head}>
        {/* T4.3 — "BREATHING ROOM" was a rogue synonym for the cushion. Not "YOUR CUSHION" either: this card
              renders ONLY on /cushion-forecast, whose title already reads "Your cushion forecast", so that
              would echo the heading one line below itself (and made getByText ambiguous, which is how it
              was caught). Names the VIEW, using the ruled noun. */}
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>CUSHION BY PAYCHECK</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>next {cycles.length} paychecks</Text>
      </View>

      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: H }}
        onMoveShouldSetResponder={() => w > 0 && cycles.length > 1}
        onResponderGrant={handleSweep}
        onResponderMove={handleSweep}
        onResponderRelease={endSweep}
        onResponderTerminate={endSweep}>
        {w > 0 && runwayPath ? (
          <>
            <CashRunwayCanvas
              width={w}
              height={H}
              runwayPath={runwayPath}
              areaPath={areaPath}
              floorY={floorY}
              plotLeft={plotL}
              plotRight={plotR}
              points={points}
              selected={{ x: points[sel].x, y: points[sel].y }}
              palette={palette}
            />
            {cycles.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setSelected(i)}
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(cycles[i].cycleStart)}, ${STATE_LABEL[cycles[i].guardianState]}`}
                style={[styles.tapCol, { left: mapX(i) - (plotR - plotL) / cycles.length / 2, width: (plotR - plotL) / cycles.length, height: H }]}
              />
            ))}
            {cycles.map((cyc, i) => (
              <Text key={`x${i}`} numberOfLines={1} style={[textStyles.caption, styles.xLabel, { left: mapX(i) - 24, top: plotBottom + 4, color: i === sel ? c.text.secondary : c.text.tertiary }]}>
                {shortDate(cyc.cycleStart)}
              </Text>
            ))}
          </>
        ) : null}
      </View>

      {/* Floor-line legend — out of the plot, so it can never overlap the runway. */}
      <View style={styles.legendRow}>
        <View style={[styles.dashSwatch, { borderColor: c.text.tertiary }]} />
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>your ${formatWhole(floor).replace('$', '')} line</Text>
      </View>

      {/* The premium action, when there's a real one: hold this from THIS paycheck for a looming crunch. */}
      {holdNow > 0 ? (
        <View style={[styles.holdRow, { backgroundColor: c.background.tertiary }]}>
          <AppIcon name="savings" size={18} color={c.accent.primary} />
          <Text style={[textStyles.subhead, styles.holdText, { color: c.text.secondary }]}>
            Guardian&apos;s setting aside <Text style={{ color: c.text.primary, fontWeight: '700' }}>{formatWhole(holdNow)}</Text> from this paycheck for a tight cycle ahead.
          </Text>
        </View>
      ) : null}

      {/* tap-to-expand: the selected cycle's plan — a compact receipt whose numbers reconcile. */}
      <View style={[styles.detail, { borderTopColor: c.border.subtle }]}>
        <View style={styles.detailHead}>
          <Text style={[textStyles.subhead, { color: c.text.primary, fontWeight: '700' }]}>{sel === 0 ? 'This paycheck' : shortDate(cy.cycleStart)}</Text>
          <View style={[styles.chip, { backgroundColor: c.background.tertiary }]}>
            <Text style={[textStyles.caption, { color: stateColor, fontWeight: '700' }]}>{STATE_LABEL[cy.guardianState]}</Text>
          </View>
        </View>
        <DetailRow label="Income" value={`+${formatWhole(income)}`} color={c.text.secondary} valueColor={c.text.primary} />
        <DetailRow label="Expenses & essentials" value={`−${formatWhole(essentials)}`} color={c.text.secondary} valueColor={c.text.primary} />
        <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />
        <DetailRow
          label="Left after essentials"
          value={under > 0 ? `${formatWhole(room)} · ${formatWhole(under)} under` : formatWhole(room)}
          color={c.text.primary}
          valueColor={under > 0 ? c.accent.danger : c.text.primary}
          bold
        />
      </View>
    </Card>
  );
}

function DetailRow({ label, value, color, valueColor, bold }: { label: string; value: string; color: string; valueColor: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[textStyles.subhead, { color, fontWeight: bold ? '700' : '400' }]}>{label}</Text>
      <Text style={[textStyles.subhead, { color: valueColor, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.xs },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  dashSwatch: { width: 14, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  xLabel: { position: 'absolute', width: 48, textAlign: 'center', fontSize: 10 },
  tapCol: { position: 'absolute', top: 0 },
  holdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, padding: spacing.sm, borderRadius: 10 },
  holdText: { flex: 1 },
  detail: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  detailHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});
