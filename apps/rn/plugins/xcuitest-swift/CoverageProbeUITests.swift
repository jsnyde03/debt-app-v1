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

        // ⛔ WAIT FOR CONTENT, NOT JUST FOREGROUND — otherwise `findings=0` is unreadable.
        // Run 31832030295 returned 0 findings on all four types, which is plausible (this app has
        // `a11y-axe`, `lint:a11y-props`, `lint:a11y-collapse` and the 3.5.3.9 audit over it) and
        // indistinguishable from *auditing an empty screen*: `.runningForeground` means the process is
        // frontmost, NOT that React has rendered. Requiring a known element first makes a zero mean
        // "audited and clean" instead of "audited nothing".
        // ⚠️ Reported, not asserted: if the element never appears the audit numbers below are not
        // trustworthy, and saying so is more useful than failing a probe whose job is to report.
        let anchor = app.descendants(matching: .any).matching(identifier: "tab-today").firstMatch
        let rendered = anchor.waitForExistence(timeout: 20)
        print("PROBE a11yAnchor id=tab-today rendered=\(rendered) elements=\(app.descendants(matching: .any).count)")

        guard #available(iOS 17.0, *) else {
            print("PROBE a11yAudit=unavailable reason=ios<17")
            throw XCTSkip("performAccessibilityAudit needs iOS 17+")
        }

        // ⚠️ Deliberately NON-FAILING on findings. This establishes that the audit EXECUTES and what it
        // reports on the first screen; turning its findings into a gate is a separate, later decision
        // once the volume is known. A probe that reds on 40 pre-existing contrast findings tells us
        // nothing about whether the mechanism works.
        //
        // ⛔ PER TYPE, BECAUSE THE WHOLE-APP AUDIT TIMED OUT AND ONE GUESS WOULD ONLY TEACH ONE THING.
        // Run 31830120940 ran the default `.all` audit for 47.7s and XCTest stopped it:
        //   Error Domain=com.apple.xcode.xctest.accessibilityAudit Code=-56 "Audit failed to complete in time"
        // ⚡ That is a SCOPING result, not a capability one — the mechanism is present and was invoked.
        // Narrowing to one guessed combination would cost a cycle and answer only whether THAT
        // combination fits. Auditing each type separately, timed, maps the whole space in one run: which
        // types complete, how slow each is, and how many findings each carries.
        //
        // These four are exactly the premium-a11y sub-audit's automatable bullets — contrast, hit-target
        // size, text clipped at AX sizes, and traits. Other types exist (`.dynamicType`,
        // `.elementDetection`, `.sufficientElementDescription`, `.action`, `.parentChild`); they are left
        // out deliberately, because every additional case is Swift that CANNOT be compile-checked off a
        // Mac and a wrong name costs a whole cycle. Add them once these four are known good.
        //
        // ⚠️ EVERY TYPE IS CAUGHT SEPARATELY AND NOTHING RETHROWS. One slow type must not abort the map —
        // that is the exact failure being diagnosed, and a probe that stops at the first red teaches one
        // thing per 20-minute cycle (4.1.1's rule).
        let auditTypes: [(String, XCUIAccessibilityAuditType)] = [
            ("contrast", .contrast),
            ("hitRegion", .hitRegion),
            ("textClipped", .textClipped),
            ("trait", .trait),
        ]

        for (name, auditType) in auditTypes {
            var findings = 0
            let started = Date()
            do {
                try app.performAccessibilityAudit(for: auditType) { _ in
                    findings += 1
                    return true // handled — do not fail the test
                }
                let secs = String(format: "%.1f", Date().timeIntervalSince(started))
                print("PROBE a11y type=\(name) status=completed seconds=\(secs) findings=\(findings)")
            } catch {
                let secs = String(format: "%.1f", Date().timeIntervalSince(started))
                print("PROBE a11y type=\(name) status=FAILED seconds=\(secs) findings=\(findings) error=\(error.localizedDescription)")
            }
        }
        print("PROBE a11yAudit=mapped types=\(auditTypes.count)")
    }
}
