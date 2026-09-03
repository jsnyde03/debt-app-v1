from _boot import *
G=[['npx','tsx','scripts/check-native-a11y-props.ts']]
P='apps/rn/src/components/SaveFailedBanner.tsx'
print('### control — the banned prop on one line')
with_plant(P, """
export const __ctl = <View accessibilityState={{ selected: true }} />;
""", G, tail=400)
print('### PLANT — the same prop, value wrapped by Prettier')
with_plant(P, """
export const __wrapped = (
  <View
    accessibilityState={{
      selected: true,
    }}
  />
);
""", G, tail=400)
print('### PLANT B — a wrapped `announceForAccessibility` call')
with_plant(P, """
export function __ann(m: string) {
  AccessibilityInfo.announceForAccessibility(
    m,
  );
}
""", G, tail=400)
