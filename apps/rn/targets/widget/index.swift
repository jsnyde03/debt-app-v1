import SwiftUI
import WidgetKit

// The widget extension's entry point. A `WidgetBundle` (rather than a bare `@main` Widget) so the
// Live Activity (3.5.3) can join this same bundle without restructuring.
@main
struct DebtWidgetBundle: WidgetBundle {
    var body: some Widget {
        DebtWidget()
        // 3.5.3 — the Payday Countdown Live Activity joins the same bundle (no new target/bundle-id).
        // Deployment target is 16.1, so ActivityConfiguration is always available (no #available guard).
        PaydayLiveActivity()
    }
}
