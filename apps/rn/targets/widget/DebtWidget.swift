import SwiftUI
import WidgetKit

/// The single widget that vends all six families (Small / Medium / Large home + circular /
/// rectangular / inline lock-screen). One `StaticConfiguration` switching on `widgetFamily` keeps the
/// timeline provider and data path shared across every size. `kind` MUST equal `WIDGET_KIND` in
/// `src/widget/widgetKeys.ts` so the app's `ExtensionStorage.reloadWidget(...)` targets it.
struct DebtWidget: Widget {
    let kind = "DebtWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DebtProvider()) { entry in
            DebtWidgetView(entry: entry)
        }
        .configurationDisplayName("Debt-Free Date")
        .description("Your debt-free date and payoff progress.")
        .supportedFamilies([
            .systemSmall, .systemMedium, .systemLarge,
            .accessoryCircular, .accessoryRectangular, .accessoryInline,
        ])
    }
}

struct DebtWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: DebtEntry

    var body: some View {
        content
            .widgetURL(URL(string: "debtplannerrn://")) // tap → opens the app
            .debtContainerBackground(family: family)
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .systemSmall: SmallWidgetView(snap: entry.snapshot)
        case .systemMedium: MediumWidgetView(snap: entry.snapshot)
        case .systemLarge: LargeWidgetView(snap: entry.snapshot)
        case .accessoryCircular: CircularWidgetView(snap: entry.snapshot)
        case .accessoryRectangular: RectangularWidgetView(snap: entry.snapshot)
        case .accessoryInline: InlineWidgetView(snap: entry.snapshot)
        default: SmallWidgetView(snap: entry.snapshot)
        }
    }
}

extension View {
    /// iOS 17+ requires `containerBackground(for: .widget)`. Home families get the branded navy
    /// surface; lock-screen accessory families get the system vibrant material (circular / rectangular)
    /// or nothing (inline), so they read correctly against any wallpaper.
    @ViewBuilder
    func debtContainerBackground(family: WidgetFamily) -> some View {
        let isAccessory =
            family == .accessoryCircular
            || family == .accessoryRectangular
            || family == .accessoryInline
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) {
                if isAccessory {
                    if family == .accessoryInline {
                        Color.clear
                    } else {
                        AccessoryWidgetBackground()
                    }
                } else {
                    Color("WidgetBackground")
                }
            }
        } else {
            self.background(isAccessory ? Color.clear : Color("WidgetBackground"))
        }
    }
}
