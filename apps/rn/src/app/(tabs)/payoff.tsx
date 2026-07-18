import { MoreButton } from '@/components/more-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

/** Payoff tab. Real content — projections + Interest-Saved + amortization — lands at B.6. */
export default function PayoffScreen() {
  return (
    <Screen title="Payoff" right={<MoreButton />}>
      <Placeholder label="Payoff" note="Payoff projections + Interest-Saved + amortization — rebuilding in RN (B.6)." />
    </Screen>
  );
}
