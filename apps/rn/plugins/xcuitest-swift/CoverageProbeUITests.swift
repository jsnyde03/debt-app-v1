import XCTest

/// 4.1.6a.7 — THE PROBE, not a suite.
///
/// It exists to answer two capability questions that together gate ~16 `[D]` rows on the device
/// checklist and the re-scope of 4.1.9. Neither is a product assertion; both are "can this lane reach
/// this at all". Per the standing rule in `06-tutorial-interactions.yaml`: if a capability cannot be
/// made to work, ledger the check as device-owed — do NOT weaken it into something that passes.
///
///   ① SPRINGBOARD REACH. Every §5 (widget) and §6 (Live Activity / Dynamic Island) row is filed
///      device-only for one stated reason: "springboard surfaces outside the app under test". That is
///      true of Maestro. If XCUITest can see SpringBoard's element tree here, those rows are
///      reclassifiable and the widget/Live-Activity checks come onto the free simulator lane.
///
///   ② ACCESSIBILITY AUDIT. `performAccessibilityAudit()` is Apple's own audit (Xcode 15+) and covers
///      contrast · hit-target size · text clipped at AX sizes · missing or wrong traits — four of the
///      six bullets in the premium-accessibility sub-audit, which is currently 100% manual and which
///      🎯 Jason has said is the hardest for him to test ("VoiceOver pretty much locks down my phone").
///
/// ⚠️ Both probes report rather than fail on absence, EXCEPT where absence is the answer we need. A
/// probe that reds for an unrelated reason costs a 20-minute cycle and tells us nothing.
final class CoverageProbeUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    /// ① Can this lane see outside the app under test?
    func testSpringboardIsReachable() throws {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        springboard.activate()

        let reachable = springboard.wait(for: .runningForeground, timeout: 10)
        XCTAssertTrue(reachable, "SpringBoard did not come to the foreground — springboard reach is NOT available on this runner, and §5/§6 stay device-owed.")

        // The descendant count is the real signal: activating is not the same as being able to READ the
        // tree. If this is zero, XCUITest can front SpringBoard but not inspect it, which would not help.
        let elements = springboard.descendants(matching: .any).count
        print("PROBE springboard.reachable=\(reachable) springboard.elements=\(elements)")
        XCTAssertGreaterThan(elements, 0, "SpringBoard exposed no elements — reach without inspection does not unlock §5/§6.")
    }

    /// ② Does Apple's own accessibility audit run against this app on this runner?
    func testAccessibilityAuditRuns() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30), "the app under test never reached the foreground")

        guard #available(iOS 17.0, *) else {
            print("PROBE a11yAudit=unavailable reason=ios<17")
            throw XCTSkip("performAccessibilityAudit needs iOS 17+")
        }

        // ⚠️ Deliberately NON-FAILING on findings. This run establishes that the audit EXECUTES and what
        // it reports on the first screen; turning its findings into a gate is a separate, later decision
        // once the volume is known. A probe that reds on 40 pre-existing contrast findings tells us
        // nothing about whether the mechanism works.
        var findings = 0
        try app.performAccessibilityAudit { issue in
            findings += 1
            print("PROBE a11yIssue type=\(issue.auditType) detail=\(issue.detailedDescription ?? "—")")
            return true // handled — do not fail the test
        }
        print("PROBE a11yAudit=ran findings=\(findings)")
    }
}
