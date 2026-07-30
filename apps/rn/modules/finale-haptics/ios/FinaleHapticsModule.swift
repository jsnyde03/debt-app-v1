import ExpoModulesCore
import CoreHaptics

/**
 * VIS-1 — the bespoke debt-free FINALE haptic (iOS Core Haptics, on-device).
 *
 * `playFinale()` plays a hand-authored `CHHapticPattern`: a continuous rumble whose intensity ramps up
 * over ~0.9s (with rising accent taps), cresting into a big sharp transient exactly as the celebration
 * ring completes, then a soft settle. This is the emotional peak of the whole app (becoming debt-free),
 * so it earns a bespoke pattern instead of the generic `notificationSuccess` preset.
 *
 * Fire-and-forget + fully guarded: a haptics failure (unsupported hardware, engine error) must NEVER
 * crash the celebration — it silently no-ops. The JS side (`src/motion/haptics.ts`) resolves this module
 * lazily on iOS and falls back to an expo-haptics crescendo on Android / no-op on web.
 *
 * ⚠️ Device-QA only: the FEEL is verifiable only on real hardware (the simulator has no haptics) — tune
 * the envelope at Phase 6 ([[feedback_native_module_verification_gap]]). Compile/autolink is covered by
 * the Maestro simulator CI.
 */
public class FinaleHapticsModule: Module {
  private var engine: CHHapticEngine?

  public func definition() -> ModuleDefinition {
    Name("FinaleHaptics")

    Function("playFinale") {
      self.playFinale()
    }
  }

  private func playFinale() {
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
    do {
      if engine == nil {
        engine = try CHHapticEngine()
        // Auto-restart if the system resets/stops the engine (interruptions, backgrounding).
        engine?.resetHandler = { [weak self] in try? self?.engine?.start() }
        engine?.stoppedHandler = { _ in }
      }
      try engine?.start()
      let player = try engine?.makePlayer(with: try Self.finalePattern())
      try player?.start(atTime: 0)
    } catch {
      // Best-effort — never let a haptics error surface into the celebration.
    }
  }

  /** The hand-authored crescendo. build ≈ 0.9s (peaks with the ring sweep), then a ~0.5s settle. */
  private static func finalePattern() throws -> CHHapticPattern {
    let build = 0.9
    var events: [CHHapticEvent] = []
    var curves: [CHHapticParameterCurve] = []

    // 1) The building rumble — a continuous event whose intensity rises 0.2 → 1.0 across the build.
    events.append(CHHapticEvent(
      eventType: .hapticContinuous,
      parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.4),
      ],
      relativeTime: 0,
      duration: build
    ))
    curves.append(CHHapticParameterCurve(
      parameterID: .hapticIntensityControl,
      controlPoints: [
        CHHapticParameterCurve.ControlPoint(relativeTime: 0, value: 0.2),
        CHHapticParameterCurve.ControlPoint(relativeTime: build * 0.7, value: 0.7),
        CHHapticParameterCurve.ControlPoint(relativeTime: build, value: 1.0),
      ],
      relativeTime: 0
    ))

    // 2) Rising accent taps during the build (0.5 → 0.9 intensity).
    for (i, t) in [0.25, 0.55, 0.8].enumerated() {
      events.append(CHHapticEvent(
        eventType: .hapticTransient,
        parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(0.5 + Double(i) * 0.2)),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ],
        relativeTime: t
      ))
    }

    // 3) The peak — a full sharp transient as the ring completes to 100%.
    events.append(CHHapticEvent(
      eventType: .hapticTransient,
      parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8),
      ],
      relativeTime: build
    ))

    // 4) A soft settle just after the peak — intensity fades 0.5 → 0 over ~0.5s.
    let settleStart = build + 0.02
    events.append(CHHapticEvent(
      eventType: .hapticContinuous,
      parameters: [
        CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
        CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2),
      ],
      relativeTime: settleStart,
      duration: 0.5
    ))
    curves.append(CHHapticParameterCurve(
      parameterID: .hapticIntensityControl,
      controlPoints: [
        CHHapticParameterCurve.ControlPoint(relativeTime: settleStart, value: 0.5),
        CHHapticParameterCurve.ControlPoint(relativeTime: settleStart + 0.5, value: 0.0),
      ],
      relativeTime: 0
    ))

    return try CHHapticPattern(events: events, parameterCurves: curves)
  }
}
