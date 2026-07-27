import { View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';

/**
 * Faint placeholder shown while a Skia canvas's CanvasKit bundle loads on **web** (the `.web` canvases'
 * `fallback`), so a chart card never flashes empty. Native compiles Skia in, so this path isn't hit there.
 * A ghosted ring or a few gridlines — evokes the chart's shape at rest, in the subtlest border tint.
 */
export function ChartSkeleton(
  props: { shape: 'ring'; size: number; stroke?: number } | { shape: 'rect'; width: number; height: number },
) {
  const c = useAppColors();
  const tint = c.border.subtle;

  if (props.shape === 'ring') {
    const s = props.size;
    return <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: props.stroke ?? 12, borderColor: tint }} />;
  }

  const { width, height } = props;
  return (
    <View style={{ width, height, justifyContent: 'space-between', paddingVertical: height * 0.12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ height: 1, backgroundColor: tint }} />
      ))}
    </View>
  );
}
